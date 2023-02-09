from fintekkers.models.security import security_pb2 as _security_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CreateSecurityRequestProto(_message.Message):
    __slots__ = ["object_class", "security_input", "version"]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    SECURITY_INPUT_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    security_input: _security_pb2.SecurityProto
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., security_input: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ...) -> None: ...
