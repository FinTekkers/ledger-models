# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/transaction/create_transaction_response.proto
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
    'fintekkers/requests/transaction/create_transaction_response.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.transaction import transaction_pb2 as fintekkers_dot_models_dot_transaction_dot_transaction__pb2
from fintekkers.requests.transaction import create_transaction_request_pb2 as fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\nAfintekkers/requests/transaction/create_transaction_response.proto\x12\x1f\x66intekkers.requests.transaction\x1a/fintekkers/models/transaction/transaction.proto\x1a@fintekkers/requests/transaction/create_transaction_request.proto\"\xfa\x01\n\x1e\x43reateTransactionResponseProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x62\n\x1a\x63reate_transaction_request\x18\x14 \x01(\x0b\x32>.fintekkers.requests.transaction.CreateTransactionRequestProto\x12M\n\x14transaction_response\x18\x1e \x01(\x0b\x32/.fintekkers.models.transaction.TransactionProtoB#B\x1f\x43reateTransactionResponseProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.transaction.create_transaction_response_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\037CreateTransactionResponseProtosP\001'
  _globals['_CREATETRANSACTIONRESPONSEPROTO']._serialized_start=218
  _globals['_CREATETRANSACTIONRESPONSEPROTO']._serialized_end=468
# @@protoc_insertion_point(module_scope)
