from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class InstrumentTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    INSTRUMENT_TYPE_UNKNOWN: _ClassVar[InstrumentTypeProto]
    INSTRUMENT_TYPE_CASH: _ClassVar[InstrumentTypeProto]
    INSTRUMENT_TYPE_DERIVATIVE: _ClassVar[InstrumentTypeProto]
    INSTRUMENT_TYPE_REFERENCE_INDEX: _ClassVar[InstrumentTypeProto]
INSTRUMENT_TYPE_UNKNOWN: InstrumentTypeProto
INSTRUMENT_TYPE_CASH: InstrumentTypeProto
INSTRUMENT_TYPE_DERIVATIVE: InstrumentTypeProto
INSTRUMENT_TYPE_REFERENCE_INDEX: InstrumentTypeProto
