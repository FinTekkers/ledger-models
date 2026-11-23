"""LM-482: SecurityMetricProto and the GetLatest and Search request and
response messages, with every field set, parse back equal. An unset value
parses back unset, not 0."""
from decimal import Decimal
from uuid import uuid4

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.security.security_metric_pb2 import SecurityMetricProto
from fintekkers.models.security.security_metric_type_pb2 import SecurityMetricTypeProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.version_pb2 import VersionProto
from fintekkers.requests.security_metric.get_latest_security_metric_request_pb2 import (
    GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.search_security_metric_request_pb2 import (
    SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
)
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

SECURITY_ID = UUIDProto(raw_uuid=uuid4().bytes)
VERSION = VersionProto(major=0, minor=0, patch=1)


def _ts(seconds: int) -> LocalTimestampProto:
    return LocalTimestampProto(timestamp=Timestamp(seconds=seconds), time_zone="America/New_York")


def _metric(kind: int, value: str) -> SecurityMetricProto:
    return SecurityMetricProto(
        object_type=ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC,
        version=VERSION,
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        as_of=_ts(1_717_400_000),
        valid_from=_ts(1_717_300_000),
        valid_to=_ts(1_717_500_000),
        security_id=SECURITY_ID,
        metric=kind,
        observation_date=LocalDateProto(year=2024, month=5, day=31),
        value=encode_decimal(Decimal(value)),
        source="STATE_STREET_NAV_HISTORY",
    )


def _round_trip(message):
    parsed = type(message).FromString(message.SerializeToString())
    assert parsed == message
    return parsed


def test_security_metric_with_every_field_set_round_trips():
    m = _metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456")
    # Every field is set, so a field missing from the round trip would show.
    assert {f.name for f, _ in m.ListFields()} == {f.name for f in SecurityMetricProto.DESCRIPTOR.fields}
    parsed = _round_trip(m)
    assert decode_decimal(parsed.value) == Decimal("512.3456")


def test_an_unset_value_parses_back_unset_not_zero():
    m = _metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, "1")
    m.ClearField("value")
    parsed = _round_trip(m)
    assert not parsed.HasField("value")


def test_get_latest_request_and_response_round_trip():
    request = GetLatestSecurityMetricRequestProto(
        object_type=ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST,
        version=VERSION,
        security_id=[SECURITY_ID, UUIDProto(raw_uuid=uuid4().bytes)],
        metric=[SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.SHARES_OUTSTANDING],
        date=LocalDateProto(year=2024, month=6, day=3),
    )
    assert len(_round_trip(request).security_id) == 2

    response = GetLatestSecurityMetricResponseProto(
        object_type=ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE,
        version=VERSION,
        security_metric_response=[
            _metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456"),
            _metric(SecurityMetricTypeProto.SHARES_OUTSTANDING, "1003282116"),
        ],
    )
    assert len(_round_trip(response).security_metric_response) == 2


def test_search_request_and_response_round_trip():
    request = SearchSecurityMetricRequestProto(
        object_type=ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST,
        version=VERSION,
        security_id=SECURITY_ID,
        metric=[SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.TOTAL_NET_ASSETS],
        from_date=LocalDateProto(year=2024, month=1, day=2),
        to_date=LocalDateProto(year=2024, month=6, day=3),
    )
    assert len(_round_trip(request).metric) == 2

    response = SearchSecurityMetricResponseProto(
        object_type=ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE,
        version=VERSION,
        security_metric_response=[
            _metric(SecurityMetricTypeProto.NAV_PER_SHARE, "512.3456"),
            _metric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, "512345678901.25"),
        ],
    )
    assert len(_round_trip(response).security_metric_response) == 2
