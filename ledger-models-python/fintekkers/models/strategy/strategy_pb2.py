# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/models/strategy/strategy.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.util import local_timestamp_pb2 as fintekkers_dot_models_dot_util_dot_local__timestamp__pb2
from fintekkers.models.util import uuid_pb2 as fintekkers_dot_models_dot_util_dot_uuid__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n)fintekkers/models/strategy/strategy.proto\x12\x1a\x66intekkers.models.strategy\x1a,fintekkers/models/util/local_timestamp.proto\x1a!fintekkers/models/util/uuid.proto\"\x86\x03\n\rStrategyProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12/\n\x04uuid\x18\x05 \x01(\x0b\x32!.fintekkers.models.util.UUIDProto\x12:\n\x05\x61s_of\x18\x06 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12\x0f\n\x07is_link\x18\x07 \x01(\x08\x12?\n\nvalid_from\x18\x08 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12=\n\x08valid_to\x18\t \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12\x15\n\rstrategy_name\x18\n \x01(\t\x12\x39\n\x06parent\x18\x0b \x01(\x0b\x32).fintekkers.models.strategy.StrategyProtoB\x12\x42\x0eStrategyProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.models.strategy.strategy_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\016StrategyProtosP\001'
  _globals['_STRATEGYPROTO']._serialized_start=155
  _globals['_STRATEGYPROTO']._serialized_end=545
# @@protoc_insertion_point(module_scope)
