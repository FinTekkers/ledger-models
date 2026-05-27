from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class TransactionTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN: _ClassVar[TransactionTypeProto]
    BUY: _ClassVar[TransactionTypeProto]
    SELL: _ClassVar[TransactionTypeProto]
    DEPOSIT: _ClassVar[TransactionTypeProto]
    WITHDRAWAL: _ClassVar[TransactionTypeProto]
    MATURATION: _ClassVar[TransactionTypeProto]
    MATURATION_OFFSET: _ClassVar[TransactionTypeProto]
    PRINCIPAL_PAYDOWN: _ClassVar[TransactionTypeProto]
    PRINCIPAL_PAYDOWN_OFFSET: _ClassVar[TransactionTypeProto]
UNKNOWN: TransactionTypeProto
BUY: TransactionTypeProto
SELL: TransactionTypeProto
DEPOSIT: TransactionTypeProto
WITHDRAWAL: TransactionTypeProto
MATURATION: TransactionTypeProto
MATURATION_OFFSET: TransactionTypeProto
PRINCIPAL_PAYDOWN: TransactionTypeProto
PRINCIPAL_PAYDOWN_OFFSET: TransactionTypeProto
