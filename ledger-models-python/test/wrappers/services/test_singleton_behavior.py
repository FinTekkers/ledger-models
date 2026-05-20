"""Singleton behavior tests for the Python service wrappers.

Per FinTekkers/ledger-models#223, each wrapper caches its gRPC channel
via a `__new__`-based singleton so consumers that instantiate
`SecurityService()` per call share a single underlying channel. This file
verifies that contract: two instantiations return the same object and
share the same `.stub`; the `_reset_for_tests()` hook restores a fresh
state.

The Transaction wrapper additionally supports explicit `stub=` injection
(used by `test_transaction_service.py`) — that path MUST remain
non-cached so tests that inject distinct mocks stay independent.
"""

from __future__ import annotations

import pytest

from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.price import PriceService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.services.valuation import ValuationService


@pytest.fixture(autouse=True)
def _reset_singletons():
    """Each test sees a fresh singleton state. Without this, ordering
    between tests in this file (and against any other test that
    instantiated a service wrapper) would leak."""
    for cls in (
        SecurityService,
        TransactionService,
        PriceService,
        PortfolioService,
        ValuationService,
    ):
        cls._reset_for_tests()
    yield
    for cls in (
        SecurityService,
        TransactionService,
        PriceService,
        PortfolioService,
        ValuationService,
    ):
        cls._reset_for_tests()


@pytest.mark.parametrize(
    "cls",
    [SecurityService, TransactionService, PriceService, PortfolioService, ValuationService],
)
def test_two_instantiations_return_same_singleton(cls):
    a = cls()
    b = cls()
    assert a is b, f"{cls.__name__}() must return the cached singleton"
    assert a.stub is b.stub, f"{cls.__name__} must reuse the same gRPC stub"


@pytest.mark.parametrize(
    "cls",
    [SecurityService, TransactionService, PriceService, PortfolioService, ValuationService],
)
def test_reset_for_tests_drops_cached_instance(cls):
    first = cls()
    cls._reset_for_tests()
    second = cls()
    assert first is not second, (
        f"{cls.__name__}._reset_for_tests() must drop the cached singleton"
    )


def test_transaction_service_stub_injection_bypasses_singleton():
    """The `stub=` escape hatch on TransactionService is used by unit
    tests that inject mock stubs. Each injection MUST return a fresh,
    independent instance — not the cached singleton — so that two
    tests instantiating with different mocks don't share state.
    """
    sentinel_a = object()
    sentinel_b = object()

    svc_a = TransactionService(stub=sentinel_a)  # type: ignore[arg-type]
    svc_b = TransactionService(stub=sentinel_b)  # type: ignore[arg-type]

    assert svc_a is not svc_b
    assert svc_a.stub is sentinel_a
    assert svc_b.stub is sentinel_b

    # And the cached (no-stub) singleton remains untouched.
    cached = TransactionService()
    assert cached is not svc_a
    assert cached is not svc_b
