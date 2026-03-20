from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CashflowProto(_message.Message):
    __slots__ = ("cashflow_date", "pv_amount", "fv_amount", "coupon_rate")
    CASHFLOW_DATE_FIELD_NUMBER: _ClassVar[int]
    PV_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    FV_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    COUPON_RATE_FIELD_NUMBER: _ClassVar[int]
    cashflow_date: _local_date_pb2.LocalDateProto
    pv_amount: _decimal_value_pb2.DecimalValueProto
    fv_amount: _decimal_value_pb2.DecimalValueProto
    coupon_rate: _decimal_value_pb2.DecimalValueProto
    def __init__(self, cashflow_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., pv_amount: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., fv_amount: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., coupon_rate: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...
