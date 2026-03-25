from fintekkers.models.util import decimal_value_pb2 as _decimal_value_pb2
from fintekkers.models.util import local_date_pb2 as _local_date_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.security import security_pb2 as _security_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IndexCompositionProto(_message.Message):
    __slots__ = ("object_class", "version", "uuid", "as_of", "is_link", "valid_from", "valid_to", "index_security", "effective_date", "constituents", "index_divisor", "notes")
    OBJECT_CLASS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    IS_LINK_FIELD_NUMBER: _ClassVar[int]
    VALID_FROM_FIELD_NUMBER: _ClassVar[int]
    VALID_TO_FIELD_NUMBER: _ClassVar[int]
    INDEX_SECURITY_FIELD_NUMBER: _ClassVar[int]
    EFFECTIVE_DATE_FIELD_NUMBER: _ClassVar[int]
    CONSTITUENTS_FIELD_NUMBER: _ClassVar[int]
    INDEX_DIVISOR_FIELD_NUMBER: _ClassVar[int]
    NOTES_FIELD_NUMBER: _ClassVar[int]
    object_class: str
    version: str
    uuid: _uuid_pb2.UUIDProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    is_link: bool
    valid_from: _local_timestamp_pb2.LocalTimestampProto
    valid_to: _local_timestamp_pb2.LocalTimestampProto
    index_security: _security_pb2.SecurityProto
    effective_date: _local_date_pb2.LocalDateProto
    constituents: _containers.RepeatedCompositeFieldContainer[IndexConstituentProto]
    index_divisor: _decimal_value_pb2.DecimalValueProto
    notes: str
    def __init__(self, object_class: _Optional[str] = ..., version: _Optional[str] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_link: bool = ..., valid_from: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., valid_to: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., index_security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., effective_date: _Optional[_Union[_local_date_pb2.LocalDateProto, _Mapping]] = ..., constituents: _Optional[_Iterable[_Union[IndexConstituentProto, _Mapping]]] = ..., index_divisor: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., notes: _Optional[str] = ...) -> None: ...

class IndexConstituentProto(_message.Message):
    __slots__ = ("security", "weight", "shares_in_index", "currency")
    SECURITY_FIELD_NUMBER: _ClassVar[int]
    WEIGHT_FIELD_NUMBER: _ClassVar[int]
    SHARES_IN_INDEX_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_FIELD_NUMBER: _ClassVar[int]
    security: _security_pb2.SecurityProto
    weight: _decimal_value_pb2.DecimalValueProto
    shares_in_index: _decimal_value_pb2.DecimalValueProto
    currency: str
    def __init__(self, security: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., weight: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., shares_in_index: _Optional[_Union[_decimal_value_pb2.DecimalValueProto, _Mapping]] = ..., currency: _Optional[str] = ...) -> None: ...
