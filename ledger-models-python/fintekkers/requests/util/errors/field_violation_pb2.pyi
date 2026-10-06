from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class FieldViolationProto(_message.Message):
    __slots__ = ("field", "object_id", "message")
    FIELD_FIELD_NUMBER: _ClassVar[int]
    OBJECT_ID_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    field: str
    object_id: _uuid_pb2.UUIDProto
    message: str
    def __init__(self, field: _Optional[str] = ..., object_id: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., message: _Optional[str] = ...) -> None: ...
