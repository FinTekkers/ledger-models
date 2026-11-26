from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class DayCountConventionProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_DAY_COUNT: _ClassVar[DayCountConventionProto]
    ACT_ACT_ICMA: _ClassVar[DayCountConventionProto]
    THIRTY_360_US: _ClassVar[DayCountConventionProto]
    ACT_360: _ClassVar[DayCountConventionProto]
    ACT_365_FIXED: _ClassVar[DayCountConventionProto]
UNKNOWN_DAY_COUNT: DayCountConventionProto
ACT_ACT_ICMA: DayCountConventionProto
THIRTY_360_US: DayCountConventionProto
ACT_360: DayCountConventionProto
ACT_365_FIXED: DayCountConventionProto
