# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/transaction/create_transaction_request.proto
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
    'fintekkers/requests/transaction/create_transaction_request.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.transaction import transaction_pb2 as fintekkers_dot_models_dot_transaction_dot_transaction__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n@fintekkers/requests/transaction/create_transaction_request.proto\x12\x1f\x66intekkers.requests.transaction\x1a/fintekkers/models/transaction/transaction.proto\"\x99\x01\n\x1d\x43reateTransactionRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12Q\n\x18\x63reate_transaction_input\x18\x14 \x01(\x0b\x32/.fintekkers.models.transaction.TransactionProtoB\"B\x1e\x43reateTransactionRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.transaction.create_transaction_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\036CreateTransactionRequestProtosP\001'
  _globals['_CREATETRANSACTIONREQUESTPROTO']._serialized_start=151
  _globals['_CREATETRANSACTIONREQUESTPROTO']._serialized_end=304
# @@protoc_insertion_point(module_scope)
