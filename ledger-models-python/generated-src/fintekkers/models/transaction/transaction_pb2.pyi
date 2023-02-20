from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.portfolio import portfolio_pb2 as _portfolio_pb2
from fintekkers.models.strategy import strategy_allocation_pb2 as _strategy_allocation_pb2
from fintekkers.models.security import security_pb2 as _security_pb2
from fintekkers.models.price import price_pb2 as _price_pb2
from fintekkers.models.position import position_status_pb2 as _position_status_pb2
from fintekkers.models.transaction import transaction_type_pb2 as _transaction_type_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class TransactionProto(_message.Message):
    __slots__ = ["as_of", "childTransactions", "is_cancelled", "is_link", "object_class", "portfolio", "position_status", "price", "quantity", "security", "settlement_date", "strategy_allocation", "trade_date", "trade_name", "transaction_type", "uuid", "version"]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    CHILDTRANSACTIONS_FIELD_NUMBER: _ClassVar[int]
    IS_CANCELLED_FIELD_NUMBER: _ClassVar[int]
    IS_LINK_FIELD_NUMBER: _ClassVar[int]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    PORTFOLIO_FIELD_NUMBER: _ClassVar[int]
    POSITION_STATUS_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    QUANTITY_FIELD_NUMBER: _ClassVar[int]
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    SETTLEMENT_DATE_FIELD_NUMBER: _ClassVar[int]
    STRATEGY_ALLOCATION_FIELD_NUMBER: _ClassVar[int]
    TRADE_DATE_FIELD_NUMBER: _ClassVar[int]
    TRADE_NAME_FIELD_NUMBER: _ClassVar[int]
    TRANSACTION_TYPE_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    as_of: _local_timestamp_pb2.LocalTimestampProto
    childTransactions: _containers.RepeatedCompositeFieldContainer[TransactionProto]
    is_cancelled: bool
    is_link: bool
    object_class: str
    portfolio: _portfolio_pb2.PortfolioProto
    position_status: _position_status_pb2.PositionStatusProto
    price: _price_pb2.PriceProto
    quantity: _decimal_value_pb2.DecimalValueProto
    security: _security_pb2.SecurityProto
    settlement_date: _local_date_pb2.LocalDateProto
    strategy_allocation: _strategy_allocation_pb2.StrategyAllocationProto
    trade_date: _local_date_pb2.LocalDateProto
    trade_name: str
    transaction_type: _transaction_type_pb2.TransactionTypeProto
    uuid: _uuid_pb2.UUIDProto
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_link: bool = ..., portfolio: _Optional[_Union[_portfolio_pb2.PortfolioProto, _Mapping]] = ..., security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., transaction_type: _Optional[_Union[_transaction_type_pb2.TransactionTypeProto, str]] = ..., quantity: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., price: _Optional[_Union[_price_pb2.PriceProto, _Mapping]] = ..., trade_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., settlement_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., childTransactions: _Optional[_Iterable[_Union[TransactionProto, _Mapping]]] = ..., position_status: _Optional[_Union[_position_status_pb2.PositionStatusProto, str]] = ..., trade_name: _Optional[str] = ..., strategy_allocation: _Optional[_Union[_strategy_allocation_pb2.StrategyAllocationProto, _Mapping]] = ..., is_cancelled: bool = ...) -> None: ...
