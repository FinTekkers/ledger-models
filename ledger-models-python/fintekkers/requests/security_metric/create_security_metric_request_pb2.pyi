from fintekkers.models.security import security_metric_pb2 as _security_metric_pb2
from fintekkers.requests.util import operation_pb2 as _operation_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CreateSecurityMetricRequestProto(_message.Message):
    __slots__ = ("object_type", "version", "operation_type", "series")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    SERIES_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    operation_type: _operation_pb2.RequestOperationTypeProto
    series: _security_metric_pb2.SecurityMetricSeriesProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., series: _Optional[_Union[_security_metric_pb2.SecurityMetricSeriesProto, _Mapping]] = ...) -> None: ...

class CreateSecurityMetricResponseProto(_message.Message):
    __slots__ = ("object_type", "version", "operation_type", "series")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    SERIES_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    operation_type: _operation_pb2.RequestOperationTypeProto
    series: _security_metric_pb2.SecurityMetricSeriesProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., series: _Optional[_Union[_security_metric_pb2.SecurityMetricSeriesProto, _Mapping]] = ...) -> None: ...
