"""LM-485: the pure SecurityMetric rules against the shared cases in
test-fixtures/security-metric/cases.json (also run by Java, JS and Rust)."""
import json
from datetime import date
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import pytest

from fintekkers.models.security.security_metric_pb2 import SecurityMetricPointProto, SecurityMetricSeriesProto
from fintekkers.models.security.security_metric_type_pb2 import SecurityMetricTypeProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security_metric.get_latest_security_metric_request_pb2 import (
    GetLatestSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.search_security_metric_request_pb2 import SearchSecurityMetricResponseProto
from fintekkers.wrappers.models.security.security_metric import (
    NAV_PER_SHARE,
    SHARES_OUTSTANDING,
    InvalidMetricPoints,
    MetricSeries,
    SecurityMetricServiceError,
    UnknownMetric,
    build_create,
    check_metric,
    chunk_record,
    map_latest,
    merge_chunks,
    validate_record,
)
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

FIXTURE = Path(__file__).resolve().parents[5] / "test-fixtures" / "security-metric" / "cases.json"
CASES = json.loads(FIXTURE.read_text())
SPY = UUID(bytes=bytes([1] * 16))
QQQ = UUID(bytes=bytes([2] * 16))


def _point(d: str, v: str) -> SecurityMetricPointProto:
    day = date.fromisoformat(d)
    return SecurityMetricPointProto(
        observation_date=LocalDateProto(year=day.year, month=day.month, day=day.day),
        value=encode_decimal(Decimal(v)))


def _series(uuid: UUID, metric: int, points) -> SecurityMetricSeriesProto:
    return SecurityMetricSeriesProto(
        security_id=UUIDProto(raw_uuid=uuid.bytes), metric=metric, points=[_point(d, v) for d, v in points])


def test_fixture_has_cases_in_every_section():
    for section in ("latest", "merge", "record"):
        assert len(CASES[section]) >= 1, section


@pytest.mark.parametrize("case", CASES["latest"], ids=lambda c: c["name"])
def test_latest(case):
    on = date.fromisoformat(case["on"])
    response = GetLatestSecurityMetricResponseProto()
    # Another security's series first: results are matched by UUID.
    response.series.append(_series(QQQ, SHARES_OUTSTANDING, [["2026-11-01", "7"]]))
    if case["series"] is not None:
        response.series.append(_series(SPY, SHARES_OUTSTANDING, case["series"]))

    result = map_latest(response, SHARES_OUTSTANDING, [SPY], on)[SPY]

    expected = case["expected"]
    if expected is None:
        assert result is None
        return
    assert str(result.value) == expected["value"]
    assert result.date == date.fromisoformat(expected["date"])
    assert result.on == on
    assert result.age_days == expected["ageDays"]


@pytest.mark.parametrize("case", CASES["merge"], ids=lambda c: c["name"])
def test_merge(case):
    chunks = [SearchSecurityMetricResponseProto(series=_series(SPY, NAV_PER_SHARE, points))
              for points in case["chunks"]]
    if "error" in case:
        with pytest.raises(SecurityMetricServiceError, match=case["error"]):
            merge_chunks(chunks, SPY, NAV_PER_SHARE)
        return
    series = merge_chunks(chunks, SPY, NAV_PER_SHARE)
    assert [[p.date.isoformat(), str(p.value)] for p in series.points] == case["expected"]


@pytest.mark.parametrize("case", CASES["record"], ids=lambda c: c["name"])
def test_record(case):
    metric = SecurityMetricTypeProto.Value(case["metric"])
    points = [(date.fromisoformat(d), None if v is None else Decimal(v)) for d, v in case["points"]]
    if "violations" in case:
        with pytest.raises(InvalidMetricPoints) as raised:
            validate_record(metric, points)
        assert [{"date": v.date, "reason": v.reason} for v in raised.value.violations] == case["violations"]
        for v in case["violations"]:
            assert v["reason"] in str(raised.value)
        return
    chunks = chunk_record(validate_record(metric, points), case["chunkSize"])
    requests = [build_create(metric, SPY, chunk) for chunk in chunks]
    assert [[f"{p.observation_date.year:04d}-{p.observation_date.month:02d}-{p.observation_date.day:02d}"
             for p in r.series.points] for r in requests] == case["expectedChunks"]
    wire = [p.value for r in requests for p in r.series.points]
    assert [str(decode_decimal(v)) for v in wire] == case["expectedValues"]
    if metric == SHARES_OUTSTANDING:
        assert all(v.scale == 0 for v in wire)


def test_unknown_metric_names_it():
    with pytest.raises(UnknownMetric, match="UNKNOWN_SECURITY_METRIC"):
        check_metric(0)
    with pytest.raises(UnknownMetric, match="SHARE_COUNT"):
        check_metric("SHARE_COUNT")
    assert check_metric("NAV_PER_SHARE") == NAV_PER_SHARE


def test_float_input_keeps_its_decimal_text():
    points = validate_record(NAV_PER_SHARE, {date(2026, 11, 20): 0.1})
    assert str(points[0].value) == "0.1"


def test_empty_series_has_no_latest_and_an_empty_dict():
    series = MetricSeries(SPY, NAV_PER_SHARE, None, [])
    assert series.latest is None
    assert series.to_dict() == {}


def test_to_pandas_without_pandas_says_how_to_install(monkeypatch):
    import sys
    monkeypatch.setitem(sys.modules, "pandas", None)
    with pytest.raises(ImportError, match="pip install pandas"):
        MetricSeries(SPY, NAV_PER_SHARE, None, []).to_pandas()


def test_to_pandas_indexes_values_by_date():
    pandas = pytest.importorskip("pandas")
    series = merge_chunks([SearchSecurityMetricResponseProto(
        series=_series(SPY, NAV_PER_SHARE, [["2026-11-19", "1.5"], ["2026-11-20", "2"]]))], SPY, NAV_PER_SHARE)
    frame = series.to_pandas()
    assert isinstance(frame, pandas.Series)
    assert frame[date(2026, 11, 20)] == Decimal("2")
