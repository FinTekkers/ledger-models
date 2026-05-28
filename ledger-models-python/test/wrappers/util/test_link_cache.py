"""Unit tests for LinkCache (Python mirror of Java common.util.LinkCacheTest).

Validates asOf-keyed get, TTL bounding for null-asOf reads, newest-wins
put merge, evict/clear, singleton isolation.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone, timedelta
from uuid import uuid4

import pytest

from fintekkers.wrappers.util import link_cache as lc


# ---------- Fresh-cache fixture: clear the four shared singletons. ----------

@pytest.fixture(autouse=True)
def _clear_caches():
    lc.SECURITY.clear()
    lc.PORTFOLIO.clear()
    lc.PRICE.clear()
    lc.TRANSACTION.clear()
    yield
    lc.SECURITY.clear()
    lc.PORTFOLIO.clear()
    lc.PRICE.clear()
    lc.TRANSACTION.clear()


def _ts(seconds_offset: float = 0.0) -> datetime:
    return datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(seconds=seconds_offset)


# ---------- A. Basic get/put ----------

def test_get_on_empty_cache_returns_none():
    assert lc.SECURITY.get(uuid4(), _ts()) is None


def test_put_then_get_with_matching_asof_returns_value():
    uuid = uuid4()
    as_of = _ts()
    lc.SECURITY.put(uuid, "sentinel", as_of)
    assert lc.SECURITY.get(uuid, as_of) == "sentinel"


def test_get_with_different_asof_returns_none():
    uuid = uuid4()
    lc.SECURITY.put(uuid, "v1", _ts(0))
    assert lc.SECURITY.get(uuid, _ts(10)) is None


# ---------- B. Null as_of semantics ----------

def test_null_asof_within_ttl_returns_value():
    cache = lc.LinkCache(ttl_for_latest_seconds=60.0)
    uuid = uuid4()
    cache.put(uuid, "v1", _ts())
    assert cache.get(uuid, None) == "v1"


def test_null_asof_past_ttl_returns_none():
    cache = lc.LinkCache(ttl_for_latest_seconds=0.05)
    uuid = uuid4()
    cache.put(uuid, "v1", _ts())
    time.sleep(0.1)
    assert cache.get(uuid, None) is None


def test_non_null_asof_is_not_subject_to_ttl():
    cache = lc.LinkCache(ttl_for_latest_seconds=0.05)
    uuid = uuid4()
    as_of = _ts()
    cache.put(uuid, "v1", as_of)
    time.sleep(0.1)
    # Bitemporal: history doesn't change, exact-asOf reads never expire.
    assert cache.get(uuid, as_of) == "v1"


# ---------- C. Newest-wins put merge ----------

def test_put_with_older_asof_does_not_overwrite_newer():
    uuid = uuid4()
    lc.SECURITY.put(uuid, "newer", _ts(100))
    lc.SECURITY.put(uuid, "older", _ts(50))
    assert lc.SECURITY.get(uuid, _ts(100)) == "newer"
    # The older put didn't displace; reading at the older as_of is a miss.
    assert lc.SECURITY.get(uuid, _ts(50)) is None


def test_put_with_newer_asof_replaces_older():
    uuid = uuid4()
    lc.SECURITY.put(uuid, "older", _ts(50))
    lc.SECURITY.put(uuid, "newer", _ts(100))
    assert lc.SECURITY.get(uuid, _ts(100)) == "newer"


# ---------- D. Evict & clear ----------

def test_evict_removes_entry():
    uuid = uuid4()
    lc.SECURITY.put(uuid, "v1", _ts())
    lc.SECURITY.evict(uuid)
    assert lc.SECURITY.get(uuid, _ts()) is None


def test_clear_empties_cache():
    lc.SECURITY.put(uuid4(), "a", _ts())
    lc.SECURITY.put(uuid4(), "b", _ts())
    lc.SECURITY.clear()
    assert lc.SECURITY.size() == 0


# ---------- E. Singleton isolation ----------

def test_singletons_have_independent_state():
    uuid = uuid4()
    lc.SECURITY.put(uuid, "sec", _ts())
    assert lc.PORTFOLIO.get(uuid, _ts()) is None
    assert lc.PRICE.get(uuid, _ts()) is None
    assert lc.TRANSACTION.get(uuid, _ts()) is None
