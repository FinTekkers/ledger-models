# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/security/create_security_request.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    29,
    0,
    '',
    'fintekkers/requests/security/create_security_request.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.security import security_pb2 as fintekkers_dot_models_dot_security_dot_security__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n:fintekkers/requests/security/create_security_request.proto\x12\x1c\x66intekkers.requests.security\x1a)fintekkers/models/security/security.proto\"\x86\x01\n\x1a\x43reateSecurityRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x41\n\x0esecurity_input\x18\x14 \x01(\x0b\x32).fintekkers.models.security.SecurityProtoB\x1f\x42\x1b\x43reateSecurityRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.security.create_security_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\033CreateSecurityRequestProtosP\001'
  _globals['_CREATESECURITYREQUESTPROTO']._serialized_start=136
  _globals['_CREATESECURITYREQUESTPROTO']._serialized_end=270
# @@protoc_insertion_point(module_scope)
