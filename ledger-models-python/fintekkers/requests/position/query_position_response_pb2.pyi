from fintekkers.models.position import position_pb2 as _position_pb2
from fintekkers.requests.position import query_position_request_pb2 as _query_position_request_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QueryPositionResponseProto(_message.Message):
    __slots__ = ("object_class", "version", "object_type", "version_major", "version_minor", "version_patch", "position_request", "reporting_currency", "positions")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_MAJOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_MINOR_FIELD_NUMBER: _ClassVar[int]
    VERSION_PATCH_FIELD_NUMBER: _ClassVar[int]
    POSITION_REQUEST_FIELD_NUMBER: _ClassVar[int]
    REPORTING_CURRENCY_FIELD_NUMBER: _ClassVar[int]
    POSITIONS_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    object_type: _object_type_pb2.ObjectTypeProto
    version_major: int
    version_minor: int
    version_patch: int
    position_request: _query_position_request_pb2.QueryPositionRequestProto
    reporting_currency: str
    positions: _containers.RepeatedCompositeFieldContainer[_position_pb2.PositionProto]
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version_major: _Optional[int] = ..., version_minor: _Optional[int] = ..., version_patch: _Optional[int] = ..., position_request: _Optional[_Union[_query_position_request_pb2.QueryPositionRequestProto, _Mapping]] = ..., reporting_currency: _Optional[str] = ..., positions: _Optional[_Iterable[_Union[_position_pb2.PositionProto, _Mapping]]] = ...) -> None: ...
