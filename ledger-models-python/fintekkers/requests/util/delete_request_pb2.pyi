from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class EntityTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_ENTITY: _ClassVar[EntityTypeProto]
    SECURITY: _ClassVar[EntityTypeProto]
    PORTFOLIO: _ClassVar[EntityTypeProto]
    TRANSACTION: _ClassVar[EntityTypeProto]
    PRICE: _ClassVar[EntityTypeProto]
    POSITION: _ClassVar[EntityTypeProto]
UNKNOWN_ENTITY: EntityTypeProto
SECURITY: EntityTypeProto
PORTFOLIO: EntityTypeProto
TRANSACTION: EntityTypeProto
PRICE: EntityTypeProto
POSITION: EntityTypeProto

class AffectedEntityProto(_message.Message):
    __slots__ = ("entity_type", "uuid", "description")
    ENTITY_TYPE_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    entity_type: EntityTypeProto
    uuid: _uuid_pb2.UUIDProto
    description: str
    def __init__(self, entity_type: _Optional[_Union[EntityTypeProto, str]] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., description: _Optional[str] = ...) -> None: ...

class DeleteRequestProto(_message.Message):
    __slots__ = ("object_class", "version", "uuid", "entity_type", "dry_run", "cascade", "force")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    ENTITY_TYPE_FIELD_NUMBER: _ClassVar[int]
    DRY_RUN_FIELD_NUMBER: _ClassVar[int]
    CASCADE_FIELD_NUMBER: _ClassVar[int]
    FORCE_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    uuid: _uuid_pb2.UUIDProto
    entity_type: EntityTypeProto
    dry_run: bool
    cascade: bool
    force: bool
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., entity_type: _Optional[_Union[EntityTypeProto, str]] = ..., dry_run: bool = ..., cascade: bool = ..., force: bool = ...) -> None: ...

class DeleteResponseProto(_message.Message):
    __slots__ = ("object_class", "version", "delete_request", "success", "was_dry_run", "total_count", "affected_entities", "warnings")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    DELETE_REQUEST_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    WAS_DRY_RUN_FIELD_NUMBER: _ClassVar[int]
    TOTAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    AFFECTED_ENTITIES_FIELD_NUMBER: _ClassVar[int]
    WARNINGS_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    delete_request: DeleteRequestProto
    success: bool
    was_dry_run: bool
    total_count: int
    affected_entities: _containers.RepeatedCompositeFieldContainer[AffectedEntityProto]
    warnings: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., delete_request: _Optional[_Union[DeleteRequestProto, _Mapping]] = ..., success: bool = ..., was_dry_run: bool = ..., total_count: _Optional[int] = ..., affected_entities: _Optional[_Iterable[_Union[AffectedEntityProto, _Mapping]]] = ..., warnings: _Optional[_Iterable[str]] = ...) -> None: ...
