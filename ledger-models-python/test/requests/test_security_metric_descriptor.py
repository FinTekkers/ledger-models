"""The security metric protos' shape (LM-484). Neither security_metric*.proto
file imports security.proto; SecurityMetricSeriesProto.security_id is a
UUIDProto and as_of a LocalTimestampProto; SecurityMetricPointProto has
exactly observation_date (LocalDateProto) and value (DecimalValueProto). Every
message-typed field of the new messages uses a type that already existed or
that this item adds: no new date, decimal or time type.
"""
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.security import security_metric_pb2, security_metric_type_pb2
from fintekkers.requests.security_metric import (
    create_security_metric_request_pb2,
    get_latest_security_metric_request_pb2,
    search_security_metric_request_pb2,
)

SECURITY_PROTO_FILE = "fintekkers/models/security/security.proto"
SERIES = security_metric_pb2.SecurityMetricSeriesProto
POINT = security_metric_pb2.SecurityMetricPointProto
MODULES = (
    security_metric_pb2,
    create_security_metric_request_pb2,
    search_security_metric_request_pb2,
    get_latest_security_metric_request_pb2,
)
# Existing types, plus the two this item adds.
ALLOWED_MESSAGE_TYPES = {
    "fintekkers.models.util.ObjectTypeProto",
    "fintekkers.models.util.VersionProto",
    "fintekkers.models.util.UUIDProto",
    "fintekkers.models.util.LocalDateProto",
    "fintekkers.models.util.LocalTimestampProto",
    "fintekkers.models.util.DecimalValueProto",
    "fintekkers.requests.util.RequestOperationTypeProto",
    "fintekkers.models.security.SecurityMetricTypeProto",
    "fintekkers.models.security.SecurityMetricSeriesProto",
    "fintekkers.models.security.SecurityMetricPointProto",
}


def _type_name(f) -> str:
    """The full name of a message- or enum-typed field's type."""
    return (f.message_type or f.enum_type).full_name


def test_security_metric_files_do_not_import_security_proto():
    for module in (security_metric_pb2, security_metric_type_pb2):
        file = module.DESCRIPTOR
        assert file.name.startswith("fintekkers/models/security/security_metric")
        deps = [d.name for d in file.dependencies]
        assert SECURITY_PROTO_FILE not in deps, (file.name, deps)


def test_security_id_is_a_uuid():
    field = SERIES.DESCRIPTOR.fields_by_name["security_id"]
    assert field.message_type.full_name == "fintekkers.models.util.UUIDProto"
    assert field.label == FieldDescriptor.LABEL_OPTIONAL


def test_as_of_is_a_local_timestamp():
    field = SERIES.DESCRIPTOR.fields_by_name["as_of"]
    assert field.message_type.full_name == "fintekkers.models.util.LocalTimestampProto"


def test_point_has_exactly_date_and_value():
    fields = {f.name: f.message_type.full_name for f in POINT.DESCRIPTOR.fields}
    assert fields == {
        "observation_date": "fintekkers.models.util.LocalDateProto",
        "value": "fintekkers.models.util.DecimalValueProto",
    }


def test_series_points_are_repeated_points():
    field = SERIES.DESCRIPTOR.fields_by_name["points"]
    assert field.label == FieldDescriptor.LABEL_REPEATED
    assert field.message_type is POINT.DESCRIPTOR


def test_every_message_field_uses_an_existing_type():
    for module in MODULES:
        for message in module.DESCRIPTOR.message_types_by_name.values():
            assert not message.nested_types, message.full_name
            for f in message.fields:
                assert f.message_type is not None or f.enum_type is not None, (message.full_name, f.name)
                assert _type_name(f) in ALLOWED_MESSAGE_TYPES, (message.full_name, f.name, _type_name(f))


def test_metric_values():
    enum = security_metric_type_pb2.SecurityMetricTypeProto
    assert {v.name: v.number for v in enum.DESCRIPTOR.values} == {
        "UNKNOWN_SECURITY_METRIC": 0,
        "SHARES_OUTSTANDING": 1,
        "NAV_PER_SHARE": 2,
        "TOTAL_NET_ASSETS": 3,
        "EXPENSE_RATIO": 4,
    }
