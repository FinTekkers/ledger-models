from fintekkers.models.portfolio import portfolio_pb2 as _portfolio_pb2
from fintekkers.requests.portfolio import query_portfolio_request_pb2 as _query_portfolio_request_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QueryPortfolioResponseProto(_message.Message):
    __slots__ = ("object_type", "version", "query_portfolio_request", "portfolio_response", "next_page_token")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    QUERY_PORTFOLIO_REQUEST_FIELD_NUMBER: _ClassVar[int]
    PORTFOLIO_RESPONSE_FIELD_NUMBER: _ClassVar[int]
    NEXT_PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    query_portfolio_request: _query_portfolio_request_pb2.QueryPortfolioRequestProto
    portfolio_response: _containers.RepeatedCompositeFieldContainer[_portfolio_pb2.PortfolioProto]
    next_page_token: str
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., query_portfolio_request: _Optional[_Union[_query_portfolio_request_pb2.QueryPortfolioRequestProto, _Mapping]] = ..., portfolio_response: _Optional[_Iterable[_Union[_portfolio_pb2.PortfolioProto, _Mapping]]] = ..., next_page_token: _Optional[str] = ...) -> None: ...
