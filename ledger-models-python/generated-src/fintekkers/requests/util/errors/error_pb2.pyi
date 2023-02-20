from fintekkers.requests.util.errors import message_pb2 as _message_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor
UNKNOWN_ERROR: ErrorCode
WARNING: ErrorCode

class ErrorProto(_message.Message):
    __slots__ = ["code", "detail"]
    CODE_FIELD_NUMBER: _ClassVar[int]
    DETAIL_FIELD_NUMBER: _ClassVar[int]
    code: ErrorCode
    detail: _message_pb2.Message
    def __init__(self, code: _Optional[_Union[ErrorCode, str]] = ..., detail: _Optional[_Union[_message_pb2.Message, _Mapping]] = ...) -> None: ...

class WarningProto(_message.Message):
    __slots__ = ["code", "detail"]
    CODE_FIELD_NUMBER: _ClassVar[int]
    DETAIL_FIELD_NUMBER: _ClassVar[int]
    code: ErrorCode
    detail: _message_pb2.Message
    def __init__(self, code: _Optional[_Union[ErrorCode, str]] = ..., detail: _Optional[_Union[_message_pb2.Message, _Mapping]] = ...) -> None: ...

class ErrorCode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
