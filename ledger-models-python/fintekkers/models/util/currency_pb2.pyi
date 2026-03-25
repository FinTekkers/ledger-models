from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class CurrencyProto(_message.Message):
    __slots__ = ("iso_code",)
    ISO_CODE_FIELD_NUMBER: _ClassVar[int]
    iso_code: str
    def __init__(self, iso_code: _Optional[str] = ...) -> None: ...
