from fintekkers.models.security.identifier import identifier_type_pb2 as _identifier_type_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IdentifierProto(_message.Message):
    __slots__ = ("object_type", "version", "identifier_value", "identifier_type")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_VALUE_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_TYPE_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    identifier_value: str
    identifier_type: _identifier_type_pb2.IdentifierTypeProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., identifier_value: _Optional[str] = ..., identifier_type: _Optional[_Union[_identifier_type_pb2.IdentifierTypeProto, str]] = ...) -> None: ...
