from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class SecurityMetricTypeProto(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    UNKNOWN_SECURITY_METRIC: _ClassVar[SecurityMetricTypeProto]
    SHARES_OUTSTANDING: _ClassVar[SecurityMetricTypeProto]
    NAV_PER_SHARE: _ClassVar[SecurityMetricTypeProto]
    TOTAL_NET_ASSETS: _ClassVar[SecurityMetricTypeProto]
UNKNOWN_SECURITY_METRIC: SecurityMetricTypeProto
SHARES_OUTSTANDING: SecurityMetricTypeProto
NAV_PER_SHARE: SecurityMetricTypeProto
TOTAL_NET_ASSETS: SecurityMetricTypeProto
