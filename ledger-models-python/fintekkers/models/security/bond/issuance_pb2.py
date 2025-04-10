# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: fintekkers/models/security/bond/issuance.proto
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
    'fintekkers/models/security/bond/issuance.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.security.bond import auction_type_pb2 as fintekkers_dot_models_dot_security_dot_bond_dot_auction__type__pb2
from fintekkers.models.util import decimal_value_pb2 as fintekkers_dot_models_dot_util_dot_decimal__value__pb2
from fintekkers.models.util import local_date_pb2 as fintekkers_dot_models_dot_util_dot_local__date__pb2
from fintekkers.models.util import local_timestamp_pb2 as fintekkers_dot_models_dot_util_dot_local__timestamp__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n.fintekkers/models/security/bond/issuance.proto\x12\x1f\x66intekkers.models.security.bond\x1a\x32\x66intekkers/models/security/bond/auction_type.proto\x1a*fintekkers/models/util/decimal_value.proto\x1a\'fintekkers/models/util/local_date.proto\x1a,fintekkers/models/util/local_timestamp.proto\"\xcd\x06\n\rIssuanceProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12:\n\x05\x61s_of\x18\x06 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12?\n\nvalid_from\x18\x08 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12=\n\x08valid_to\x18\t \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12I\n\x19\x61uction_announcement_date\x18\x14 \x01(\x0b\x32&.fintekkers.models.util.LocalDateProto\x12\x42\n\x12\x61uction_issue_date\x18\x15 \x01(\x0b\x32&.fintekkers.models.util.LocalDateProto\x12T\n!post_auction_outstanding_quantity\x18\x16 \x01(\x0b\x32).fintekkers.models.util.DecimalValueProto\x12J\n\x17\x61uction_offering_amount\x18\x17 \x01(\x0b\x32).fintekkers.models.util.DecimalValueProto\x12G\n\x0c\x61uction_type\x18\x18 \x01(\x0e\x32\x31.fintekkers.models.security.bond.AuctionTypeProto\x12Q\n\x1eprice_for_single_price_auction\x18\x19 \x01(\x0b\x32).fintekkers.models.util.DecimalValueProto\x12\x41\n\x0etotal_accepted\x18\x1a \x01(\x0b\x32).fintekkers.models.util.DecimalValueProto\x12I\n\x16mature_security_amount\x18\x1b \x01(\x0b\x32).fintekkers.models.util.DecimalValueProtoB\x12\x42\x0eIssuanceProtosP\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.models.security.bond.issuance_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'B\016IssuanceProtosP\001'
  _globals['_ISSUANCEPROTO']._serialized_start=267
  _globals['_ISSUANCEPROTO']._serialized_end=1112
# @@protoc_insertion_point(module_scope)
