# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/security/create_security_response.proto
# Protobuf Python Version: 6.31.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    6,
    31,
    0,
    '',
    'fintekkers/requests/security/create_security_response.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.security import security_pb2 as fintekkers_dot_models_dot_security_dot_security__pb2
from fintekkers.requests.security import create_security_request_pb2 as fintekkers_dot_requests_dot_security_dot_create__security__request__pb2
from fintekkers.requests.util.errors import summary_pb2 as fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n;fintekkers/requests/security/create_security_response.proto\x12\x1c\x66intekkers.requests.security\x1a)fintekkers/models/security/security.proto\x1a:fintekkers/requests/security/create_security_request.proto\x1a-fintekkers/requests/util/errors/summary.proto\"\xa9\x02\n\x1b\x43reateSecurityResponseProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12R\n\x10security_request\x18\x14 \x01(\x0b\x32\x38.fintekkers.requests.security.CreateSecurityRequestProto\x12\x44\n\x11security_response\x18\x1e \x01(\x0b\x32).fintekkers.models.security.SecurityProto\x12I\n\x12\x65rrors_or_warnings\x18( \x01(\x0b\x32-.fintekkers.requests.util.errors.SummaryProtoB B\x1c\x43reateSecurityResponseProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.security.create_security_response_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\034CreateSecurityResponseProtosP\001'
  _globals['_CREATESECURITYRESPONSEPROTO']._serialized_start=244
  _globals['_CREATESECURITYRESPONSEPROTO']._serialized_end=541
# @@protoc_insertion_point(module_scope)
