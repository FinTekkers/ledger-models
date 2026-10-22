from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class PremiumAmortisationElectionProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNSPECIFIED_PREMIUM_ELECTION: _ClassVar[PremiumAmortisationElectionProto]
    PREMIUM_ELECTED: _ClassVar[PremiumAmortisationElectionProto]
    PREMIUM_NOT_ELECTED: _ClassVar[PremiumAmortisationElectionProto]

class MarketDiscountInclusionProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNSPECIFIED_MARKET_DISCOUNT_INCLUSION: _ClassVar[MarketDiscountInclusionProto]
    AT_DISPOSITION: _ClassVar[MarketDiscountInclusionProto]
    INCLUDE_CURRENTLY: _ClassVar[MarketDiscountInclusionProto]

class MarketDiscountAccrualMethodProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNSPECIFIED_ACCRUAL_METHOD: _ClassVar[MarketDiscountAccrualMethodProto]
    RATABLE: _ClassVar[MarketDiscountAccrualMethodProto]
    CONSTANT_YIELD: _ClassVar[MarketDiscountAccrualMethodProto]
UNSPECIFIED_PREMIUM_ELECTION: PremiumAmortisationElectionProto
PREMIUM_ELECTED: PremiumAmortisationElectionProto
PREMIUM_NOT_ELECTED: PremiumAmortisationElectionProto
UNSPECIFIED_MARKET_DISCOUNT_INCLUSION: MarketDiscountInclusionProto
AT_DISPOSITION: MarketDiscountInclusionProto
INCLUDE_CURRENTLY: MarketDiscountInclusionProto
UNSPECIFIED_ACCRUAL_METHOD: MarketDiscountAccrualMethodProto
RATABLE: MarketDiscountAccrualMethodProto
CONSTANT_YIELD: MarketDiscountAccrualMethodProto

class AmortisationElectionsProto(_message.Message):
    __slots__ = ("bond_premium", "market_discount_inclusion", "market_discount_accrual", "effective_from")
    BOND_PREMIUM_FIELD_NUMBER: _ClassVar[int]
    MARKET_DISCOUNT_INCLUSION_FIELD_NUMBER: _ClassVar[int]
    MARKET_DISCOUNT_ACCRUAL_FIELD_NUMBER: _ClassVar[int]
    EFFECTIVE_FROM_FIELD_NUMBER: _ClassVar[int]
    bond_premium: PremiumAmortisationElectionProto
    market_discount_inclusion: MarketDiscountInclusionProto
    market_discount_accrual: MarketDiscountAccrualMethodProto
    effective_from: _local_date_pb2.LocalDateProto
    def __init__(self, bond_premium: _Optional[_Union[PremiumAmortisationElectionProto, str]] = ..., market_discount_inclusion: _Optional[_Union[MarketDiscountInclusionProto, str]] = ..., market_discount_accrual: _Optional[_Union[MarketDiscountAccrualMethodProto, str]] = ..., effective_from: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ...) -> None: ...
