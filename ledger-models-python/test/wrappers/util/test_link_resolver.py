"""
Unit tests for the Python LinkResolver.

Mocks the gRPC stubs so these are pure unit tests — no `@pytest.mark.integration`.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security.query_security_response_pb2 import (
    QuerySecurityResponseProto,
)
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.util.link_resolver import LinkResolver


# ---------- helpers ----------

class _SecurityCallLog:
    """Records every getByIds call: requested UUIDs and as_of (epoch
    seconds, or None if unset). Lets tests assert per-bucket RPC behavior."""

    def __init__(self):
        self.count = 0
        self.uuids: list[list[str]] = []
        self.as_of_seconds: list[Optional[int]] = []


class _MockSecurityStub:
    def __init__(self, store: dict[str, SecurityProto], log: _SecurityCallLog):
        self._store = store
        self._log = log

    def GetByIds(self, request):
        requested_uuids = [
            str(UUID(bytes=bytes(u.raw_uuid))) for u in request.uuIds
        ]
        self._log.count += 1
        self._log.uuids.append(requested_uuids)
        if request.HasField("as_of"):
            self._log.as_of_seconds.append(request.as_of.timestamp.seconds)
        else:
            self._log.as_of_seconds.append(None)

        response = QuerySecurityResponseProto()
        for uuid_str in requested_uuids:
            proto = self._store.get(uuid_str)
            if proto is not None:
                response.security_response.append(proto)
        return response


def _full_security(uuid_obj: UUID, issuer_name: str) -> SecurityProto:
    return SecurityProto(
        object_class="Security",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        is_link=False,
        issuer_name=issuer_name,
        identifiers=[IdentifierProto(identifier_value=f"TICKER-{issuer_name}")],
    )


def _link_price(security_uuid: UUID, price_value: str, as_of: Optional[LocalTimestampProto] = None) -> Price:
    link_sec = SecurityProto(
        uuid=UUIDProto(raw_uuid=security_uuid.bytes),
        is_link=True,
    )
    if as_of is not None:
        link_sec.as_of.CopyFrom(as_of)

    proto = PriceProto(
        object_class="Price",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        security=link_sec,
    )
    return Price(proto)


def _make_as_of(epoch_seconds: int) -> LocalTimestampProto:
    ts = Timestamp(seconds=epoch_seconds, nanos=0)
    return LocalTimestampProto(timestamp=ts, time_zone="UTC")


def _new_resolver(store: dict[str, SecurityProto], log: _SecurityCallLog, **kwargs) -> LinkResolver:
    """LinkResolver with the security stub mocked. Portfolio stub left as
    a stub-shaped placeholder; tests that exercise portfolios should pass
    their own."""
    sec_stub = _MockSecurityStub(store, log)
    # Portfolio side not exercised by these tests — pass a never-called stub.
    class _NopPortfolioStub:
        def GetByIds(self, request):  # pragma: no cover - not exercised
            raise AssertionError("portfolio stub should not be called in this test")
    return LinkResolver(security_stub=sec_stub, portfolio_stub=_NopPortfolioStub(), **kwargs)


# ---------- tests ----------

def test_bulk_resolve_dedupes_uuids():
    """5 prices with 3 unique security UUIDs → 1 RPC, 3 UUIDs."""
    a, b, c = uuid4(), uuid4(), uuid4()
    store = {
        str(a): _full_security(a, "AAPL"),
        str(b): _full_security(b, "MSFT"),
        str(c): _full_security(c, "GOOG"),
    }
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    prices = [
        _link_price(a, "100"),
        _link_price(a, "101"),
        _link_price(b, "200"),
        _link_price(a, "102"),
        _link_price(c, "300"),
    ]

    resolver.resolve_securities(prices)

    assert log.count == 1
    assert len(log.uuids[0]) == 3
    assert set(log.uuids[0]) == {str(a), str(b), str(c)}

    # All embedded securities now hydrated.
    for p in prices:
        assert p.proto.security.is_link is False
        assert p.proto.security.issuer_name in {"AAPL", "MSFT", "GOOG"}


def test_cache_hit_skips_second_rpc():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    s1 = resolver.get_security(uuid)
    s2 = resolver.get_security(uuid)

    assert log.count == 1
    assert s1.issuer_name == "AAPL"
    assert s2.issuer_name == "AAPL"


def test_cache_disabled_re_rpcs():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log, cache_size=0)

    resolver.get_security(uuid)
    resolver.get_security(uuid)

    assert log.count == 2


def test_non_link_items_pass_through_unchanged():
    """Items whose embedded Security is already full → no RPC, no mutation."""
    log = _SecurityCallLog()
    resolver = _new_resolver({}, log)

    full_sec = _full_security(uuid4(), "AAPL")
    proto = PriceProto(
        object_class="Price",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        security=full_sec,
    )
    price = Price(proto)

    resolver.resolve_securities([price])
    assert log.count == 0
    assert price.proto.security.issuer_name == "AAPL"


def test_items_missing_security_skipped_cleanly():
    log = _SecurityCallLog()
    resolver = _new_resolver({}, log)

    proto = PriceProto(
        object_class="Price",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        # no security set
    )
    price = Price(proto)

    resolver.resolve_securities([price])
    assert log.count == 0


def test_cross_call_cache_reuse():
    a, b = uuid4(), uuid4()
    store = {
        str(a): _full_security(a, "AAPL"),
        str(b): _full_security(b, "MSFT"),
    }
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    resolver.resolve_securities([_link_price(a, "1"), _link_price(b, "2")])
    assert log.count == 1

    # Second call: both UUIDs cached → 0 additional RPCs.
    resolver.resolve_securities([_link_price(a, "3"), _link_price(b, "4")])
    assert log.count == 1


# ---------- as_of-aware (per is_link_pattern.md addendum) ----------

def test_link_without_as_of_omits_as_of_on_request():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    resolver.resolve_securities([_link_price(uuid, "1")])

    assert log.count == 1
    assert log.as_of_seconds[0] is None


def test_link_with_as_of_carries_as_of_on_request():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    t1 = _make_as_of(1_700_000_000)
    resolver.resolve_securities([_link_price(uuid, "1", t1)])

    assert log.count == 1
    assert log.as_of_seconds[0] == 1_700_000_000


def test_two_as_of_buckets_for_same_uuid_fire_separate_rpcs():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    t1 = _make_as_of(1_700_000_000)
    t2 = _make_as_of(1_800_000_000)

    resolver.resolve_securities([_link_price(uuid, "1", t1), _link_price(uuid, "2", t2)])

    assert log.count == 2
    assert set(log.as_of_seconds) == {1_700_000_000, 1_800_000_000}


def test_same_as_of_for_same_uuid_dedups_to_one_rpc():
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    t_a = _make_as_of(1_700_000_000)
    t_b = _make_as_of(1_700_000_000)  # same moment, different proto instance

    resolver.resolve_securities([_link_price(uuid, "1", t_a), _link_price(uuid, "2", t_b)])

    assert log.count == 1
    assert log.uuids[0] == [str(uuid)]


def test_cache_key_includes_as_of():
    """Latest cached doesn't serve a (uuid, t1) lookup, and vice versa."""
    uuid = uuid4()
    store = {str(uuid): _full_security(uuid, "AAPL")}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    t1 = _make_as_of(1_700_000_000)

    resolver.get_security(uuid)
    assert log.count == 1
    assert log.as_of_seconds[0] is None

    resolver.get_security(uuid, t1)
    assert log.count == 2
    assert log.as_of_seconds[1] == 1_700_000_000

    resolver.get_security(uuid, _make_as_of(1_700_000_000))
    assert log.count == 2  # cache hit on (uuid, t1)


# ---------- LinkCache write-through ----------

def _full_security_with_as_of(uuid_obj: UUID, issuer: str, as_of: LocalTimestampProto) -> SecurityProto:
    proto = _full_security(uuid_obj, issuer)
    proto.as_of.CopyFrom(as_of)
    return proto


def test_get_security_populates_link_cache():
    from fintekkers.wrappers.util import link_cache as _link_cache
    from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

    _link_cache.SECURITY.clear()
    uuid = uuid4()
    as_of = _make_as_of(1_700_000_000)
    store = {str(uuid): _full_security_with_as_of(uuid, "ACME", as_of)}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    out = resolver.get_security(uuid, as_of)
    assert out.issuer_name == "ACME"

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = _link_cache.SECURITY.get(uuid, as_of_dt)
    assert cached is not None, "LinkCache.SECURITY must contain the resolved proto after get_security"
    assert cached.issuer_name == "ACME"
    _link_cache.SECURITY.clear()


def test_resolve_securities_populates_link_cache():
    from fintekkers.wrappers.util import link_cache as _link_cache
    from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

    _link_cache.SECURITY.clear()
    uuid = uuid4()
    as_of = _make_as_of(1_700_000_001)
    store = {str(uuid): _full_security_with_as_of(uuid, "BULK", as_of)}
    log = _SecurityCallLog()
    resolver = _new_resolver(store, log)

    price = _link_price(uuid, "100", as_of)
    resolver.resolve_securities([price])

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = _link_cache.SECURITY.get(uuid, as_of_dt)
    assert cached is not None
    assert cached.issuer_name == "BULK"
    _link_cache.SECURITY.clear()
