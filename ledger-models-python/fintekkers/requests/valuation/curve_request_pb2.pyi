from fintekkers.models.security import security_pb2 as _security_pb2
from fintekkers.models.price import price_pb2 as _price_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.position import measure_pb2 as _measure_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CurveInputProto(_message.Message):
    __slots__ = ("security", "price")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    price: _price_pb2.PriceProto
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., price: _Optional[_Union[_price_pb2.PriceProto, _Mapping]] = ...) -> None: ...

class CurveRequestProto(_message.Message):
    __slots__ = ("object_class", "version", "asof_datetime", "curve_types", "curve_inputs", "tenor_points")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    ASOF_DATETIME_FIELD_NUMBER: _ClassVar[int]
    CURVE_TYPES_FIELD_NUMBER: _ClassVar[int]
    CURVE_INPUTS_FIELD_NUMBER: _ClassVar[int]
    TENOR_POINTS_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    asof_datetime: _local_timestamp_pb2.LocalTimestampProto
    curve_types: _containers.RepeatedScalarFieldContainer[_measure_pb2.MeasureProto]
    curve_inputs: _containers.RepeatedCompositeFieldContainer[CurveInputProto]
    tenor_points: _containers.RepeatedCompositeFieldContainer[_decimal_value_pb2.DecimalValueProto]
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., asof_datetime: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., curve_types: _Optional[_Iterable[_Union[_measure_pb2.MeasureProto, str]]] = ..., curve_inputs: _Optional[_Iterable[_Union[CurveInputProto, _Mapping]]] = ..., tenor_points: _Optional[_Iterable[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]]] = ...) -> None: ...
