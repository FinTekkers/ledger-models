"""Security metric series, GetLatest and Search messages round-trip unchanged
(LM-484), with field-level checks after parse.

An empty series (zero points: unknown) and a series with one point of value 0
(a real zero) parse to different lengths and differ on the wire.
"""
from decimal import Decimal

from google.protobuf import timestamp_pb2

from fintekkers.models.security import security_metric_pb2, security_metric_type_pb2
from fintekkers.models.util import local_date_pb2, local_timestamp_pb2, object_type_pb2, uuid_pb2
from fintekkers.requests.security_metric import (
    get_latest_security_metric_request_pb2,
    search_security_metric_request_pb2,
)
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

SPY = uuid_pb2.UUIDProto(raw_uuid=bytes([1] * 16))
QQQ = uuid_pb2.UUIDProto(raw_uuid=bytes([2] * 16))
AS_OF = local_timestamp_pb2.LocalTimestampProto(
    timestamp=timestamp_pb2.Timestamp(seconds=1795392000), time_zone="UTC")
SHARES_OUTSTANDING = security_metric_type_pb2.SHARES_OUTSTANDING
NAV_PER_SHARE = security_metric_type_pb2.NAV_PER_SHARE
TOTAL_NET_ASSETS = security_metric_type_pb2.TOTAL_NET_ASSETS
EXPENSE_RATIO = security_metric_type_pb2.EXPENSE_RATIO
Series = security_metric_pb2.SecurityMetricSeriesProto


def _date(year: int, month: int, day: int) -> local_date_pb2.LocalDateProto:
    return local_date_pb2.LocalDateProto(year=year, month=month, day=day)


def _point(d: local_date_pb2.LocalDateProto, value: str) -> security_metric_pb2.SecurityMetricPointProto:
    return security_metric_pb2.SecurityMetricPointProto(observation_date=d, value=encode_decimal(Decimal(value)))


def _series(security, metric, points) -> security_metric_pb2.SecurityMetricSeriesProto:
    return Series(
        object_type=object_type_pb2.OBJECT_TYPE_SECURITY_METRIC_SERIES,
        security_id=security,
        metric=metric,
        as_of=AS_OF,
        points=points,
    )


def _points(series) -> list:
    return [((p.observation_date.year, p.observation_date.month, p.observation_date.day), str(decode_decimal(p.value)))
            for p in series.points]


def test_three_point_series_round_trips_in_order_with_exact_decimals():
    original = _series(SPY, SHARES_OUTSTANDING, [
        _point(_date(2026, 9, 28), "15204137000"),
        _point(_date(2026, 9, 29), "15210000000"),
        _point(_date(2026, 9, 30), "15198250000"),
    ])

    parsed = Series.FromString(original.SerializeToString())

    assert parsed == original
    assert parsed.security_id == SPY
    assert parsed.metric == SHARES_OUTSTANDING
    assert parsed.as_of == AS_OF
    assert _points(parsed) == [
        ((2026, 9, 28), "15204137000"),
        ((2026, 9, 29), "15210000000"),
        ((2026, 9, 30), "15198250000"),
    ]


def test_sparse_expense_ratio_series_round_trips_with_exact_decimals():
    # LM-491: one point per change, dated by the date the ratio takes effect.
    original = _series(SPY, EXPENSE_RATIO, [
        _point(_date(2018, 1, 1), "0.0945"),
        _point(_date(2026, 1, 1), "0.0900"),
    ])

    parsed = Series.FromString(original.SerializeToString())

    assert parsed == original
    assert parsed.metric == EXPENSE_RATIO == 4
    assert _points(parsed) == [((2018, 1, 1), "0.0945"), ((2026, 1, 1), "0.0900")]


def test_empty_series_is_not_a_zero_valued_point():
    empty = _series(SPY, NAV_PER_SHARE, [])
    zero = _series(SPY, NAV_PER_SHARE, [_point(_date(2026, 11, 20), "0")])

    parsed_empty = Series.FromString(empty.SerializeToString())
    parsed_zero = Series.FromString(zero.SerializeToString())

    assert parsed_empty == empty
    assert parsed_zero == zero
    assert len(parsed_empty.points) == 0
    assert len(parsed_zero.points) == 1
    assert _points(parsed_zero) == [((2026, 11, 20), "0")]
    assert empty.SerializeToString() != zero.SerializeToString()


def test_get_latest_request_and_response_round_trip():
    module = get_latest_security_metric_request_pb2
    request = module.GetLatestSecurityMetricRequestProto(
        object_type=object_type_pb2.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST,
        security_ids=[SPY, QQQ],
        metrics=[TOTAL_NET_ASSETS],
        date=_date(2026, 11, 20),
        as_of=AS_OF,
    )
    response = module.GetLatestSecurityMetricResponseProto(
        object_type=object_type_pb2.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE,
        series=[
            _series(SPY, TOTAL_NET_ASSETS, [_point(_date(2026, 11, 19), "5100000000")]),
            _series(QQQ, TOTAL_NET_ASSETS, []),
        ],
    )

    parsed_request = module.GetLatestSecurityMetricRequestProto.FromString(request.SerializeToString())
    parsed_response = module.GetLatestSecurityMetricResponseProto.FromString(response.SerializeToString())

    assert parsed_request == request
    assert list(parsed_request.security_ids) == [SPY, QQQ]
    assert list(parsed_request.metrics) == [TOTAL_NET_ASSETS]
    assert parsed_request.date == _date(2026, 11, 20)
    assert parsed_request.as_of == AS_OF

    assert parsed_response == response
    assert [s.security_id for s in parsed_response.series] == [SPY, QQQ]
    assert _points(parsed_response.series[0]) == [((2026, 11, 19), "5100000000")]
    assert parsed_response.series[1].metric == TOTAL_NET_ASSETS
    assert len(parsed_response.series[1].points) == 0


def test_search_request_and_response_round_trip():
    module = search_security_metric_request_pb2
    request = module.SearchSecurityMetricRequestProto(
        object_type=object_type_pb2.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST,
        security_id=SPY,
        metrics=[NAV_PER_SHARE, SHARES_OUTSTANDING],
        start_date=_date(2026, 11, 1),
        end_date=_date(2026, 11, 20),
        as_of=AS_OF,
    )
    response = module.SearchSecurityMetricResponseProto(
        object_type=object_type_pb2.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE,
        series=_series(SPY, NAV_PER_SHARE, [
            _point(_date(2026, 11, 19), "100.98"),
            _point(_date(2026, 11, 20), "101.42"),
        ]),
    )

    parsed_request = module.SearchSecurityMetricRequestProto.FromString(request.SerializeToString())
    parsed_response = module.SearchSecurityMetricResponseProto.FromString(response.SerializeToString())

    assert parsed_request == request
    assert parsed_request.security_id == SPY
    assert list(parsed_request.metrics) == [NAV_PER_SHARE, SHARES_OUTSTANDING]
    assert parsed_request.start_date == _date(2026, 11, 1)
    assert parsed_request.end_date == _date(2026, 11, 20)
    assert parsed_request.as_of == AS_OF

    assert parsed_response == response
    assert parsed_response.series.metric == NAV_PER_SHARE
    assert _points(parsed_response.series) == [((2026, 11, 19), "100.98"), ((2026, 11, 20), "101.42")]
