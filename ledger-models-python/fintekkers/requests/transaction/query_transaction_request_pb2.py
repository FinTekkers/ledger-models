# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/transaction/query_transaction_request.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.util import uuid_pb2 as fintekkers_dot_models_dot_util_dot_uuid__pb2
from fintekkers.models.util import local_timestamp_pb2 as fintekkers_dot_models_dot_util_dot_local__timestamp__pb2
from fintekkers.models.position import position_filter_pb2 as fintekkers_dot_models_dot_position_dot_position__filter__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n?fintekkers/requests/transaction/query_transaction_request.proto\x12\x1f\x66intekkers.requests.transaction\x1a!fintekkers/models/util/uuid.proto\x1a,fintekkers/models/util/local_timestamp.proto\x1a\x30\x66intekkers/models/position/position_filter.proto\"\x95\x02\n\x1cQueryTransactionRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x30\n\x05uuIds\x18\x15 \x03(\x0b\x32!.fintekkers.models.util.UUIDProto\x12Q\n\x18search_transaction_input\x18\x16 \x01(\x0b\x32/.fintekkers.models.position.PositionFilterProto\x12:\n\x05\x61s_of\x18\x17 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12\r\n\x05limit\x18\x18 \x01(\x05\x42!B\x1dQueryTransactionRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.transaction.query_transaction_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\035QueryTransactionRequestProtosP\001'
  _globals['_QUERYTRANSACTIONREQUESTPROTO']._serialized_start=232
  _globals['_QUERYTRANSACTIONREQUESTPROTO']._serialized_end=509
# @@protoc_insertion_point(module_scope)
