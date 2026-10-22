from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class TaxLotProto(_message.Message):
    __slots__ = ("open_date", "open_quantity", "price")
    OPEN_DATE_FIELD_NUMBER: _ClassVar[int]
    OPEN_QUANTITY_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    open_date: _local_date_pb2.LocalDateProto
    open_quantity: _decimal_value_pb2.DecimalValueProto
    price: _decimal_value_pb2.DecimalValueProto
    def __init__(self, open_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., open_quantity: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., price: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...
