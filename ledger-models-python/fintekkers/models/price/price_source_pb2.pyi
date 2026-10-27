from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class PriceSourceProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_PRICE_SOURCE: _ClassVar[PriceSourceProto]
    MARKET: _ClassVar[PriceSourceProto]
    TRADE: _ClassVar[PriceSourceProto]
UNKNOWN_PRICE_SOURCE: PriceSourceProto
MARKET: PriceSourceProto
TRADE: PriceSourceProto
