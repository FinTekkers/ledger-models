# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: requests/security/create_security_request.proto
"""Generated protocol buffer code."""
from google.protobuf.internal import builder as _builder
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from models.security import security_pb2 as models_dot_security_dot_security__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n/requests/security/create_security_request.proto\x12\x08security\x1a\x1emodels/security/security.proto\"t\n\x1a\x43reateSecurityRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12/\n\x0esecurity_input\x18\x14 \x01(\x0b\x32\x17.security.SecurityProtoB/\n\x0e\x63ommon.requestB\x1b\x43reateSecurityRequestProtosP\x01\x62\x06proto3')

_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'requests.security.create_security_request_pb2', globals())
if _descriptor._USE_C_DESCRIPTORS == False:

  DESCRIPTOR._options = None
  DESCRIPTOR._serialized_options = b'\n\016common.requestB\033CreateSecurityRequestProtosP\001'
  _CREATESECURITYREQUESTPROTO._serialized_start=93
  _CREATESECURITYREQUESTPROTO._serialized_end=209
# @@protoc_insertion_point(module_scope)
