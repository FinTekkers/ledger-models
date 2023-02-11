# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: fintekkers/models/transaction/transaction.proto
"""Generated protocol buffer code."""
from google.protobuf.internal import builder as _builder
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from fintekkers.models.util import decimal_value_pb2 as fintekkers_dot_models_dot_util_dot_decimal__value__pb2
from fintekkers.models.util import local_date_pb2 as fintekkers_dot_models_dot_util_dot_local__date__pb2
from fintekkers.models.util import local_timestamp_pb2 as fintekkers_dot_models_dot_util_dot_local__timestamp__pb2
from fintekkers.models.util import uuid_pb2 as fintekkers_dot_models_dot_util_dot_uuid__pb2
from fintekkers.models.portfolio import portfolio_pb2 as fintekkers_dot_models_dot_portfolio_dot_portfolio__pb2
from fintekkers.models.strategy import strategy_allocation_pb2 as fintekkers_dot_models_dot_strategy_dot_strategy__allocation__pb2
from fintekkers.models.security import security_pb2 as fintekkers_dot_models_dot_security_dot_security__pb2
from fintekkers.models.price import price_pb2 as fintekkers_dot_models_dot_price_dot_price__pb2
from fintekkers.models.position import position_status_pb2 as fintekkers_dot_models_dot_position_dot_position__status__pb2
from fintekkers.models.transaction import transaction_type_pb2 as fintekkers_dot_models_dot_transaction_dot_transaction__type__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n/fintekkers/models/transaction/transaction.proto\x12\x1d\x66intekkers.models.transaction\x1a*fintekkers/models/util/decimal_value.proto\x1a\'fintekkers/models/util/local_date.proto\x1a,fintekkers/models/util/local_timestamp.proto\x1a!fintekkers/models/util/uuid.proto\x1a+fintekkers/models/portfolio/portfolio.proto\x1a\x34\x66intekkers/models/strategy/strategy_allocation.proto\x1a)fintekkers/models/security/security.proto\x1a#fintekkers/models/price/price.proto\x1a\x30\x66intekkers/models/position/position_status.proto\x1a\x34\x66intekkers/models/transaction/transaction_type.proto\"\x83\x07\n\x10TransactionProto\x12\x14\n\x0cobject_class\x18\x01 \x01(\t\x12\x0f\n\x07version\x18\x02 \x01(\t\x12/\n\x04uuid\x18\x05 \x01(\x0b\x32!.fintekkers.models.util.UUIDProto\x12:\n\x05\x61s_of\x18\x06 \x01(\x0b\x32+.fintekkers.models.util.LocalTimestampProto\x12\x0f\n\x07is_link\x18\x07 \x01(\x08\x12>\n\tportfolio\x18\n \x01(\x0b\x32+.fintekkers.models.portfolio.PortfolioProto\x12;\n\x08security\x18\x0b \x01(\x0b\x32).fintekkers.models.security.SecurityProto\x12M\n\x10transaction_type\x18\x0c \x01(\x0e\x32\x33.fintekkers.models.transaction.TransactionTypeProto\x12;\n\x08quantity\x18\r \x01(\x0b\x32).fintekkers.models.util.DecimalValueProto\x12\x32\n\x05price\x18\x0e \x01(\x0b\x32#.fintekkers.models.price.PriceProto\x12:\n\ntrade_date\x18\x0f \x01(\x0b\x32&.fintekkers.models.util.LocalDateProto\x12?\n\x0fsettlement_date\x18\x10 \x01(\x0b\x32&.fintekkers.models.util.LocalDateProto\x12J\n\x11\x63hildTransactions\x18\x14 \x03(\x0b\x32/.fintekkers.models.transaction.TransactionProto\x12H\n\x0fposition_status\x18\x19 \x01(\x0e\x32/.fintekkers.models.position.PositionStatusProto\x12\x12\n\ntrade_name\x18\x1a \x01(\t\x12P\n\x13strategy_allocation\x18\x1b \x01(\x0b\x32\x33.fintekkers.models.strategy.StrategyAllocationProto\x12\x14\n\x0cis_cancelled\x18\x1e \x01(\x08\x42\x15\x42\x11TransactionProtosP\x01\x62\x06proto3')

_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'fintekkers.models.transaction.transaction_pb2', globals())
if _descriptor._USE_C_DESCRIPTORS == False:

  DESCRIPTOR._options = None
  DESCRIPTOR._serialized_options = b'B\021TransactionProtosP\001'
  _TRANSACTIONPROTO._serialized_start=532
  _TRANSACTIONPROTO._serialized_end=1431
# @@protoc_insertion_point(module_scope)