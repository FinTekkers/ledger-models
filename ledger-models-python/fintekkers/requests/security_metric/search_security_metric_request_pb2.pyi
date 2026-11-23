from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
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
    __slots__ = ("object_type", "version", "security_id", "metric", "from_date", "to_date")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SECURITY_ID_FIELD_NUMBER: _ClassVar[int]
    METRIC_FIELD_NUMBER: _ClassVar[int]
    FROM_DATE_FIELD_NUMBER: _ClassVar[int]
    TO_DATE_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    security_id: _uuid_pb2.UUIDProto
    metric: _containers.RepeatedScalarFieldContainer[_security_metric_type_pb2.SecurityMetricTypeProto]
    from_date: _local_date_pb2.LocalDateProto
    to_date: _local_date_pb2.LocalDateProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., security_id: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., metric: _Optional[_Iterable[_Union[_security_metric_type_pb2.SecurityMetricTypeProto, str]]] = ..., from_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., to_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ...) -> None: ...

class SearchSecurityMetricResponseProto(_message.Message):
    __slots__ = ("object_type", "version", "security_metric_response")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SECURITY_METRIC_RESPONSE_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    security_metric_response: _containers.RepeatedCompositeFieldContainer[_security_metric_pb2.SecurityMetricProto]
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., security_metric_response: _Optional[_Iterable[_Union[_security_metric_pb2.SecurityMetricProto, _Mapping]]] = ...) -> None: ...
