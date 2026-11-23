from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from fintekkers.models.security import security_metric_type_pb2 as _security_metric_type_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SecurityMetricSeriesProto(_message.Message):
    __slots__ = ("object_type", "version", "security_id", "metric", "as_of", "points")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SECURITY_ID_FIELD_NUMBER: _ClassVar[int]
    METRIC_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    security_id: _uuid_pb2.UUIDProto
    metric: _security_metric_type_pb2.SecurityMetricTypeProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    points: _containers.RepeatedCompositeFieldContainer[SecurityMetricPointProto]
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., security_id: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., metric: _Optional[_Union[_security_metric_type_pb2.SecurityMetricTypeProto, str]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., points: _Optional[_Iterable[_Union[SecurityMetricPointProto, _Mapping]]] = ...) -> None: ...

class SecurityMetricPointProto(_message.Message):
    __slots__ = ("observation_date", "value")
    OBSERVATION_DATE_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    observation_date: _local_date_pb2.LocalDateProto
    value: _decimal_value_pb2.DecimalValueProto
    def __init__(self, observation_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...
