from fintekkers.models.price import price_pb2 as _price_pb2
from fintekkers.requests.price import query_price_request_pb2 as _query_price_request_pb2
from fintekkers.requests.util.errors import summary_pb2 as _summary_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QueryPriceResponseProto(_message.Message):
    __slots__ = ("object_type", "version", "query_price_request", "price_response", "errors_or_warnings", "next_page_token")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    QUERY_PRICE_REQUEST_FIELD_NUMBER: _ClassVar[int]
    PRICE_RESPONSE_FIELD_NUMBER: _ClassVar[int]
    ERRORS_OR_WARNINGS_FIELD_NUMBER: _ClassVar[int]
    NEXT_PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    query_price_request: _query_price_request_pb2.QueryPriceRequestProto
    price_response: _containers.RepeatedCompositeFieldContainer[_price_pb2.PriceProto]
    errors_or_warnings: _summary_pb2.SummaryProto
    next_page_token: str
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., query_price_request: _Optional[_Union[_query_price_request_pb2.QueryPriceRequestProto, _Mapping]] = ..., price_response: _Optional[_Iterable[_Union[_price_pb2.PriceProto, _Mapping]]] = ..., errors_or_warnings: _Optional[_Union[_summary_pb2.SummaryProto, _Mapping]] = ..., next_page_token: _Optional[str] = ...) -> None: ...
