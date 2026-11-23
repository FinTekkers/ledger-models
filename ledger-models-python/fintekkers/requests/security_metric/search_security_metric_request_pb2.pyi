from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.security import security_metric_pb2 as _security_metric_pb2
from fintekkers.models.security import security_metric_type_pb2 as _security_metric_type_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SearchSecurityMetricRequestProto(_message.Message):
    __slots__ = ("object_type", "version", "security_id", "metrics", "start_date", "end_date", "as_of")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SECURITY_ID_FIELD_NUMBER: _ClassVar[int]
    METRICS_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    security_id: _uuid_pb2.UUIDProto
    metrics: _containers.RepeatedScalarFieldContainer[_security_metric_type_pb2.SecurityMetricTypeProto]
    start_date: _local_date_pb2.LocalDateProto
    end_date: _local_date_pb2.LocalDateProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., security_id: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., metrics: _Optional[_Iterable[_Union[_security_metric_type_pb2.SecurityMetricTypeProto, str]]] = ..., start_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., end_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ...) -> None: ...

class SearchSecurityMetricResponseProto(_message.Message):
    __slots__ = ("object_type", "version", "series")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SERIES_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    series: _security_metric_pb2.SecurityMetricSeriesProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., series: _Optional[_Union[_security_metric_pb2.SecurityMetricSeriesProto, _Mapping]] = ...) -> None: ...
