from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class AgencyProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    AGENCY_UNKNOWN: _ClassVar[AgencyProto]
    FNMA: _ClassVar[AgencyProto]
    FHLMC: _ClassVar[AgencyProto]
    GNMA: _ClassVar[AgencyProto]
AGENCY_UNKNOWN: AgencyProto
FNMA: AgencyProto
FHLMC: AgencyProto
GNMA: AgencyProto
