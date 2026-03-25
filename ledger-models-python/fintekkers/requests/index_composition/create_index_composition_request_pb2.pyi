from fintekkers.models.security import index_composition_pb2 as _index_composition_pb2
from fintekkers.requests.util import operation_pb2 as _operation_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CreateIndexCompositionRequestProto(_message.Message):
    __slots__ = ("object_class", "version", "operation_type", "create_index_composition_input")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    CREATE_INDEX_COMPOSITION_INPUT_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    operation_type: _operation_pb2.RequestOperationTypeProto
    create_index_composition_input: _index_composition_pb2.IndexCompositionProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., create_index_composition_input: _Optional[_Union[_index_composition_pb2.IndexCompositionProto, _Mapping]] = ...) -> None: ...

class CreateIndexCompositionResponseProto(_message.Message):
    __slots__ = ("object_class", "version", "operation_type", "create_index_composition_request", "index_composition_response")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    CREATE_INDEX_COMPOSITION_REQUEST_FIELD_NUMBER: _ClassVar[int]
    INDEX_COMPOSITION_RESPONSE_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    operation_type: _operation_pb2.RequestOperationTypeProto
    create_index_composition_request: CreateIndexCompositionRequestProto
    index_composition_response: _index_composition_pb2.IndexCompositionProto
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., create_index_composition_request: _Optional[_Union[CreateIndexCompositionRequestProto, _Mapping]] = ..., index_composition_response: _Optional[_Union[_index_composition_pb2.IndexCompositionProto, _Mapping]] = ...) -> None: ...
