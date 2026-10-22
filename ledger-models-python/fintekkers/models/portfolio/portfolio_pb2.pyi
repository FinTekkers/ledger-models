from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.models.util import uuid_pb2 as _uuid_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from fintekkers.models.portfolio import amortisation_elections_pb2 as _amortisation_elections_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class PortfolioProto(_message.Message):
    __slots__ = ("object_type", "version", "uuid", "as_of", "is_link", "valid_from", "valid_to", "portfolio_name", "amortisation_elections")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    UUID_FIELD_NUMBER: _ClassVar[int]
    AS_OF_FIELD_NUMBER: _ClassVar[int]
    IS_LINK_FIELD_NUMBER: _ClassVar[int]
    VALID_FROM_FIELD_NUMBER: _ClassVar[int]
    VALID_TO_FIELD_NUMBER: _ClassVar[int]
    PORTFOLIO_NAME_FIELD_NUMBER: _ClassVar[int]
    AMORTISATION_ELECTIONS_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    uuid: _uuid_pb2.UUIDProto
    as_of: _local_timestamp_pb2.LocalTimestampProto
    is_link: bool
    valid_from: _local_timestamp_pb2.LocalTimestampProto
    valid_to: _local_timestamp_pb2.LocalTimestampProto
    portfolio_name: str
    amortisation_elections: _amortisation_elections_pb2.AmortisationElectionsProto
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., uuid: _Optional[_Union[_uuid_pb2.UUIDProto, _Mapping]] = ..., as_of: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., is_link: bool = ..., valid_from: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., valid_to: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., portfolio_name: _Optional[str] = ..., amortisation_elections: _Optional[_Union[_amortisation_elections_pb2.AmortisationElectionsProto, _Mapping]] = ...) -> None: ...
