# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/price/create_price_response.proto
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
    'fintekkers/requests/price/create_price_response.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.price import price_pb2 as fintekkers_dot_models_dot_price_dot_price__pb2
from fintekkers.requests.price import create_price_request_pb2 as fintekkers_dot_requests_dot_price_dot_create__price__request__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n5fintekkers/requests/price/create_price_response.proto\x12\x19\x66intekkers.requests.price\x1a#fintekkers/models/price/price.proto\x1a\x34\x66intekkers/requests/price/create_price_request.proto\"\xd0\x01\n\x18\x43reatePriceResponseProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12P\n\x14\x63reate_price_request\x18\x14 \x01(\x0b\x32\x32.fintekkers.requests.price.CreatePriceRequestProto\x12;\n\x0eprice_response\x18\x1e \x03(\x0b\x32#.fintekkers.models.price.PriceProtoB\x1d\x42\x19\x43reatePriceResponseProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.price.create_price_response_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\031CreatePriceResponseProtosP\001'
  _globals['_CREATEPRICERESPONSEPROTO']._serialized_start=176
  _globals['_CREATEPRICERESPONSEPROTO']._serialized_end=384
# @@protoc_insertion_point(module_scope)
