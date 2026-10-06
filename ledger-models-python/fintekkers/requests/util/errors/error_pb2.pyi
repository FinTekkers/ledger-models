from fintekkers.requests.util.errors import message_pb2 as _message_pb2
from fintekkers.requests.util.errors import field_violation_pb2 as _field_violation_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ErrorCode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_ERROR: _ClassVar[ErrorCode]
    WARNING: _ClassVar[ErrorCode]
UNKNOWN_ERROR: ErrorCode
WARNING: ErrorCode

class ErrorProto(_message.Message):
    __slots__ = ("code", "detail", "violations")
    CODE_FIELD_NUMBER: _ClassVar[int]
    DETAIL_FIELD_NUMBER: _ClassVar[int]
    VIOLATIONS_FIELD_NUMBER: _ClassVar[int]
    code: ErrorCode
    detail: _message_pb2.Message
    violations: _containers.RepeatedCompositeFieldContainer[_field_violation_pb2.FieldViolationProto]
    def __init__(self, code: _Optional[_Union[ErrorCode, str]] = ..., detail: _Optional[_Union[_message_pb2.Message, _Mapping]] = ..., violations: _Optional[_Iterable[_Union[_field_violation_pb2.FieldViolationProto, _Mapping]]] = ...) -> None: ...

class WarningProto(_message.Message):
    __slots__ = ("code", "detail")
    CODE_FIELD_NUMBER: _ClassVar[int]
    DETAIL_FIELD_NUMBER: _ClassVar[int]
    code: ErrorCode
    detail: _message_pb2.Message
    def __init__(self, code: _Optional[_Union[ErrorCode, str]] = ..., detail: _Optional[_Union[_message_pb2.Message, _Mapping]] = ...) -> None: ...
