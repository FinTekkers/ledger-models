from uuid import UUID

import pytest

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

def test_conversion():
    tmp_uuid = FintekkersUuid.new_uuid()

    uuid_as_str = tmp_uuid.__str__()

    uuid_from_bytes_as_str = FintekkersUuid.from_bytes(tmp_uuid.uuid.bytes).__str__()
    
    assert uuid_as_str.__str__() == uuid_from_bytes_as_str.__str__()

    uuid_from_uuid = FintekkersUuid.from_uuid(tmp_uuid.uuid).__str__()

    assert uuid_from_uuid.__str__() == uuid_from_bytes_as_str.__str__()


# LM-334: a raw_uuid that is neither empty nor exactly 16 bytes is a typed
# input error naming raw_uuid, through both decoders.

_DECODERS = [
    lambda raw: ProtoSerializationUtil.deserialize(UUIDProto(raw_uuid=raw)),
    lambda raw: FintekkersUuid.from_bytes(raw),
]


@pytest.mark.parametrize("decode", _DECODERS, ids=["deserialize", "from_bytes"])
@pytest.mark.parametrize("length", [15, 17])
def test_wrong_length_raises_model_validation_error(decode, length):
    with pytest.raises(ModelValidationError) as info:
        decode(bytes(range(length)))
    assert info.value.field == "raw_uuid"
    assert "raw_uuid" in str(info.value)
    assert f"got {length}" in str(info.value)
    assert isinstance(info.value, ValueError)


@pytest.mark.parametrize("decode", _DECODERS, ids=["deserialize", "from_bytes"])
def test_sixteen_bytes_decodes_in_byte_order(decode):
    expected = UUID("00010203-0405-0607-0809-0a0b0c0d0e0f")
    assert decode(bytes(range(16))).as_uuid() == expected


def test_sixteen_bytes_round_trips():
    original = FintekkersUuid.new_uuid()
    proto = UUIDProto(raw_uuid=original.as_bytes())
    assert len(proto.raw_uuid) == 16
    assert ProtoSerializationUtil.deserialize(proto).as_uuid() == original.as_uuid()


def test_unset_or_empty_returns_none():
    assert ProtoSerializationUtil.deserialize(UUIDProto()) is None
    assert ProtoSerializationUtil.deserialize(UUIDProto(raw_uuid=b"")) is None


def test_wrapper_with_unset_uuid_raises_value_error_naming_field():
    with pytest.raises(ModelValidationError) as info:
        Price(PriceProto()).get_uuid()
    assert info.value.field == "price.uuid"
    assert isinstance(info.value, ValueError)
