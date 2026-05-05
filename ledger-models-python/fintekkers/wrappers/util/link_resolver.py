"""
LinkResolver — bulk hydration of `is_link=true` entity references into
full entities. Implements the consumer side of the `is_link` pattern
documented in `docs/adr/is_link_pattern.md` (and the technical-details
addendum that codifies the (uuid, as_of) cache key + per-bucket batching
contract).

Two surface methods:
  - get_security(uuid, as_of=None) / get_portfolio(uuid, as_of=None):
    single-UUID resolution. Cached and concurrent-deduped on (uuid, as_of).
  - resolve_securities(items) / resolve_portfolios(items): bulk in-place
    mutation across a list of items that each have a proto with the
    embedded entity. Collects unique link (uuid, as_of) pairs, groups by
    as_of, fires one batched GetByIds RPC per as_of bucket (the request
    proto carries a single as_of), mutates each item's proto to swap the
    link sub-message for the resolved full entity.

Caching:
  - Process-level LRU keyed on (uuid, as_of). Default 1000 entries, no TTL
    (entries live until evicted by LRU). Set ttl_ms=<int> for a per-entry
    TTL. Set cache_size=0 to disable caching (useful in tests).
  - Concurrent same-(uuid, as_of) requests dedupe via an in-flight Future
    map under a lock — N parallel callers share one RPC.

RPC choice: GetByIds (unary, UUID-keyed bulk) per the ADR.

Mutation semantic: mutates the *embedded* sub-message in place. Outer
Price.proto.is_link is unchanged; only the inner SecurityProto is swapped
from link-stub to full entity. Wrapper objects that read through the proto
(`price.get_security()`) automatically see the resolved data.

Time-travel: when the link sub-message has `as_of` set, the resolver
fetches the version of the entity at that timestamp; otherwise latest.
Bucketing required because GetByIds carries one as_of per request.
"""

from __future__ import annotations

import base64
import threading
import time
from collections import OrderedDict
from concurrent.futures import Future
from typing import Iterable, Optional, TypeVar
from uuid import UUID

import grpc

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import (
    QueryPortfolioRequestProto,
)
from fintekkers.requests.security.query_security_request_pb2 import (
    QuerySecurityRequestProto,
)
from fintekkers.services.portfolio_service.portfolio_service_pb2_grpc import (
    PortfolioStub,
)
from fintekkers.services.security_service.security_service_pb2_grpc import SecurityStub
from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType


T = TypeVar("T")

_LATEST_BUCKET = "latest"


def _as_of_key(as_of: Optional[LocalTimestampProto]) -> str:
    """Stable serialization of LocalTimestampProto for cache keys + bucket
    grouping. Returns the literal "latest" when as_of is None or unset
    so that "field absent" and "explicit None" collapse to one bucket.
    Two LocalTimestampProto instances representing the same moment produce
    the same key (proto3 binary encoding is canonical).
    """
    if as_of is None:
        return _LATEST_BUCKET
    return base64.b64encode(as_of.SerializeToString()).decode("ascii")


def _link_as_of(sub_message) -> Optional[LocalTimestampProto]:
    """Return the as_of from a link sub-message, or None if unset.
    `sub_message` is a SecurityProto / PortfolioProto / etc. with `is_link`."""
    if not sub_message.HasField("as_of"):
        return None
    return sub_message.as_of


class _TinyLRU:
    """Thread-safe LRU. OrderedDict bumps to most-recently-used on get;
    evicts oldest on overflow. Avoids depending on cachetools."""

    def __init__(self, max_size: int, ttl_ms: Optional[int] = None):
        self._max_size = max_size
        self._ttl_ms = ttl_ms
        self._data: OrderedDict[str, tuple[object, float]] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str):
        if self._max_size == 0:
            return None
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            value, inserted_at = entry
            if self._ttl_ms is not None and (time.monotonic() - inserted_at) * 1000 > self._ttl_ms:
                self._data.pop(key, None)
                return None
            self._data.move_to_end(key)
            return value

    def set(self, key: str, value) -> None:
        if self._max_size == 0:
            return
        with self._lock:
            if key in self._data:
                self._data.move_to_end(key)
            self._data[key] = (value, time.monotonic())
            while len(self._data) > self._max_size:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


class LinkResolver:
    """See module docstring."""

    def __init__(
        self,
        cache_size: int = 1000,
        ttl_ms: Optional[int] = None,
        security_stub: Optional[SecurityStub] = None,
        portfolio_stub: Optional[PortfolioStub] = None,
    ):
        """
        :param cache_size: LRU max entries. 0 disables caching.
        :param ttl_ms: per-entry TTL in milliseconds; None = no expiry.
        :param security_stub: test injection point. Production callers
            should leave None; the resolver constructs the default stub.
        :param portfolio_stub: same as security_stub.
        """
        self._security_cache: _TinyLRU = _TinyLRU(cache_size, ttl_ms)
        self._portfolio_cache: _TinyLRU = _TinyLRU(cache_size, ttl_ms)

        self._security_inflight: dict[str, Future] = {}
        self._portfolio_inflight: dict[str, Future] = {}
        self._sec_inflight_lock = threading.Lock()
        self._port_inflight_lock = threading.Lock()

        if security_stub is None:
            security_stub = SecurityStub(
                EnvConfig.get_channel(ServiceType.SECURITY_SERVICE)
            )
        if portfolio_stub is None:
            portfolio_stub = PortfolioStub(
                EnvConfig.get_channel(ServiceType.PORTFOLIO_SERVICE)
            )
        self._security_stub = security_stub
        self._portfolio_stub = portfolio_stub

    # ---------- single-UUID accessors ----------

    def get_security(
        self, uuid: UUID, as_of: Optional[LocalTimestampProto] = None
    ) -> SecurityProto:
        """Resolve a single SecurityProto by UUID. If `as_of` is given,
        fetch the version at that timestamp; otherwise latest. Cached +
        concurrent-deduped on (uuid, as_of). Raises if not found."""
        key = f"{uuid}@{_as_of_key(as_of)}"
        cached = self._security_cache.get(key)
        if cached is not None:
            return cached

        # In-flight dedupe.
        with self._sec_inflight_lock:
            existing = self._security_inflight.get(key)
            if existing is not None:
                future = existing
            else:
                future = Future()
                self._security_inflight[key] = future
                owner = True
                # mark closure-ownership
                # (sentinel via local var, see below)

        if existing is not None:
            return future.result()

        try:
            protos = self._batch_fetch_securities([uuid], as_of)
            if not protos:
                raise LookupError(f"Security not found: {uuid}@{_as_of_key(as_of)}")
            proto = protos[0]
            self._security_cache.set(key, proto)
            future.set_result(proto)
            return proto
        except BaseException as e:
            future.set_exception(e)
            raise
        finally:
            with self._sec_inflight_lock:
                self._security_inflight.pop(key, None)

    def get_portfolio(
        self, uuid: UUID, as_of: Optional[LocalTimestampProto] = None
    ) -> PortfolioProto:
        """Resolve a single PortfolioProto by UUID, optionally as of `as_of`.
        Cached + concurrent-deduped on (uuid, as_of)."""
        key = f"{uuid}@{_as_of_key(as_of)}"
        cached = self._portfolio_cache.get(key)
        if cached is not None:
            return cached

        with self._port_inflight_lock:
            existing = self._portfolio_inflight.get(key)
            if existing is not None:
                future = existing
            else:
                future = Future()
                self._portfolio_inflight[key] = future

        if existing is not None:
            return future.result()

        try:
            protos = self._batch_fetch_portfolios([uuid], as_of)
            if not protos:
                raise LookupError(f"Portfolio not found: {uuid}@{_as_of_key(as_of)}")
            proto = protos[0]
            self._portfolio_cache.set(key, proto)
            future.set_result(proto)
            return proto
        except BaseException as e:
            future.set_exception(e)
            raise
        finally:
            with self._port_inflight_lock:
                self._portfolio_inflight.pop(key, None)

    # ---------- bulk accessors ----------

    def resolve_securities(self, items: Iterable[T]) -> list[T]:
        """Walk `items`, find ones whose embedded security is is_link=true,
        batch-fetch the unique (uuid, as_of) pairs (one GetByIds RPC per
        as_of bucket), and mutate each item's proto in place so subsequent
        `item.proto.security.<field>` reads return the full entity.

        `items` must each have a `.proto` attribute carrying a `security`
        sub-message (Price, Transaction, etc.).
        """
        items_list = list(items)
        if not items_list:
            return items_list

        # Group: bucket_key → {cache_key → (uuid, as_of)} of items not cached.
        buckets: dict[str, dict[str, tuple[UUID, Optional[LocalTimestampProto]]]] = {}
        for item in items_list:
            sec = item.proto.security if item.proto.HasField("security") else None
            if sec is None or not sec.is_link:
                continue
            uuid_obj = UUID(bytes=bytes(sec.uuid.raw_uuid))
            as_of = _link_as_of(sec)
            bucket_key = _as_of_key(as_of)
            cache_key = f"{uuid_obj}@{bucket_key}"
            if self._security_cache.get(cache_key) is not None:
                continue
            bucket = buckets.setdefault(bucket_key, {})
            bucket.setdefault(cache_key, (uuid_obj, as_of))

        # Fire one RPC per bucket. Sequential (Python sync gRPC). Could be
        # parallelized via concurrent.futures if profiling shows benefit.
        for bucket_key, entries in buckets.items():
            uuids = [v[0] for v in entries.values()]
            as_of = next(iter(entries.values()))[1]  # all entries in a bucket share as_of
            fetched = self._batch_fetch_securities(uuids, as_of)
            for proto in fetched:
                uuid_obj = UUID(bytes=bytes(proto.uuid.raw_uuid))
                self._security_cache.set(f"{uuid_obj}@{bucket_key}", proto)

        # Mutate each item in place.
        for item in items_list:
            if not item.proto.HasField("security"):
                continue
            sec = item.proto.security
            if not sec.is_link:
                continue
            uuid_obj = UUID(bytes=bytes(sec.uuid.raw_uuid))
            bucket_key = _as_of_key(_link_as_of(sec))
            resolved = self._security_cache.get(f"{uuid_obj}@{bucket_key}")
            if resolved is not None:
                item.proto.security.CopyFrom(resolved)

        return items_list

    def resolve_portfolios(self, items: Iterable[T]) -> list[T]:
        """Same shape as resolve_securities, for embedded PortfolioProto."""
        items_list = list(items)
        if not items_list:
            return items_list

        buckets: dict[str, dict[str, tuple[UUID, Optional[LocalTimestampProto]]]] = {}
        for item in items_list:
            port = item.proto.portfolio if item.proto.HasField("portfolio") else None
            if port is None or not port.is_link:
                continue
            uuid_obj = UUID(bytes=bytes(port.uuid.raw_uuid))
            as_of = _link_as_of(port)
            bucket_key = _as_of_key(as_of)
            cache_key = f"{uuid_obj}@{bucket_key}"
            if self._portfolio_cache.get(cache_key) is not None:
                continue
            bucket = buckets.setdefault(bucket_key, {})
            bucket.setdefault(cache_key, (uuid_obj, as_of))

        for bucket_key, entries in buckets.items():
            uuids = [v[0] for v in entries.values()]
            as_of = next(iter(entries.values()))[1]
            fetched = self._batch_fetch_portfolios(uuids, as_of)
            for proto in fetched:
                uuid_obj = UUID(bytes=bytes(proto.uuid.raw_uuid))
                self._portfolio_cache.set(f"{uuid_obj}@{bucket_key}", proto)

        for item in items_list:
            if not item.proto.HasField("portfolio"):
                continue
            port = item.proto.portfolio
            if not port.is_link:
                continue
            uuid_obj = UUID(bytes=bytes(port.uuid.raw_uuid))
            bucket_key = _as_of_key(_link_as_of(port))
            resolved = self._portfolio_cache.get(f"{uuid_obj}@{bucket_key}")
            if resolved is not None:
                item.proto.portfolio.CopyFrom(resolved)

        return items_list

    def clear_cache(self) -> None:
        """Test/debug helper. Not part of the stable API."""
        self._security_cache.clear()
        self._portfolio_cache.clear()
        with self._sec_inflight_lock:
            self._security_inflight.clear()
        with self._port_inflight_lock:
            self._portfolio_inflight.clear()

    # ---------- internals ----------

    def _batch_fetch_securities(
        self, uuids: list[UUID], as_of: Optional[LocalTimestampProto]
    ) -> list[SecurityProto]:
        if not uuids:
            return []
        request = QuerySecurityRequestProto(
            object_class="SecurityRequest",
            version="0.0.1",
            uuIds=[UUIDProto(raw_uuid=u.bytes) for u in uuids],
        )
        if as_of is not None:
            request.as_of.CopyFrom(as_of)
        response = self._security_stub.GetByIds(request)
        return list(response.security_response)

    def _batch_fetch_portfolios(
        self, uuids: list[UUID], as_of: Optional[LocalTimestampProto]
    ) -> list[PortfolioProto]:
        if not uuids:
            return []
        request = QueryPortfolioRequestProto(
            object_class="PortfolioRequest",
            version="0.0.1",
            uuIds=[UUIDProto(raw_uuid=u.bytes) for u in uuids],
        )
        if as_of is not None:
            request.as_of.CopyFrom(as_of)
        response = self._portfolio_stub.GetByIds(request)
        return list(response.portfolio_response)
