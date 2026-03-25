from fintekkers.requests.position import query_position_request_pb2 as _query_position_request_pb2
from fintekkers.requests.position import query_position_response_pb2 as _query_position_response_pb2
from fintekkers.requests.util.errors import summary_pb2 as _summary_pb2
from fintekkers.requests.security import get_field_values_request_pb2 as _get_field_values_request_pb2
from fintekkers.requests.security import get_field_values_response_pb2 as _get_field_values_response_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import service as _service
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class Position(_service.service): ...

class Position_Stub(Position): ...
