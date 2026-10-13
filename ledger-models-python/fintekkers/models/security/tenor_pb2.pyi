from fintekkers.models.security import tenor_type_pb2 as _tenor_type_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class TenorProto(_message.Message):
    __slots__ = ("object_type", "version", "term_value", "tenor_type")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    TERM_VALUE_FIELD_NUMBER: _ClassVar[int]
    TENOR_TYPE_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    term_value: str
    tenor_type: _tenor_type_pb2.TenorTypeProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., term_value: _Optional[str] = ..., tenor_type: _Optional[_Union[_tenor_type_pb2.TenorTypeProto, str]] = ...) -> None: ...
