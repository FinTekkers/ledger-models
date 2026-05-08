from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class AssetClassProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_ASSET_CLASS: _ClassVar[AssetClassProto]
    FIXED_INCOME: _ClassVar[AssetClassProto]
    EQUITY: _ClassVar[AssetClassProto]
    CASH_ASSET_CLASS: _ClassVar[AssetClassProto]
    INDEX: _ClassVar[AssetClassProto]
    VOLATILITY: _ClassVar[AssetClassProto]
UNKNOWN_ASSET_CLASS: AssetClassProto
FIXED_INCOME: AssetClassProto
EQUITY: AssetClassProto
CASH_ASSET_CLASS: AssetClassProto
INDEX: AssetClassProto
VOLATILITY: AssetClassProto
