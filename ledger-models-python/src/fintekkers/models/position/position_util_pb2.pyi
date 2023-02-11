from google.protobuf import any_pb2 as _any_pb2
from fintekkers.models.position import field_pb2 as _field_pb2
from fintekkers.models.position import measure_pb2 as _measure_pb2
from fintekkers.models.security.identifier import identifier_pb2 as _identifier_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor
EQUALS: PositionFilterOperator
LESS_THAN: PositionFilterOperator
LESS_THAN_OR_EQUALS: PositionFilterOperator
MORE_THAN: PositionFilterOperator
MORE_THAN_OR_EQUALS: PositionFilterOperator
NOT_EQUALS: PositionFilterOperator
UNKNOWN_OPERATOR: PositionFilterOperator

class FieldMapEntry(_message.Message):
    __slots__ = ["enum_value", "field", "field_value_packed", "identifier", "operator"]
    ENUM_VALUE_FIELD_NUMBER: _ClassVar[int]
    FIELD_FIELD_NUMBER: _ClassVar[int]
    FIELD_VALUE_PACKED_FIELD_NUMBER: _ClassVar[int]
    IDENTIFIER_FIELD_NUMBER: _ClassVar[int]
    OPERATOR_FIELD_NUMBER: _ClassVar[int]
    enum_value: str
    field: _field_pb2.FieldProto
    field_value_packed: _any_pb2.Any
    identifier: _identifier_pb2.IdentifierProto
    operator: PositionFilterOperator
    def __init__(self, field: _Optional[_Union[_field_pb2.FieldProto, str]] = ..., field_value_packed: _Optional[_Union[_any_pb2.Any, _Mapping]] = ..., enum_value: _Optional[str] = ..., identifier: _Optional[_Union[_identifier_pb2.IdentifierProto, _Mapping]] = ..., operator: _Optional[_Union[PositionFilterOperator, str]] = ...) -> None: ...

class MeasureMapEntry(_message.Message):
    __slots__ = ["field", "measure_value"]
    FIELD_FIELD_NUMBER: _ClassVar[int]
    MEASURE_VALUE_FIELD_NUMBER: _ClassVar[int]
    field: _measure_pb2.MeasureProto
    measure_value: _decimal_value_pb2.DecimalValueProto
    def __init__(self, field: _Optional[_Union[_measure_pb2.MeasureProto, str]] = ..., measure_value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class PositionFilterOperator(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []