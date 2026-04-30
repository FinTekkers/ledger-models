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
    __slots__ = ("frn",)
    FRN_FIELD_NUMBER: _ClassVar[int]
    frn: FrnInput
    def __init__(self, frn: _Optional[_Union[FrnInput, _Mapping]] = ...) -> None: ...

class FrnInput(_message.Message):
    __slots__ = ("security", "clean_price", "curve")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    CLEAN_PRICE_FIELD_NUMBER: _ClassVar[int]
    CURVE_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    clean_price: _decimal_value_pb2.DecimalValueProto
    curve: YieldCurveInput
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., clean_price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., curve: _Optional[_Union[YieldCurveInput, _Mapping]] = ...) -> None: ...

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
