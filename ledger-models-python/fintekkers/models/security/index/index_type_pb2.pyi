from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class IndexTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_INDEX_TYPE: _ClassVar[IndexTypeProto]
    CPI_U: _ClassVar[IndexTypeProto]
    CPI_W: _ClassVar[IndexTypeProto]
    CORE_CPI: _ClassVar[IndexTypeProto]
    PCE: _ClassVar[IndexTypeProto]
    HICP: _ClassVar[IndexTypeProto]
UNKNOWN_INDEX_TYPE: IndexTypeProto
CPI_U: IndexTypeProto
CPI_W: IndexTypeProto
CORE_CPI: IndexTypeProto
PCE: IndexTypeProto
HICP: IndexTypeProto
