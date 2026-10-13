from fintekkers.models.strategy import strategy_pb2 as _strategy_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class MapFieldEntry(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: _strategy_pb2.StrategyProto
    value: _decimal_value_pb2.DecimalValueProto
    def __init__(self, key: _Optional[_Union[_strategy_pb2.StrategyProto, _Mapping]] = ..., value: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ...) -> None: ...

class StrategyAllocationProto(_message.Message):
    __slots__ = ("object_type", "version", "uuid", "as_of", "is_link", "allocations")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    IS_LINK_FIELD_NUMBER: _ClassVar[int]
    ALLOCATIONS_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    uuid: _uuid_pb2.UUIDProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    is_link: bool
    allocations: _containers.RepeatedCompositeFieldContainer[MapFieldEntry]
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_link: bool = ..., allocations: _Optional[_Iterable[_Union[MapFieldEntry, _Mapping]]] = ...) -> None: ...
