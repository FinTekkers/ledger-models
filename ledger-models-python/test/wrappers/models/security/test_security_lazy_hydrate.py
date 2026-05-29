"""Lazy-hydrate tests for the Python Security wrapper.

Mirror of the Java SecurityLazyHydrateTest. Given/When/Then style. Covers:
  A — hydration is called on each non-link-safe accessor
  B — cache 3 sub-tests (first-call hydrates+populates, second-call no
      RPC, fresh-wrapper same uuid+asOf hits cache)
  C — asOf semantics (matching=hit, different=refetch, null+TTL)
  D — resolve failure (no fetcher, fetcher returns None)
  E — link-safe accessors (is_link, get_id, get_as_of) don't hydrate
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.security import security as sec_module
from fintekkers.wrappers.models.security.security import Security, set_security_fetcher
from fintekkers.wrappers.util import link_cache as lc


# ---------- helpers ----------

def _full_proto(uuid: UUID, as_of: datetime, asset_class: str = "Equity") -> SecurityProto:
    """Build a non-link-mode SecurityProto carrying the supplied uuid/asOf."""
    return Security(Security.link_of(uuid, as_of)).proto.__class__(
        uuid=Security.link_of(uuid, as_of).uuid,
        as_of=Security.link_of(uuid, as_of).as_of,
        asset_class=asset_class,
        issuer_name="ACME",
    )


class _FetcherSpy:
    """Records every call. Returns whatever ``resolved`` is set to."""

    def __init__(self, resolved: SecurityProto | None = None):
        self.calls: list[tuple[UUID, datetime | None]] = []
        self.resolved = resolved

    def __call__(self, uuid: UUID, as_of: datetime | None) -> SecurityProto | None:
        self.calls.append((uuid, as_of))
        return self.resolved


@pytest.fixture(autouse=True)
def _isolate():
    lc.SECURITY.clear()
    saved = sec_module._security_fetcher
    yield
    set_security_fetcher(saved)
    lc.SECURITY.clear()


# ---------- A. Hydration on accessors ----------

def test_a_get_asset_class_on_link_wrapper_invokes_fetcher_once():
    """Given a link-mode wrapper and an empty cache, when get_asset_class()
    is called, then the fetcher is invoked exactly once and the resolved
    value is returned."""
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    resolved = _full_proto(uuid, as_of, asset_class="Bond")
    fetcher = _FetcherSpy(resolved=resolved)
    set_security_fetcher(fetcher)

    wrapper = Security(Security.link_of(uuid, as_of))
    assert wrapper.is_link() is True

    assert wrapper.get_asset_class() == "Bond"
    assert len(fetcher.calls) == 1
    assert fetcher.calls[0][0] == uuid


def test_a_link_safe_accessors_do_not_invoke_fetcher():
    """Given a link-mode wrapper, when is_link()/get_id()/get_as_of() are
    called, then the fetcher is never invoked."""
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    fetcher = _FetcherSpy(resolved=_full_proto(uuid, as_of))
    set_security_fetcher(fetcher)

    wrapper = Security(Security.link_of(uuid, as_of))
    assert wrapper.is_link() is True
    assert wrapper.get_id() == uuid
    # get_as_of round-trips through proto serializer — its exact value
    # depends on tz handling, but the fetcher must not have been called.
    _ = wrapper.get_as_of()

    assert fetcher.calls == []


# ---------- B. Cache behavior ----------

def test_b_i_first_call_hydrates_and_populates_cache():
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    resolved = _full_proto(uuid, as_of, asset_class="Equity")
    fetcher = _FetcherSpy(resolved=resolved)
    set_security_fetcher(fetcher)

    wrapper = Security(Security.link_of(uuid, as_of))
    _ = wrapper.get_asset_class()

    assert len(fetcher.calls) == 1
    # Cache now has the resolved entry — read back at the same as_of.
    resolved_as_of = wrapper.get_as_of()
    assert lc.SECURITY.get(uuid, resolved_as_of) is not None


def test_b_ii_second_call_does_not_invoke_fetcher_again():
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    fetcher = _FetcherSpy(resolved=_full_proto(uuid, as_of, asset_class="Equity"))
    set_security_fetcher(fetcher)

    wrapper = Security(Security.link_of(uuid, as_of))
    _ = wrapper.get_asset_class()
    _ = wrapper.get_asset_class()
    _ = wrapper.get_identifiers()

    assert len(fetcher.calls) == 1


def test_b_iii_fresh_wrapper_same_uuid_asof_hits_cache():
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    fetcher = _FetcherSpy(resolved=_full_proto(uuid, as_of, asset_class="Equity"))
    set_security_fetcher(fetcher)

    # First wrapper warms the cache.
    Security(Security.link_of(uuid, as_of)).get_asset_class()
    assert len(fetcher.calls) == 1

    # Brand-new wrapper for the same (uuid, as_of) — must NOT invoke fetcher.
    fresh = Security(Security.link_of(uuid, as_of))
    assert fresh.get_asset_class() == "Equity"
    assert len(fetcher.calls) == 1  # still 1


# ---------- C. asOf semantics ----------

def test_c_ii_link_asof_differs_from_cached_forces_refetch():
    uuid = uuid4()
    as_of_t1 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    as_of_t2 = datetime(2026, 6, 1, tzinfo=timezone.utc)

    # Pre-warm the cache with the T2 vintage.
    t2_proto = _full_proto(uuid, as_of_t2, asset_class="T2-vintage")
    lc.SECURITY.put(uuid, t2_proto, as_of_t2)

    t1_proto = _full_proto(uuid, as_of_t1, asset_class="T1-vintage")
    fetcher = _FetcherSpy(resolved=t1_proto)
    set_security_fetcher(fetcher)

    wrapper = Security(Security.link_of(uuid, as_of_t1))
    assert wrapper.get_asset_class() == "T1-vintage"
    assert len(fetcher.calls) == 1
    assert fetcher.calls[0][1] == as_of_t1


# ---------- D. Resolve failure ----------

def test_d_no_fetcher_registered_raises_with_uuid_in_message():
    set_security_fetcher(None)
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    wrapper = Security(Security.link_of(uuid, as_of))

    with pytest.raises(RuntimeError, match=str(uuid)):
        wrapper.get_asset_class()


def test_d_fetcher_returns_none_raises():
    set_security_fetcher(_FetcherSpy(resolved=None))
    uuid = uuid4()
    as_of = datetime(2026, 1, 1, tzinfo=timezone.utc)
    wrapper = Security(Security.link_of(uuid, as_of))

    with pytest.raises(RuntimeError, match="Fetcher returned"):
        wrapper.get_asset_class()


# ---------- F. Default fetcher registered at module load ----------

def test_f_default_security_fetcher_is_registered_at_module_load():
    """Without any explicit set_security_fetcher() call at import time,
    a default fetcher MUST already be installed so user code that constructs
    a wrapper and reads fields Just Works against the default endpoint.

    This test imports the module fresh and asserts _security_fetcher is not
    None. The _isolate fixture restores whatever was there after the test,
    so this assertion doesn't depend on test order."""
    import importlib
    import fintekkers.wrappers.models.security.security as sec_module_fresh
    importlib.reload(sec_module_fresh)
    assert sec_module_fresh._security_fetcher is not None
    assert callable(sec_module_fresh._security_fetcher)
