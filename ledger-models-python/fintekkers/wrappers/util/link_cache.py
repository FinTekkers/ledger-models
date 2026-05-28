"""LinkCache — process-level cache of resolved entity protos keyed by uuid.

Companion to the Java common.util.LinkCache. Mirrors the same semantics:

* Single-slot per uuid (newest-asOf-wins on put).
* Reads validate the as_of: exact match returns the entry; mismatch returns
  None so the caller refetches the requested vintage.
* `as_of=None` on a read means "latest acceptable" — TTL-bounded; entries
  older than TTL_FOR_LATEST return None and force a refresh. Entries with
  a non-null as_of never TTL-expire (bitemporal history doesn't change).
* Bounded LRU eviction — when the cache fills, the least-recently-used
  entry is dropped on the next `put`. Per-entity defaults reflect the
  typical access pattern: Portfolio + Security entities change slowly so
  TTL is a day; Price + Transaction change quickly so TTL is short.

See `docs/adr/lazy-link-hydration.md` for the design.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from datetime import datetime
from typing import Generic, Optional, TypeVar
from uuid import UUID

T = TypeVar("T")

# Backwards-compat alias used by tests written against the original module.
DEFAULT_TTL_FOR_LATEST_SECONDS = 60.0


class _Entry(Generic[T]):
    __slots__ = ("value", "as_of", "cached_at_monotonic")

    def __init__(self, value: T, as_of: Optional[datetime], cached_at_monotonic: float):
        self.value = value
        self.as_of = as_of
        self.cached_at_monotonic = cached_at_monotonic


class LinkCache(Generic[T]):
    """Process-wide cache, bounded LRU, per-entity TTL for null-asOf reads.

    Construct with `ttl_for_latest_seconds` for the null-asOf TTL and
    `max_entries` for the LRU cap. Defaults: 60s TTL, 10_000 entries.
    The four shipped singletons below override both.
    """

    def __init__(
        self,
        ttl_for_latest_seconds: float = DEFAULT_TTL_FOR_LATEST_SECONDS,
        max_entries: int = 10_000,
    ):
        if max_entries <= 0:
            raise ValueError(f"max_entries must be > 0, got {max_entries}")
        self._ttl = ttl_for_latest_seconds
        self._max_entries = max_entries
        # OrderedDict so we can move-to-end on access (LRU) and popitem(last=False)
        # the least-recently-used on overflow.
        self._map: "OrderedDict[UUID, _Entry[T]]" = OrderedDict()
        self._lock = threading.Lock()

    def get(self, uuid: UUID, requested_as_of: Optional[datetime]) -> Optional[T]:
        with self._lock:
            entry = self._map.get(uuid)
            if entry is None:
                return None
            if requested_as_of is None:
                if time.monotonic() - entry.cached_at_monotonic > self._ttl:
                    return None
            else:
                if entry.as_of is None:
                    return None
                if entry.as_of != requested_as_of:
                    return None
            # Hit — bump recency.
            self._map.move_to_end(uuid)
            return entry.value

    def put(self, uuid: UUID, value: T, as_of: Optional[datetime]) -> None:
        with self._lock:
            existing = self._map.get(uuid)
            if existing is not None and existing.as_of is not None and as_of is not None:
                if existing.as_of > as_of:
                    # Older-vintage write never displaces a newer cached entry.
                    # Still bump recency: the caller saw a fresh reference.
                    self._map.move_to_end(uuid)
                    return
            self._map[uuid] = _Entry(value, as_of, time.monotonic())
            self._map.move_to_end(uuid)
            while len(self._map) > self._max_entries:
                self._map.popitem(last=False)

    def evict(self, uuid: UUID) -> None:
        with self._lock:
            self._map.pop(uuid, None)

    def clear(self) -> None:
        with self._lock:
            self._map.clear()

    def size(self) -> int:
        with self._lock:
            return len(self._map)


# Per-entity TTL + cap defaults. Captured in the original LinkCache.java
# planning note. Tune freely — these are bounded heuristics, not invariants.
#
#   Portfolio / Security: 1-day TTL on null-as_of reads (entities change
#       infrequently); large caps because the universe is large but each
#       entry is small.
#   Transaction: 1-minute TTL (high churn).
#   Price: 30-second TTL (very high churn).
SECURITY: LinkCache = LinkCache(ttl_for_latest_seconds=86_400.0, max_entries=100_000)
PORTFOLIO: LinkCache = LinkCache(ttl_for_latest_seconds=86_400.0, max_entries=10_000)
PRICE: LinkCache = LinkCache(ttl_for_latest_seconds=30.0, max_entries=200_000)
TRANSACTION: LinkCache = LinkCache(ttl_for_latest_seconds=60.0, max_entries=100_000)
