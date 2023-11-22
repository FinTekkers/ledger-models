from fintekkers.models.security.bond import auction_type_pb2 as _auction_type_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IssuanceProto(_message.Message):
    __slots__ = ["as_of", "auction_announcement_date", "auction_issue_date", "auction_offering_amount", "auction_type", "mature_security_amount", "object_class", "post_auction_outstanding_quantity", "price_for_single_price_auction", "total_accepted", "valid_from", "valid_to", "version"]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    AUCTION_ANNOUNCEMENT_DATE_FIELD_NUMBER: _ClassVar[int]
    AUCTION_ISSUE_DATE_FIELD_NUMBER: _ClassVar[int]
    AUCTION_OFFERING_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    AUCTION_TYPE_FIELD_NUMBER: _ClassVar[int]
    MATURE_SECURITY_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    POST_AUCTION_OUTSTANDING_QUANTITY_FIELD_NUMBER: _ClassVar[int]
    PRICE_FOR_SINGLE_PRICE_AUCTION_FIELD_NUMBER: _ClassVar[int]
    TOTAL_ACCEPTED_FIELD_NUMBER: _ClassVar[int]
    VALID_FROM_FIELD_NUMBER: _ClassVar[int]
    VALID_TO_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    as_of: _local_timestamp_pb2.LocalTimestampProto
    auction_announcement_date: _local_date_pb2.LocalDateProto
    auction_issue_date: _local_date_pb2.LocalDateProto
    auction_offering_amount: _decimal_value_pb2.DecimalValueProto
    auction_type: _auction_type_pb2.AuctionTypeProto
    mature_security_amount: _decimal_value_pb2.DecimalValueProto
    object_class: str
    post_auction_outstanding_quantity: _decimal_value_pb2.DecimalValueProto
    price_for_single_price_auction: _decimal_value_pb2.DecimalValueProto
    total_accepted: _decimal_value_pb2.DecimalValueProto
    valid_from: _local_timestamp_pb2.LocalTimestampProto
    valid_to: _local_timestamp_pb2.LocalTimestampProto
    version: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., valid_from: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., valid_to: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., auction_announcement_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., auction_issue_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., post_auction_outstanding_quantity: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., auction_offering_amount: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., auction_type: _Optional[_Union[_auction_type_pb2.AuctionTypeProto, str]] = ..., price_for_single_price_auction: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., total_accepted: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., mature_security_amount: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...
