"""LinkCache — process-level cache of resolved entity protos keyed by uuid.

Companion to the Java common.util.LinkCache. Mirrors the same semantics:

* Single-slot per uuid (newest-asOf-wins on put).
* Reads validate the as_of: exact match returns the entry; mismatch returns
  None so the caller refetches the requested vintage.
* `as_of=None` on a read means "latest acceptable" — TTL-bounded; entries
  older than TTL_FOR_LATEST return None and force a refresh. Entries with
  a non-null as_of never TTL-expire (bitemporal history doesn't change).

See `docs/adr/lazy-link-hydration.md` for the design.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime
from typing import Generic, Optional, TypeVar
from uuid import UUID

T = TypeVar("T")

DEFAULT_TTL_FOR_LATEST_SECONDS = 60.0


class _Entry(Generic[T]):
    __slots__ = ("value", "as_of", "cached_at_monotonic")

    def __init__(self, value: T, as_of: Optional[datetime], cached_at_monotonic: float):
        self.value = value
        self.as_of = as_of
        self.cached_at_monotonic = cached_at_monotonic


class LinkCache(Generic[T]):
    def __init__(self, ttl_for_latest_seconds: float = DEFAULT_TTL_FOR_LATEST_SECONDS):
        self._ttl = ttl_for_latest_seconds
        self._map: dict[UUID, _Entry[T]] = {}
        self._lock = threading.Lock()

    def get(self, uuid: UUID, requested_as_of: Optional[datetime]) -> Optional[T]:
        with self._lock:
            entry = self._map.get(uuid)
            if entry is None:
                return None
            if requested_as_of is None:
                if time.monotonic() - entry.cached_at_monotonic > self._ttl:
                    return None
                return entry.value
            if entry.as_of is None:
                return None
            return entry.value if entry.as_of == requested_as_of else None

    def put(self, uuid: UUID, value: T, as_of: Optional[datetime]) -> None:
        with self._lock:
            existing = self._map.get(uuid)
            if existing is not None and existing.as_of is not None and as_of is not None:
                if existing.as_of > as_of:
                    return
            self._map[uuid] = _Entry(value, as_of, time.monotonic())

    def evict(self, uuid: UUID) -> None:
        with self._lock:
            self._map.pop(uuid, None)

    def clear(self) -> None:
        with self._lock:
            self._map.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._map)


SECURITY: LinkCache = LinkCache()
PORTFOLIO: LinkCache = LinkCache()
PRICE: LinkCache = LinkCache()
TRANSACTION: LinkCache = LinkCache()
