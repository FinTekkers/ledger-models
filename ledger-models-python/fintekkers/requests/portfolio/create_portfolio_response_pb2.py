# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/portfolio/create_portfolio_response.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.portfolio import portfolio_pb2 as fintekkers_dot_models_dot_portfolio_dot_portfolio__pb2
from fintekkers.requests.portfolio import create_portfolio_request_pb2 as fintekkers_dot_requests_dot_portfolio_dot_create__portfolio__request__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n=fintekkers/requests/portfolio/create_portfolio_response.proto\x12\x1d\x66intekkers.requests.portfolio\x1a+fintekkers/models/portfolio/portfolio.proto\x1a<fintekkers/requests/portfolio/create_portfolio_request.proto\"\xec\x01\n\x1c\x43reatePortfolioResponseProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\\\n\x18\x63reate_portfolio_request\x18\x14 \x01(\x0b\x32:.fintekkers.requests.portfolio.CreatePortfolioRequestProto\x12G\n\x12portfolio_response\x18\x1e \x03(\x0b\x32+.fintekkers.models.portfolio.PortfolioProtoB!B\x1d\x43reatePortfolioResponseProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.portfolio.create_portfolio_response_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\035CreatePortfolioResponseProtosP\001'
  _globals['_CREATEPORTFOLIORESPONSEPROTO']._serialized_start=204
  _globals['_CREATEPORTFOLIORESPONSEPROTO']._serialized_end=440
# @@protoc_insertion_point(module_scope)
