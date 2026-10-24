from fintekkers.models.portfolio import amortisation_elections_pb2 as _amortisation_elections_pb2
from fintekkers.models.position import tax_lot_pb2 as _tax_lot_pb2
from fintekkers.models.security import security_pb2 as _security_pb2
from fintekkers.models.security.index import index_type_pb2 as _index_type_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ProductInput(_message.Message):
    __slots__ = ("bond", "tips", "frn")
    BOND_FIELD_NUMBER: _ClassVar[int]
    TIPS_FIELD_NUMBER: _ClassVar[int]
    FRN_FIELD_NUMBER: _ClassVar[int]
    bond: BondInput
    tips: TipsInput
    frn: FrnInput
    def __init__(self, bond: _Optional[_Union[BondInput, _Mapping]] = ..., tips: _Optional[_Union[TipsInput, _Mapping]] = ..., frn: _Optional[_Union[FrnInput, _Mapping]] = ...) -> None: ...

class BondInput(_message.Message):
    __slots__ = ("security", "clean_price", "benchmark_curve", "cost_basis")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    CLEAN_PRICE_FIELD_NUMBER: _ClassVar[int]
    BENCHMARK_CURVE_FIELD_NUMBER: _ClassVar[int]
    COST_BASIS_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    clean_price: _decimal_value_pb2.DecimalValueProto
    benchmark_curve: SecurityBasedCurveInput
    cost_basis: CostBasisInput
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., clean_price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., benchmark_curve: _Optional[_Union[SecurityBasedCurveInput, _Mapping]] = ..., cost_basis: _Optional[_Union[CostBasisInput, _Mapping]] = ...) -> None: ...

class TipsInput(_message.Message):
    __slots__ = ("security", "clean_price", "cpi", "cost_basis")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    CLEAN_PRICE_FIELD_NUMBER: _ClassVar[int]
    CPI_FIELD_NUMBER: _ClassVar[int]
    COST_BASIS_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    clean_price: _decimal_value_pb2.DecimalValueProto
    cpi: InflationIndexInput
    cost_basis: CostBasisInput
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., clean_price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., cpi: _Optional[_Union[InflationIndexInput, _Mapping]] = ..., cost_basis: _Optional[_Union[CostBasisInput, _Mapping]] = ...) -> None: ...

class CostBasisInput(_message.Message):
    __slots__ = ("elections", "lots")
    ELECTIONS_FIELD_NUMBER: _ClassVar[int]
    LOTS_FIELD_NUMBER: _ClassVar[int]
    elections: _amortisation_elections_pb2.AmortisationElectionsProto
    lots: _containers.RepeatedCompositeFieldContainer[_tax_lot_pb2.TaxLotProto]
    def __init__(self, elections: _Optional[_Union[_amortisation_elections_pb2.AmortisationElectionsProto, _Mapping]] = ..., lots: _Optional[_Iterable[_Union[_tax_lot_pb2.TaxLotProto, _Mapping]]] = ...) -> None: ...

class InflationIndexInput(_message.Message):
    __slots__ = ("index", "readings", "reference_cpi")
    INDEX_FIELD_NUMBER: _ClassVar[int]
    READINGS_FIELD_NUMBER: _ClassVar[int]
    REFERENCE_CPI_FIELD_NUMBER: _ClassVar[int]
    index: _security_pb2.SecurityProto
    readings: MonthlyIndexReadings
    reference_cpi: _decimal_value_pb2.DecimalValueProto
    def __init__(self, index: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., readings: _Optional[_Union[MonthlyIndexReadings, _Mapping]] = ..., reference_cpi: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class MonthlyIndexReadings(_message.Message):
    __slots__ = ("readings",)
    READINGS_FIELD_NUMBER: _ClassVar[int]
    readings: _containers.RepeatedCompositeFieldContainer[MonthlyIndexReading]
    def __init__(self, readings: _Optional[_Iterable[_Union[MonthlyIndexReading, _Mapping]]] = ...) -> None: ...

class MonthlyIndexReading(_message.Message):
    __slots__ = ("year", "month", "value")
    YEAR_FIELD_NUMBER: _ClassVar[int]
    MONTH_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    year: int
    month: int
    value: _decimal_value_pb2.DecimalValueProto
    def __init__(self, year: _Optional[int] = ..., month: _Optional[int] = ..., value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class FrnInput(_message.Message):
    __slots__ = ("security", "clean_price", "curve", "fixings", "cost_basis")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    CLEAN_PRICE_FIELD_NUMBER: _ClassVar[int]
    CURVE_FIELD_NUMBER: _ClassVar[int]
    FIXINGS_FIELD_NUMBER: _ClassVar[int]
    COST_BASIS_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    clean_price: _decimal_value_pb2.DecimalValueProto
    curve: YieldCurveInput
    fixings: _containers.RepeatedCompositeFieldContainer[ReferenceRateFixingProto]
    cost_basis: CostBasisInput
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., clean_price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., curve: _Optional[_Union[YieldCurveInput, _Mapping]] = ..., fixings: _Optional[_Iterable[_Union[ReferenceRateFixingProto, _Mapping]]] = ..., cost_basis: _Optional[_Union[CostBasisInput, _Mapping]] = ...) -> None: ...

class ReferenceRateFixingProto(_message.Message):
    __slots__ = ("index", "fixing_date", "rate", "bill_maturity_date", "bill_issue_date")
    INDEX_FIELD_NUMBER: _ClassVar[int]
    FIXING_DATE_FIELD_NUMBER: _ClassVar[int]
    RATE_FIELD_NUMBER: _ClassVar[int]
    BILL_MATURITY_DATE_FIELD_NUMBER: _ClassVar[int]
    BILL_ISSUE_DATE_FIELD_NUMBER: _ClassVar[int]
    index: _index_type_pb2.IndexTypeProto
    fixing_date: _local_date_pb2.LocalDateProto
    rate: _decimal_value_pb2.DecimalValueProto
    bill_maturity_date: _local_date_pb2.LocalDateProto
    bill_issue_date: _local_date_pb2.LocalDateProto
    def __init__(self, index: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ..., fixing_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., rate: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., bill_maturity_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., bill_issue_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ...) -> None: ...

class YieldCurveInput(_message.Message):
    __slots__ = ("index", "reference_date", "points")
    INDEX_FIELD_NUMBER: _ClassVar[int]
    REFERENCE_DATE_FIELD_NUMBER: _ClassVar[int]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    index: _index_type_pb2.IndexTypeProto
    reference_date: _local_date_pb2.LocalDateProto
    points: _containers.RepeatedCompositeFieldContainer[CurvePoint]
    def __init__(self, index: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ..., reference_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., points: _Optional[_Iterable[_Union[CurvePoint, _Mapping]]] = ...) -> None: ...

class CurvePoint(_message.Message):
    __slots__ = ("tenor", "rate")
    TENOR_FIELD_NUMBER: _ClassVar[int]
    RATE_FIELD_NUMBER: _ClassVar[int]
    tenor: _decimal_value_pb2.DecimalValueProto
    rate: _decimal_value_pb2.DecimalValueProto
    def __init__(self, tenor: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., rate: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class SecurityBasedCurveInput(_message.Message):
    __slots__ = ("index", "reference_date", "points")
    INDEX_FIELD_NUMBER: _ClassVar[int]
    REFERENCE_DATE_FIELD_NUMBER: _ClassVar[int]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    index: _index_type_pb2.IndexTypeProto
    reference_date: _local_date_pb2.LocalDateProto
    points: _containers.RepeatedCompositeFieldContainer[SecurityCurvePoint]
    def __init__(self, index: _Optional[_Union[_index_type_pb2.IndexTypeProto, str]] = ..., reference_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., points: _Optional[_Iterable[_Union[SecurityCurvePoint, _Mapping]]] = ...) -> None: ...

class SecurityCurvePoint(_message.Message):
    __slots__ = ("security", "clean_price")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    CLEAN_PRICE_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    clean_price: _decimal_value_pb2.DecimalValueProto
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., clean_price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...
