from fintekkers.requests.security import query_security_request_pb2 as _query_security_request_pb2
from fintekkers.requests.security import query_security_response_pb2 as _query_security_response_pb2
from fintekkers.requests.security import create_security_request_pb2 as _create_security_request_pb2
from fintekkers.requests.security import create_security_response_pb2 as _create_security_response_pb2
from fintekkers.requests.util.errors import summary_pb2 as _summary_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import service as _service
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class Security(_service.service): ...

class Security_Stub(Security): ...
