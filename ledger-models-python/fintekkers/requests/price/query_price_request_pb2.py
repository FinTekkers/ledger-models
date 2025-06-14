# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/requests/price/query_price_request.proto
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
    'fintekkers/requests/price/query_price_request.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.util import uuid_pb2 as fintekkers_dot_models_dot_util_dot_uuid__pb2
from fintekkers.models.util import local_timestamp_pb2 as fintekkers_dot_models_dot_util_dot_local__timestamp__pb2
from fintekkers.models.position import position_filter_pb2 as fintekkers_dot_models_dot_position_dot_position__filter__pb2
from fintekkers.models.util import date_range_pb2 as fintekkers_dot_models_dot_util_dot_date__range__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n3fintekkers/requests/price/query_price_request.proto\x12\x19\x66intekkers.requests.price\x1a!fintekkers/models/util/uuid.proto\x1a,fintekkers/models/util/local_timestamp.proto\x1a\x30\x66intekkers/models/position/position_filter.proto\x1a\'fintekkers/models/util/date_range.proto\"\xca\x03\n\x16QueryPriceRequestProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12\x30\n\x05uuIds\x18\x15 \x03(\x0b\x32!.fintekkers.models.util.UUIDProto\x12K\n\x12search_price_input\x18\x16 \x01(\x0b\x32/.fintekkers.models.position.PositionFilterProto\x12:\n\x05\x61s_of\x18\x17 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12\x41\n\tfrequency\x18\x18 \x01(\x0e\x32..fintekkers.requests.price.PriceFrequencyProto\x12?\n\x07horizon\x18\x19 \x01(\x0e\x32,.fintekkers.requests.price.PriceHorizonProtoH\x00\x12<\n\ndate_range\x18\x1a \x01(\x0b\x32&.fintekkers.models.util.DateRangeProtoH\x00\x42\x0c\n\ntime_range*\xc5\x01\n\x13PriceFrequencyProto\x12\x1f\n\x1bPRICE_FREQUENCY_UNSPECIFIED\x10\x00\x12\x1a\n\x16PRICE_FREQUENCY_WEEKLY\x10\n\x12\x19\n\x15PRICE_FREQUENCY_DAILY\x10\x14\x12\x1a\n\x16PRICE_FREQUENCY_HOURLY\x10\x1e\x12\x1a\n\x16PRICE_FREQUENCY_MINUTE\x10(\x12\x1e\n\x1aPRICE_FREQUENCY_EVERY_TICK\x10Z*\xa1\x02\n\x11PriceHorizonProto\x12\x1d\n\x19PRICE_HORIZON_UNSPECIFIED\x10\x00\x12\x17\n\x13PRICE_HORIZON_1_DAY\x10\x01\x12\x18\n\x14PRICE_HORIZON_5_DAYS\x10\x02\x12\x18\n\x14PRICE_HORIZON_1_WEEK\x10\x03\x12\x19\n\x15PRICE_HORIZON_1_MONTH\x10\x04\x12\x1a\n\x16PRICE_HORIZON_6_MONTHS\x10\x05\x12\x18\n\x14PRICE_HORIZON_1_YEAR\x10\x06\x12\x18\n\x14PRICE_HORIZON_5_YEAR\x10\x07\x12\x15\n\x11PRICE_HORIZON_MAX\x10\x08\x12\x1e\n\x1aPRICE_HORIZON_YEAR_TO_DATE\x10\tB\x1b\x42\x17QueryPriceRequestProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.requests.price.query_price_request_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\027QueryPriceRequestProtosP\001'
  _globals['_PRICEFREQUENCYPROTO']._serialized_start=716
  _globals['_PRICEFREQUENCYPROTO']._serialized_end=913
  _globals['_PRICEHORIZONPROTO']._serialized_start=916
  _globals['_PRICEHORIZONPROTO']._serialized_end=1205
  _globals['_QUERYPRICEREQUESTPROTO']._serialized_start=255
  _globals['_QUERYPRICEREQUESTPROTO']._serialized_end=713
# @@protoc_insertion_point(module_scope)
