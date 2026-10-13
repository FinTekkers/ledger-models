from fintekkers.models.util.lock import node_partition_pb2 as _node_partition_pb2
from fintekkers.models.util import endpoint_pb2 as _endpoint_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class LockRequestProto(_message.Message):
    __slots__ = ("object_type", "version", "node_partition", "endpoint")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    NODE_PARTITION_FIELD_NUMBER: _ClassVar[int]
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    node_partition: _node_partition_pb2.NodePartition
    endpoint: _endpoint_pb2.Endpoint
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., node_partition: _Optional[_Union[_node_partition_pb2.NodePartition, _Mapping]] = ..., endpoint: _Optional[_Union[_endpoint_pb2.Endpoint, _Mapping]] = ...) -> None: ...
