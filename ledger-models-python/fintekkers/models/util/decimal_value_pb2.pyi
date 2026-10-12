from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class DecimalValueProto(_message.Message):
    __slots__ = ("arbitrary_precision_value", "unscaled_value", "scale")
    ARBITRARY_PRECISION_VALUE_FIELD_NUMBER: _ClassVar[int]
    UNSCALED_VALUE_FIELD_NUMBER: _ClassVar[int]
    SCALE_FIELD_NUMBER: _ClassVar[int]
    arbitrary_precision_value: str
    unscaled_value: bytes
    scale: int
    def __init__(self, arbitrary_precision_value: _Optional[str] = ..., unscaled_value: _Optional[bytes] = ..., scale: _Optional[int] = ...) -> None: ...
