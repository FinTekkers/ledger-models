from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.security.identifier import identifier_pb2 as _identifier_pb2
from fintekkers.models.security.bond import agency_pb2 as _agency_pb2
from fintekkers.models.security.bond import issuance_pb2 as _issuance_pb2
from fintekkers.models.security import product_type_pb2 as _product_type_pb2
from fintekkers.models.security import instrument_type_pb2 as _instrument_type_pb2
from fintekkers.models.security import security_quantity_type_pb2 as _security_quantity_type_pb2
from fintekkers.models.security import coupon_frequency_pb2 as _coupon_frequency_pb2
from fintekkers.models.security import coupon_type_pb2 as _coupon_type_pb2
from fintekkers.models.security.index import index_type_pb2 as _index_type_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SecurityProto(_message.Message):
    __slots__ = ("object_class", "version", "uuid", "as_of", "is_link", "valid_from", "valid_to", "product_type", "instrument_type", "legs", "asset_class", "issuer_name", "settlement_currency", "quantity_type", "description", "identifiers", "bond_details", "tips_extension", "frn_extension", "index_details", "equity_details", "cash_details", "fx_spot_details", "mbs_extension")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    IS_LINK_FIELD_NUMBER: _ClassVar[int]
    VALID_FROM_FIELD_NUMBER: _ClassVar[int]
    VALID_TO_FIELD_NUMBER: _ClassVar[int]
    PRODUCT_TYPE_FIELD_NUMBER: _ClassVar[int]
    INSTRUMENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    LEGS_FIELD_NUMBER: _ClassVar[int]
    ASSET_CLASS_FIELD_NUMBER: _ClassVar[int]
    ISSUER_NAME_FIELD_NUMBER: _ClassVar[int]
    SETTLEMENT_CURRENCY_FIELD_NUMBER: _ClassVar[int]
    QUANTITY_TYPE_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIERS_FIELD_NUMBER: _ClassVar[int]
    BOND_DETAILS_FIELD_NUMBER: _ClassVar[int]
    TIPS_EXTENSION_FIELD_NUMBER: _ClassVar[int]
    FRN_EXTENSION_FIELD_NUMBER: _ClassVar[int]
    INDEX_DETAILS_FIELD_NUMBER: _ClassVar[int]
    EQUITY_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CASH_DETAILS_FIELD_NUMBER: _ClassVar[int]
    FX_SPOT_DETAILS_FIELD_NUMBER: _ClassVar[int]
    MBS_EXTENSION_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    uuid: _uuid_pb2.UUIDProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    is_link: bool
    valid_from: _local_timestamp_pb2.LocalTimestampProto
    valid_to: _local_timestamp_pb2.LocalTimestampProto
    product_type: _product_type_pb2.ProductTypeProto
    instrument_type: _instrument_type_pb2.InstrumentTypeProto
    legs: _containers.RepeatedCompositeFieldContainer[SecurityProto]
    asset_class: str
    issuer_name: str
    settlement_currency: SecurityProto
    quantity_type: _security_quantity_type_pb2.SecurityQuantityTypeProto
    description: str
    identifiers: _containers.RepeatedCompositeFieldContainer[_identifier_pb2.IdentifierProto]
    bond_details: BondDetailsProto
    tips_extension: TipsExtensionProto
    frn_extension: FrnExtensionProto
    index_details: IndexDetailsProto
    equity_details: EquityDetailsProto
    cash_details: CashDetailsProto
    fx_spot_details: FxSpotDetailsProto
    mbs_extension: MbsExtensionProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_link: bool = ..., valid_from: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., valid_to: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., product_type: _Optional[_Union[_product_type_pb2.ProductTypeProto, str]] = ..., instrument_type: _Optional[_Union[_instrument_type_pb2.InstrumentTypeProto, str]] = ..., legs: _Optional[_Iterable[_Union[SecurityProto, _Mapping]]] = ..., asset_class: _Optional[str] = ..., issuer_name: _Optional[str] = ..., settlement_currency: _Optional[_Union[SecurityProto, _Mapping]] = ..., quantity_type: _Optional[_Union[_security_quantity_type_pb2.SecurityQuantityTypeProto, str]] = ..., description: _Optional[str] = ..., identifiers: _Optional[_Iterable[_Union[_identifier_pb2.IdentifierProto, _Mapping]]] = ..., bond_details: _Optional[_Union[BondDetailsProto, _Mapping]] = ..., tips_extension: _Optional[_Union[TipsExtensionProto, _Mapping]] = ..., frn_extension: _Optional[_Union[FrnExtensionProto, _Mapping]] = ..., index_details: _Optional[_Union[IndexDetailsProto, _Mapping]] = ..., equity_details: _Optional[_Union[EquityDetailsProto, _Mapping]] = ..., cash_details: _Optional[_Union[CashDetailsProto, _Mapping]] = ..., fx_spot_details: _Optional[_Union[FxSpotDetailsProto, _Mapping]] = ..., mbs_extension: _Optional[_Union[MbsExtensionProto, _Mapping]] = ...) -> None: ...

class BondDetailsProto(_message.Message):
    __slots__ = ("coupon_rate", "coupon_type", "coupon_frequency", "dated_date", "face_value", "issue_date", "maturity_date", "issuance_info")
    COUPON_RATE_FIELD_NUMBER: _ClassVar[int]
    COUPON_TYPE_FIELD_NUMBER: _ClassVar[int]
    COUPON_FREQUENCY_FIELD_NUMBER: _ClassVar[int]
    DATED_DATE_FIELD_NUMBER: _ClassVar[int]
    FACE_VALUE_FIELD_NUMBER: _ClassVar[int]
    ISSUE_DATE_FIELD_NUMBER: _ClassVar[int]
    MATURITY_DATE_FIELD_NUMBER: _ClassVar[int]
    ISSUANCE_INFO_FIELD_NUMBER: _ClassVar[int]
    coupon_rate: _decimal_value_pb2.DecimalValueProto
    coupon_type: _coupon_type_pb2.CouponTypeProto
    coupon_frequency: _coupon_frequency_pb2.CouponFrequencyProto
    dated_date: _local_date_pb2.LocalDateProto
    face_value: _decimal_value_pb2.DecimalValueProto
    issue_date: _local_date_pb2.LocalDateProto
    maturity_date: _local_date_pb2.LocalDateProto
    issuance_info: _containers.RepeatedCompositeFieldContainer[_issuance_pb2.IssuanceProto]
    def __init__(self, coupon_rate: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., coupon_type: _Optional[_Union[_coupon_type_pb2.CouponTypeProto, str]] = ..., coupon_frequency: _Optional[_Union[_coupon_frequency_pb2.CouponFrequencyProto, str]] = ..., dated_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., face_value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., issue_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., maturity_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., issuance_info: _Optional[_Iterable[_Union[_issuance_pb2.IssuanceProto, _Mapping]]] = ...) -> None: ...

class TipsExtensionProto(_message.Message):
    __slots__ = ("base_cpi", "index_date", "inflation_index_type")
    BASE_CPI_FIELD_NUMBER: _ClassVar[int]
    INDEX_DATE_FIELD_NUMBER: _ClassVar[int]
    INFLATION_INDEX_TYPE_FIELD_NUMBER: _ClassVar[int]
    base_cpi: _decimal_value_pb2.DecimalValueProto
    index_date: _local_date_pb2.LocalDateProto
    inflation_index_type: _index_type_pb2.IndexTypeProto
    def __init__(self, base_cpi: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., index_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., inflation_index_type: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ...) -> None: ...

class FrnExtensionProto(_message.Message):
    __slots__ = ("spread", "reference_rate_index", "reset_frequency")
    SPREAD_FIELD_NUMBER: _ClassVar[int]
    REFERENCE_RATE_INDEX_FIELD_NUMBER: _ClassVar[int]
    RESET_FREQUENCY_FIELD_NUMBER: _ClassVar[int]
    spread: _decimal_value_pb2.DecimalValueProto
    reference_rate_index: _index_type_pb2.IndexTypeProto
    reset_frequency: _coupon_frequency_pb2.CouponFrequencyProto
    def __init__(self, spread: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., reference_rate_index: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ..., reset_frequency: _Optional[_Union[_coupon_frequency_pb2.CouponFrequencyProto, str]] = ...) -> None: ...

class MbsExtensionProto(_message.Message):
    __slots__ = ("pool_number", "agency", "wac", "wam", "pass_through_rate", "current_factor", "original_face_value", "current_upb", "psa_speed")
    POOL_NUMBER_FIELD_NUMBER: _ClassVar[int]
    AGENCY_FIELD_NUMBER: _ClassVar[int]
    WAC_FIELD_NUMBER: _ClassVar[int]
    WAM_FIELD_NUMBER: _ClassVar[int]
    PASS_THROUGH_RATE_FIELD_NUMBER: _ClassVar[int]
    CURRENT_FACTOR_FIELD_NUMBER: _ClassVar[int]
    ORIGINAL_FACE_VALUE_FIELD_NUMBER: _ClassVar[int]
    CURRENT_UPB_FIELD_NUMBER: _ClassVar[int]
    PSA_SPEED_FIELD_NUMBER: _ClassVar[int]
    pool_number: str
    agency: _agency_pb2.AgencyProto
    wac: _decimal_value_pb2.DecimalValueProto
    wam: int
    pass_through_rate: _decimal_value_pb2.DecimalValueProto
    current_factor: _decimal_value_pb2.DecimalValueProto
    original_face_value: _decimal_value_pb2.DecimalValueProto
    current_upb: _decimal_value_pb2.DecimalValueProto
    psa_speed: _decimal_value_pb2.DecimalValueProto
    def __init__(self, pool_number: _Optional[str] = ..., agency: _Optional[_Union[_agency_pb2.AgencyProto, str]] = ..., wac: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., wam: _Optional[int] = ..., pass_through_rate: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., current_factor: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., original_face_value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., current_upb: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., psa_speed: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class IndexDetailsProto(_message.Message):
    __slots__ = ("index_type", "constituents")
    INDEX_TYPE_FIELD_NUMBER: _ClassVar[int]
    CONSTITUENTS_FIELD_NUMBER: _ClassVar[int]
    index_type: _index_type_pb2.IndexTypeProto
    constituents: _containers.RepeatedCompositeFieldContainer[SecurityProto]
    def __init__(self, index_type: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ..., constituents: _Optional[_Iterable[_Union[SecurityProto, _Mapping]]] = ...) -> None: ...

class EquityDetailsProto(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class CashDetailsProto(_message.Message):
    __slots__ = ("cash_id",)
    CASH_ID_FIELD_NUMBER: _ClassVar[int]
    cash_id: str
    def __init__(self, cash_id: _Optional[str] = ...) -> None: ...

class FxSpotDetailsProto(_message.Message):
    __slots__ = ("base_currency", "quote_currency", "convention")
    BASE_CURRENCY_FIELD_NUMBER: _ClassVar[int]
    QUOTE_CURRENCY_FIELD_NUMBER: _ClassVar[int]
    CONVENTION_FIELD_NUMBER: _ClassVar[int]
    base_currency: SecurityProto
    quote_currency: SecurityProto
    convention: str
    def __init__(self, base_currency: _Optional[_Union[SecurityProto, _Mapping]] = ..., quote_currency: _Optional[_Union[SecurityProto, _Mapping]] = ..., convention: _Optional[str] = ...) -> None: ...
