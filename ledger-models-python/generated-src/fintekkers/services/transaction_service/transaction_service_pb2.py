# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: fintekkers/services/transaction-service/transaction_service.proto
"""Generated protocol buffer code."""
from google.protobuf.internal import builder as _builder
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.requests.transaction import create_transaction_request_pb2 as fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2
from fintekkers.requests.transaction import create_transaction_response_pb2 as fintekkers_dot_requests_dot_transaction_dot_create__transaction__response__pb2
from fintekkers.requests.transaction import query_transaction_request_pb2 as fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2
from fintekkers.requests.transaction import query_transaction_response_pb2 as fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2
from fintekkers.requests.util.errors import summary_pb2 as fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\nAfintekkers/services/transaction-service/transaction_service.proto\x12$fintekkers.services.security_service\x1a@fintekkers/requests/transaction/create_transaction_request.proto\x1a\x41\x66intekkers/requests/transaction/create_transaction_response.proto\x1a?fintekkers/requests/transaction/query_transaction_request.proto\x1a@fintekkers/requests/transaction/query_transaction_response.proto\x1a-fintekkers/requests/util/errors/summary.proto2\xd3\x06\n\x0bTransaction\x12\x91\x01\n\x0e\x43reateOrUpdate\x12>.fintekkers.requests.transaction.CreateTransactionRequestProto\x1a?.fintekkers.requests.transaction.CreateTransactionResponseProto\x12\x89\x01\n\x08GetByIDs\x12=.fintekkers.requests.transaction.QueryTransactionRequestProto\x1a>.fintekkers.requests.transaction.QueryTransactionResponseProto\x12\x87\x01\n\x06Search\x12=.fintekkers.requests.transaction.QueryTransactionRequestProto\x1a>.fintekkers.requests.transaction.QueryTransactionResponseProto\x12\x88\x01\n\x07ListIDs\x12=.fintekkers.requests.transaction.QueryTransactionRequestProto\x1a>.fintekkers.requests.transaction.QueryTransactionResponseProto\x12\x87\x01\n\x16ValidateCreateOrUpdate\x12>.fintekkers.requests.transaction.CreateTransactionRequestProto\x1a-.fintekkers.requests.util.errors.SummaryProto\x12\x84\x01\n\x14ValidateQueryRequest\x12=.fintekkers.requests.transaction.QueryTransactionRequestProto\x1a-.fintekkers.requests.util.errors.SummaryProtoB\x06\x88\x01\x01\x90\x01\x01\x62\x06proto3')

_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.services.transaction_service.transaction_service_pb2', globals())
if _descriptor._USE_C_DESCRIPTORS == False:

  DESCRIPTOR._options = None
  DESCRIPTOR._serialized_options = b'\210\001\001\220\001\001'
  _TRANSACTION._serialized_start=419
  _TRANSACTION._serialized_end=1270
_builder.BuildServices(DESCRIPTOR, 'fintekkers.services.transaction_service.transaction_service_pb2', globals())
# @@protoc_insertion_point(module_scope)
