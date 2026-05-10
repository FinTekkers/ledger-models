from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SecurityIdProto(_message.Message):
    __slots__ = ("uuid",)
    UUID_FIELD_NUMBER: _ClassVar[int]
    uuid: _uuid_pb2.UUIDProto
    def __init__(self, uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ...) -> None: ...
