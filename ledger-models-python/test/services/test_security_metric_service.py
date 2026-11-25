"""LM-485: Security.get_metric, the shortcuts and SecurityMetricService against
a fake SecurityMetric gRPC server, through the default gRPC client whose
address comes from the environment (no fetcher installed)."""
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

import pytest
from security_metric_fake import FakeServer, closed_port, stamped_as_of

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.security_metric_type_pb2 import EXPENSE_RATIO, UNKNOWN_SECURITY_METRIC
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.security_metric import (
    NAV_PER_SHARE,
    RECORD_CHUNK_SIZE,
    SHARES_OUTSTANDING,
    InvalidMetricPoints,
    MissingSecurityId,
    ServiceUnavailable,
    UnknownMetric,
)
from fintekkers.wrappers.models.util.decimal import decode_decimal
from fintekkers.wrappers.services import security_metric as security_metric_service
from fintekkers.wrappers.services.security_metric import SecurityMetricService, set_security_metric_fetcher

SPY = UUID(bytes=bytes([1] * 16))
QQQ = UUID(bytes=bytes([2] * 16))
NEW = UUID(bytes=bytes([3] * 16))
UNKNOWN = UUID(bytes=bytes([9] * 16))
MONDAY = date(2026, 11, 23)
FRIDAY = date(2026, 11, 20)

# Every variable the address lookup reads.
LOOKUP_VARS = ["BROKER_HOST", "API_URL"] + [
    f"{prefix}_SERVICE_{part}"
    for prefix in ("BROKER", "LEDGER", "VALUATION", "PRICE")
    for part in ("HOST", "PORT")
]


def _point_to(monkeypatch, port: int) -> None:
    for var in LOOKUP_VARS:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("PRICE_SERVICE_HOST", "127.0.0.1")
    monkeypatch.setenv("PRICE_SERVICE_PORT", str(port))


@pytest.fixture(autouse=True)
def isolated():
    set_security_metric_fetcher(None)
    SecurityMetricService._reset_for_tests()
    yield
    set_security_metric_fetcher(None)
    SecurityMetricService._reset_for_tests()


@pytest.fixture
def fake(monkeypatch):
    server = FakeServer()
    server.servicer.seed(SPY, SHARES_OUTSTANDING, {
        date(2026, 11, 19): "15204137000",
        FRIDAY: "15210000000",
    })
    _point_to(monkeypatch, server.port)
    yield server.servicer
    server.stop()


def spy() -> Security:
    # A link holds only the UUID; get_metric needs nothing more.
    return Security(Security.link_of_latest(SPY))


def test_monday_returns_fridays_point_and_the_shortcut_agrees(fake):
    result = spy().get_metric(SHARES_OUTSTANDING, on=MONDAY)
    assert len(fake.get_latest_requests) == 1
    shortcut = spy().shares_outstanding(on=MONDAY)
    assert len(fake.get_latest_requests) == 2

    assert result.value == Decimal("15210000000")
    assert result.date == FRIDAY
    assert result.age_days == 3
    assert (shortcut.value, shortcut.date, shortcut.age_days) == (result.value, result.date, result.age_days)


def test_omitted_on_is_the_date_sent(fake):
    result = spy().get_metric(SHARES_OUTSTANDING)

    sent = fake.get_latest_requests[0].date
    sent_date = date(sent.year, sent.month, sent.day)
    assert result.on == sent_date
    assert result.age_days == (sent_date - result.date).days


def test_generic_get_metric_returns_the_expense_ratio_in_force_between_two_changes(fake):
    # LM-491: a sparse series, one point per change; GetLatest gives the ratio in force.
    fake.seed(QQQ, EXPENSE_RATIO, {date(2018, 1, 1): "0.0945", date(2026, 7, 1): "0.0900"})
    fund = Security(Security.link_of_latest(QQQ))
    between = date(2026, 3, 31)

    by_value = fund.get_metric(EXPENSE_RATIO, on=between)
    by_name = fund.get_metric("EXPENSE_RATIO", on=between)

    for result in (by_value, by_name):
        assert result.value == Decimal("0.0945")
        assert str(result.value) == "0.0945"
        assert result.date == date(2018, 1, 1)
    assert list(fake.get_latest_requests[0].metrics) == [EXPENSE_RATIO]


def test_absent_is_none_never_zero(fake):
    before_any_point = date(2026, 11, 1)
    assert spy().get_metric(SHARES_OUTSTANDING, on=before_any_point) is None
    assert spy().shares_outstanding(on=before_any_point) is None
    unknown = Security(Security.link_of_latest(UNKNOWN))
    assert unknown.get_metric(SHARES_OUTSTANDING, on=MONDAY) is None
    assert unknown.shares_outstanding(on=MONDAY) is None


def test_history_joins_chunks_ascending_and_keeps_the_gap(fake):
    days = [date(2026, 11, 16), date(2026, 11, 17), date(2026, 11, 18), date(2026, 11, 20), date(2026, 11, 23)]
    fake.seed(QQQ, NAV_PER_SHARE, {d: f"{500 + i}.25" for i, d in enumerate(days)})

    series = Security(Security.link_of_latest(QQQ)).get_metric_history(NAV_PER_SHARE, date(2026, 11, 1), MONDAY)
    shortcut = Security(Security.link_of_latest(QQQ)).nav_per_share_history(date(2026, 11, 1), MONDAY)

    assert [p.date for p in series.points] == days  # 11-19 stays a gap
    assert [p.value for p in series.points] == [Decimal(f"{500 + i}.25") for i in range(5)]
    assert series.latest == series.points[-1]
    assert series.to_dict() == {d: Decimal(f"{500 + i}.25") for i, d in enumerate(days)}
    assert list(series.to_dict()) == days
    assert shortcut.points == series.points
    assert len(fake.search_requests) == 2


def test_batch_get_makes_one_call_and_maps_by_uuid(fake):
    fake.seed(QQQ, SHARES_OUTSTANDING, {date(2026, 11, 18): "880000000"})

    results = SecurityMetricService().get(SHARES_OUTSTANDING, [SPY, UNKNOWN, QQQ], on=MONDAY)

    assert len(fake.get_latest_requests) == 1
    assert set(results) == {SPY, UNKNOWN, QQQ}
    assert results[SPY].value == Decimal("15210000000")
    assert results[QQQ].value == Decimal("880000000")
    assert results[QQQ].date == date(2026, 11, 18)
    assert results[UNKNOWN] is None


def test_record_sends_native_types_in_chunks_and_returns_the_last_as_of(fake):
    as_of = SecurityMetricService().record(SHARES_OUTSTANDING, NEW, {FRIDAY: 15204137000})

    sent = fake.create_requests[0].series.points[0]
    assert (sent.observation_date.year, sent.observation_date.month, sent.observation_date.day) == (2026, 11, 20)
    assert decode_decimal(sent.value) == Decimal("15204137000")
    assert str(decode_decimal(sent.value)) == "15204137000"
    assert sent.value.scale == 0
    assert as_of == stamped_as_of(1)

    start = date(2000, 1, 1)
    points = [(start + timedelta(days=i), 1000 + i) for i in range(RECORD_CHUNK_SIZE + 1)]
    as_of = SecurityMetricService().record(SHARES_OUTSTANDING, NEW, list(reversed(points)))

    chunked = fake.create_requests[1:]
    assert len(chunked) == 2
    assert {r.series.security_id.raw_uuid for r in chunked} == {NEW.bytes}
    assert {r.series.metric for r in chunked} == {SHARES_OUTSTANDING}
    sent_points = [(date(p.observation_date.year, p.observation_date.month, p.observation_date.day),
                    decode_decimal(p.value)) for r in chunked for p in r.series.points]
    assert sent_points == [(d, Decimal(v)) for d, v in points]
    assert as_of == stamped_as_of(3)


def test_record_rejects_bad_points_before_any_call(fake):
    with pytest.raises(InvalidMetricPoints, match="fractional share count"):
        SecurityMetricService().record(SHARES_OUTSTANDING, NEW, {FRIDAY: Decimal("15204137000.5")})
    with pytest.raises(InvalidMetricPoints, match="duplicate date"):
        SecurityMetricService().record(SHARES_OUTSTANDING, NEW, [(FRIDAY, 1), (FRIDAY, 2)])
    assert fake.create_requests == []


def test_unreachable_service_names_the_address(monkeypatch):
    port = closed_port()
    _point_to(monkeypatch, port)
    monkeypatch.setattr(security_metric_service, "DEFAULT_TIMEOUT_SECONDS", 5.0)

    with pytest.raises(ServiceUnavailable, match=f"127.0.0.1:{port}"):
        spy().get_metric(SHARES_OUTSTANDING, on=MONDAY)


def test_missing_uuid_and_unknown_metric_are_errors(fake):
    with pytest.raises(MissingSecurityId, match="no UUID"):
        Security(SecurityProto()).get_metric(SHARES_OUTSTANDING)
    with pytest.raises(UnknownMetric, match="UNKNOWN_SECURITY_METRIC"):
        spy().get_metric(UNKNOWN_SECURITY_METRIC)
    with pytest.raises(UnknownMetric, match="SHARE_COUNT"):
        spy().get_metric("SHARE_COUNT")
    assert fake.get_latest_requests == []


def test_installed_fetcher_replaces_the_grpc_client(fake):
    class Local:
        def __init__(self):
            self.calls = 0

        def get_latest(self, request):
            self.calls += 1
            return fake.GetLatest(request, None)

    local = Local()
    set_security_metric_fetcher(local)
    assert spy().shares_outstanding(on=MONDAY).date == FRIDAY
    assert local.calls == 1


def test_empty_uuid_list_makes_no_call(fake):
    assert SecurityMetricService().get(SHARES_OUTSTANDING, []) == {}
    assert fake.get_latest_requests == []
