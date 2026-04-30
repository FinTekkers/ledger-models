from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.models.util.serialization import ProtoEnum


def test_get_enum_name_transaction_type():
    descriptor = FieldProto.DESCRIPTOR.values_by_number[FieldProto.TRANSACTION_TYPE]
    enum = ProtoEnum(descriptor, 1)

    assert enum.get_enum_name() == "TRANSACTION_TYPE"


def test_get_enum_name_position_status():
    descriptor = FieldProto.DESCRIPTOR.values_by_number[FieldProto.POSITION_STATUS]
    enum = ProtoEnum(descriptor, 0)

    assert enum.get_enum_name() == "POSITION_STATUS"


def test_get_enum_value_name_buy():
    descriptor = FieldProto.DESCRIPTOR.values_by_number[FieldProto.TRANSACTION_TYPE]
    enum = ProtoEnum(descriptor, 1)

    assert enum.get_enum_value_name() == "BUY"
    assert str(enum) == "BUY"


def test_get_enum_value():
    descriptor = FieldProto.DESCRIPTOR.values_by_number[FieldProto.TRANSACTION_TYPE]
    enum = ProtoEnum(descriptor, 2)

    assert enum.get_enum_value() == 2
