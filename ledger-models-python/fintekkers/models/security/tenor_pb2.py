# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/models/security/tenor.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.security import tenor_type_pb2 as fintekkers_dot_models_dot_security_dot_tenor__type__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n&fintekkers/models/security/tenor.proto\x12\x1a\x66intekkers.models.security\x1a+fintekkers/models/security/tenor_type.proto\"\x87\x01\n\nTenorProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x12\n\nterm_value\x18\x05 \x01(\t\x12>\n\ntenor_type\x18\x06 \x01(\x0e\x32*.fintekkers.models.security.TenorTypeProtoB\x0f\x42\x0bTenorProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.models.security.tenor_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\013TenorProtosP\001'
  _globals['_TENORPROTO']._serialized_start=116
  _globals['_TENORPROTO']._serialized_end=251
# @@protoc_insertion_point(module_scope)
