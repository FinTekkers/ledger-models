from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.security import index_composition_pb2 as _index_composition_pb2
from fintekkers.requests.util import operation_pb2 as _operation_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetIndexCompositionRequestProto(_message.Message):
    __slots__ = ("object_class", "version", "object_type", "version_major", "version_minor", "version_patch", "index_uuid", "as_of_date")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_MAJOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_MINOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_PATCH_FIELD_NUMBER: _ClassVar[int]
    INDEX_UUID_FIELD_NUMBER: _ClassVar[int]
    AS_OF_DATE_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    object_type: _object_type_pb2.ObjectTypeProto
    version_major: int
    version_minor: int
    version_patch: int
    index_uuid: _uuid_pb2.UUIDProto
    as_of_date: _local_date_pb2.LocalDateProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version_major: _Optional[int] = ..., version_minor: _Optional[int] = ..., version_patch: _Optional[int] = ..., index_uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ...) -> None: ...

class GetIndexCompositionResponseProto(_message.Message):
    __slots__ = ("object_class", "version", "object_type", "version_major", "version_minor", "version_patch", "operation_type", "composition", "resolved_effective_date")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_MAJOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_MINOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_PATCH_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    COMPOSITION_FIELD_NUMBER: _ClassVar[int]
    RESOLVED_EFFECTIVE_DATE_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    object_type: _object_type_pb2.ObjectTypeProto
    version_major: int
    version_minor: int
    version_patch: int
    operation_type: _operation_pb2.RequestOperationTypeProto
    composition: _index_composition_pb2.IndexCompositionProto
    resolved_effective_date: _local_date_pb2.LocalDateProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version_major: _Optional[int] = ..., version_minor: _Optional[int] = ..., version_patch: _Optional[int] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., composition: _Optional[_Union[_index_composition_pb2.IndexCompositionProto, _Mapping]] = ..., resolved_effective_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ...) -> None: ...
