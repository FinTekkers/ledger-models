# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/valuation/valuation_request.proto
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
    'fintekkers/requests/valuation/valuation_request.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.security import security_pb2 as fintekkers_dot_models_dot_security_dot_security__pb2
from fintekkers.models.position import position_pb2 as fintekkers_dot_models_dot_position_dot_position__pb2
from fintekkers.models.price import price_pb2 as fintekkers_dot_models_dot_price_dot_price__pb2
from fintekkers.requests.util import operation_pb2 as fintekkers_dot_requests_dot_util_dot_operation__pb2
from fintekkers.models.position import measure_pb2 as fintekkers_dot_models_dot_position_dot_measure__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n5fintekkers/requests/valuation/valuation_request.proto\x12\x1d\x66intekkers.requests.valuation\x1a)fintekkers/models/security/security.proto\x1a)fintekkers/models/position/position.proto\x1a#fintekkers/models/price/price.proto\x1a(fintekkers/requests/util/operation.proto\x1a(fintekkers/models/position/measure.proto\"\x87\x03\n\x15ValuationRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12K\n\x0eoperation_type\x18\n \x01(\x0e\x32\x33.fintekkers.requests.util.RequestOperationTypeProto\x12:\n\x08measures\x18\x1e \x03(\x0e\x32(.fintekkers.models.position.MeasureProto\x12\x41\n\x0esecurity_input\x18\x14 \x01(\x0b\x32).fintekkers.models.security.SecurityProto\x12\x41\n\x0eposition_input\x18\x15 \x01(\x0b\x32).fintekkers.models.position.PositionProto\x12\x38\n\x0bprice_input\x18\x16 \x01(\x0b\x32#.fintekkers.models.price.PriceProtoB\x1a\x42\x16ValuationRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.valuation.valuation_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\026ValuationRequestProtosP\001'
  _globals['_VALUATIONREQUESTPROTO']._serialized_start=296
  _globals['_VALUATIONREQUESTPROTO']._serialized_end=687
# @@protoc_insertion_point(module_scope)
