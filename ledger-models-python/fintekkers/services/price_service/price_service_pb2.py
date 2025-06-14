# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/services/price-service/price_service.proto
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
    'fintekkers/services/price-service/price_service.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.requests.price import query_price_request_pb2 as fintekkers_dot_requests_dot_price_dot_query__price__request__pb2
from fintekkers.requests.price import query_price_response_pb2 as fintekkers_dot_requests_dot_price_dot_query__price__response__pb2
from fintekkers.requests.price import create_price_request_pb2 as fintekkers_dot_requests_dot_price_dot_create__price__request__pb2
from fintekkers.requests.price import create_price_response_pb2 as fintekkers_dot_requests_dot_price_dot_create__price__response__pb2
from fintekkers.requests.util.errors import summary_pb2 as fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n5fintekkers/services/price-service/price_service.proto\x12!fintekkers.services.price_service\x1a\x33\x66intekkers/requests/price/query_price_request.proto\x1a\x34\x66intekkers/requests/price/query_price_response.proto\x1a\x34\x66intekkers/requests/price/create_price_request.proto\x1a\x35\x66intekkers/requests/price/create_price_response.proto\x1a-fintekkers/requests/util/errors/summary.proto2\xd1\x05\n\x05Price\x12y\n\x0e\x43reateOrUpdate\x12\x32.fintekkers.requests.price.CreatePriceRequestProto\x1a\x33.fintekkers.requests.price.CreatePriceResponseProto\x12q\n\x08GetByIds\x12\x31.fintekkers.requests.price.QueryPriceRequestProto\x1a\x32.fintekkers.requests.price.QueryPriceResponseProto\x12q\n\x06Search\x12\x31.fintekkers.requests.price.QueryPriceRequestProto\x1a\x32.fintekkers.requests.price.QueryPriceResponseProto0\x01\x12p\n\x07ListIds\x12\x31.fintekkers.requests.price.QueryPriceRequestProto\x1a\x32.fintekkers.requests.price.QueryPriceResponseProto\x12{\n\x16ValidateCreateOrUpdate\x12\x32.fintekkers.requests.price.CreatePriceRequestProto\x1a-.fintekkers.requests.util.errors.SummaryProto\x12x\n\x14ValidateQueryRequest\x12\x31.fintekkers.requests.price.QueryPriceRequestProto\x1a-.fintekkers.requests.util.errors.SummaryProtoB\x06\x88\x01\x01\x90\x01\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.services.price_service.price_service_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'\210\001\001\220\001\001'
  _globals['_PRICE']._serialized_start=356
  _globals['_PRICE']._serialized_end=1077
_builder.BuildServices(DESCRIPTOR, 'fintekkers.services.price_service.price_service_pb2', _globals)
# @@protoc_insertion_point(module_scope)
