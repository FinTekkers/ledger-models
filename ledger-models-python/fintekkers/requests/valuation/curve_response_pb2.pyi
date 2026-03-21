from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.position import measure_pb2 as _measure_pb2
from fintekkers.requests.valuation import curve_request_pb2 as _curve_request_pb2
from fintekkers.requests.util.errors import summary_pb2 as _summary_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CurvePointProto(_message.Message):
    __slots__ = ("tenor",)
    TENOR_FIELD_NUMBER: _ClassVar[int]
    YIELD_FIELD_NUMBER: _ClassVar[int]
    tenor: _decimal_value_pb2.DecimalValueProto
    def __init__(self, tenor: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., **kwargs) -> None: ...

class CurveResultProto(_message.Message):
    __slots__ = ("curve_type", "points")
    CURVE_TYPE_FIELD_NUMBER: _ClassVar[int]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    curve_type: _measure_pb2.MeasureProto
    points: _containers.RepeatedCompositeFieldContainer[CurvePointProto]
    def __init__(self, curve_type: _Optional[_Union[_measure_pb2.MeasureProto, str]] = ..., points: _Optional[_Iterable[_Union[CurvePointProto, _Mapping]]] = ...) -> None: ...

class CurveResponseProto(_message.Message):
    __slots__ = ("object_class", "version", "curve_request", "curve_results", "summary")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    CURVE_REQUEST_FIELD_NUMBER: _ClassVar[int]
    CURVE_RESULTS_FIELD_NUMBER: _ClassVar[int]
    SUMMARY_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    curve_request: _curve_request_pb2.CurveRequestProto
    curve_results: _containers.RepeatedCompositeFieldContainer[CurveResultProto]
    summary: _summary_pb2.SummaryProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., curve_request: _Optional[_Union[_curve_request_pb2.CurveRequestProto, _Mapping]] = ..., curve_results: _Optional[_Iterable[_Union[CurveResultProto, _Mapping]]] = ..., summary: _Optional[_Union[_summary_pb2.SummaryProto, _Mapping]] = ...) -> None: ...
