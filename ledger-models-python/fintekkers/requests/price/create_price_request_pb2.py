# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/price/create_price_request.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.price import price_pb2 as fintekkers_dot_models_dot_price_dot_price__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n4fintekkers/requests/price/create_price_request.proto\x12\x19\x66intekkers.requests.price\x1a#fintekkers/models/price/price.proto\"\x81\x01\n\x17\x43reatePriceRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12?\n\x12\x63reate_price_input\x18\x14 \x01(\x0b\x32#.fintekkers.models.price.PriceProtoB\x1c\x42\x18\x43reatePriceRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.price.create_price_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\030CreatePriceRequestProtosP\001'
  _globals['_CREATEPRICEREQUESTPROTO']._serialized_start=121
  _globals['_CREATEPRICEREQUESTPROTO']._serialized_end=250
# @@protoc_insertion_point(module_scope)
