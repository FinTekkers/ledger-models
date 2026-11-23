"""LM-482: Security.get_security_metric and get_security_metric_series read
only from the installed SecurityMetricFetcher, a fake here."""
from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from fintekkers.models.security.security_metric_type_pb2 import SecurityMetricTypeProto
from fintekkers.wrappers.models.security import security as sec_module
from fintekkers.wrappers.models.security.security import Security, set_security_fetcher
from fintekkers.wrappers.models.security.security_metric import (
    SecurityMetricFetcherMissing,
    SecurityMetricObservation,
    clear_security_metric_fetcher,
    set_security_metric_fetcher,
)
from fintekkers.wrappers.util import link_cache as lc


class _FakeFetcher:
    """Returns canned observations and records each call's arguments."""

    def __init__(self, latest=None, series=()):
        self._latest = latest
        self._series = list(series)
        self.calls: list[tuple] = []

    def latest(self, security_id: UUID, metric: int, d: date):
        self.calls.append(("latest", security_id, metric, d))
        return self._latest

    def series(self, security_id: UUID, metric: int, from_date: date, to_date: date):
        self.calls.append(("series", security_id, metric, from_date, to_date))
        return list(self._series)


def _link_fetcher_must_not_be_called(uuid, as_of):
    raise AssertionError(f"the link fetcher was called for {uuid}")


def _obs(value: str, d: date) -> SecurityMetricObservation:
    return SecurityMetricObservation(Decimal(value), d)


@pytest.fixture(autouse=True)
def _isolate():
    lc.SECURITY.clear()
    saved = sec_module._security_fetcher
    # Any link-fetcher call fails the test: the helpers must not hydrate.
    set_security_fetcher(_link_fetcher_must_not_be_called)
    clear_security_metric_fetcher()
    yield
    clear_security_metric_fetcher()
    set_security_fetcher(saved)
    lc.SECURITY.clear()


@pytest.fixture
def security_id() -> UUID:
    return uuid4()


@pytest.fixture
def security(security_id) -> Security:
    """A link-only security: uuid set, nothing else."""
    return Security(Security.link_of_latest(security_id))


def test_a_hit_returns_the_fetchers_value_and_observation_date(security, security_id):
    fake = _FakeFetcher(latest=_obs("1003282116", date(2024, 5, 31)))
    set_security_metric_fetcher(fake)

    got = security.get_security_metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, date(2024, 6, 3))

    # The observation's own date, not the date asked for.
    assert got == _obs("1003282116", date(2024, 5, 31))
    assert fake.calls == [("latest", security_id, SecurityMetricTypeProto.SHARES_OUTSTANDING, date(2024, 6, 3))]


def test_a_miss_returns_none_never_zero(security):
    set_security_metric_fetcher(_FakeFetcher(latest=None))
    assert security.get_security_metric(SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 6, 3)) is None


def test_a_real_zero_is_returned_as_zero(security):
    set_security_metric_fetcher(_FakeFetcher(latest=_obs("0", date(2024, 5, 31))))
    got = security.get_security_metric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, date(2024, 6, 3))
    assert got is not None and got.value == Decimal("0")


def test_the_series_comes_back_in_date_order_from_shuffled_input(security, security_id):
    fake = _FakeFetcher(series=[
        _obs("3", date(2024, 1, 4)),
        _obs("1", date(2024, 1, 2)),
        _obs("2", date(2024, 1, 3)),
    ])
    set_security_metric_fetcher(fake)

    got = security.get_security_metric_series(SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 1, 1), date(2024, 1, 31))

    assert got == [_obs("1", date(2024, 1, 2)), _obs("2", date(2024, 1, 3)), _obs("3", date(2024, 1, 4))]
    assert fake.calls == [
        ("series", security_id, SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 1, 1), date(2024, 1, 31)),
    ]


def _assert_no_fetcher_error(security):
    calls = (
        lambda: security.get_security_metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, date(2024, 6, 3)),
        lambda: security.get_security_metric_series(
            SecurityMetricTypeProto.SHARES_OUTSTANDING, date(2024, 1, 1), date(2024, 6, 3)),
    )
    for call in calls:
        with pytest.raises(SecurityMetricFetcherMissing) as raised:
            call()
        assert "SecurityMetricFetcher" in str(raised.value)
        assert "set_security_metric_fetcher" in str(raised.value)


def test_with_no_fetcher_both_helpers_name_the_missing_fetcher_and_clear_restores_it(security):
    _assert_no_fetcher_error(security)

    set_security_metric_fetcher(_FakeFetcher(latest=None))
    assert security.get_security_metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, date(2024, 6, 3)) is None
    clear_security_metric_fetcher()

    _assert_no_fetcher_error(security)


def test_a_link_only_security_returns_metric_data_without_calling_the_link_fetcher(security):
    set_security_metric_fetcher(_FakeFetcher(
        latest=_obs("512.3456", date(2024, 5, 31)),
        series=[_obs("1", date(2024, 1, 2))],
    ))

    assert security.get_security_metric(SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 6, 3)) == \
        _obs("512.3456", date(2024, 5, 31))
    assert security.get_security_metric_series(
        SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 1, 1), date(2024, 6, 3)) == [_obs("1", date(2024, 1, 2))]
    assert security.proto.is_link


def test_a_series_with_from_after_to_is_rejected_before_the_fetcher(security):
    fake = _FakeFetcher()
    set_security_metric_fetcher(fake)
    with pytest.raises(ValueError):
        security.get_security_metric_series(SecurityMetricTypeProto.NAV_PER_SHARE, date(2024, 2, 1), date(2024, 1, 1))
    assert fake.calls == []
