from fintekkers.models.security.identifier import identifier_type_pb2 as _identifier_type_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IdentifierProto(_message.Message):
    __slots__ = ("object_class", "version", "object_type", "version_major", "version_minor", "version_patch", "identifier_value", "identifier_type")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_MAJOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_MINOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_PATCH_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_VALUE_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_TYPE_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    object_type: _object_type_pb2.ObjectTypeProto
    version_major: int
    version_minor: int
    version_patch: int
    identifier_value: str
    identifier_type: _identifier_type_pb2.IdentifierTypeProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version_major: _Optional[int] = ..., version_minor: _Optional[int] = ..., version_patch: _Optional[int] = ..., identifier_value: _Optional[str] = ..., identifier_type: _Optional[_Union[_identifier_type_pb2.IdentifierTypeProto, str]] = ...) -> None: ...
