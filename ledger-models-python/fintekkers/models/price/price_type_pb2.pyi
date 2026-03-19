from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class PriceTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_PRICE_TYPE: _ClassVar[PriceTypeProto]
    ABSOLUTE: _ClassVar[PriceTypeProto]
    PERCENTAGE: _ClassVar[PriceTypeProto]
    BASIS_POINTS: _ClassVar[PriceTypeProto]
    INDEX_LEVEL: _ClassVar[PriceTypeProto]
UNKNOWN_PRICE_TYPE: PriceTypeProto
ABSOLUTE: PriceTypeProto
PERCENTAGE: PriceTypeProto
BASIS_POINTS: PriceTypeProto
INDEX_LEVEL: PriceTypeProto
