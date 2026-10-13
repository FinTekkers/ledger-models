"""LM-289: the shared price rule set. The same table runs in Java, Rust and JS."""

from decimal import Decimal
import uuid

import pytest

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models import price_rules
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.util.decimal import encode_decimal

PRICE_ID = uuid.uuid4()


def _valid() -> PriceProto:
    """A price that passes every rule."""
    return PriceProto(
        uuid=UUIDProto(raw_uuid=PRICE_ID.bytes),
        security=SecurityProto(uuid=UUIDProto(raw_uuid=uuid.uuid4().bytes)),
        price=encode_decimal(Decimal("100.25")),
        price_type=PriceTypeProto.PERCENTAGE,
    )


def _fields(proto) -> list[str]:
    return [v.field for v in price_rules.validate(proto)]


def test_security_absent_one_violation_on_security():
    p = _valid()
    p.ClearField("security")
    assert _fields(p) == ["security"]


def test_security_uuid_empty_one_violation_on_security():
    p = _valid()
    p.security.uuid.raw_uuid = b""
    assert p.security.HasField("uuid")
    assert _fields(p) == ["security"]


def test_security_uuid_unset_one_violation_on_security():
    p = _valid()
    p.security.ClearField("uuid")
    assert p.HasField("security")
    assert _fields(p) == ["security"]


def test_price_absent_one_violation_on_price():
    p = _valid()
    p.ClearField("price")
    assert _fields(p) == ["price"]


def test_price_empty_one_violation_on_price():
    p = _valid()
    p.price.Clear()
    assert p.HasField("price")
    assert _fields(p) == ["price"]


def test_price_zero_is_valid():
    p = _valid()
    p.price.CopyFrom(encode_decimal(Decimal("0")))
    assert _fields(p) == []


@pytest.mark.parametrize("value", [
    encode_decimal(Decimal("-1")),
    # Over the scale cap: set, but it does not decode.
    DecimalValueProto(unscaled_value=b"\x01", scale=5000),
], ids=["negative", "over_cap"])
def test_price_value_is_not_checked(value):
    p = _valid()
    p.price.CopyFrom(value)
    assert _fields(p) == []


def test_unknown_price_type_one_violation_on_price_type():
    p = _valid()
    p.price_type = PriceTypeProto.UNKNOWN_PRICE_TYPE
    assert _fields(p) == ["price_type"]


def test_unrecognised_price_type_is_valid():
    p = _valid()
    p.price_type = 99
    assert _fields(p) == []


def test_all_three_problems_three_violations_in_field_order():
    p = _valid()
    p.ClearField("security")
    p.ClearField("price")
    p.price_type = PriceTypeProto.UNKNOWN_PRICE_TYPE
    violations = price_rules.validate(p)
    assert [v.field for v in violations] == ["security", "price", "price_type"]
    assert all(v.object_id.raw_uuid == PRICE_ID.bytes for v in violations)


def test_every_known_price_type_is_valid():
    values = PriceTypeProto.values()
    assert PriceTypeProto.PERCENTAGE in values
    for value in values:
        if value == PriceTypeProto.UNKNOWN_PRICE_TYPE:
            continue
        p = _valid()
        p.price_type = value
        assert _fields(p) == [], PriceTypeProto.Name(value)


def test_empty_or_none_proto_three_violations_without_raising():
    expected = ["security", "price", "price_type"]
    assert _fields(PriceProto()) == expected
    assert _fields(None) == expected
    assert not price_rules.validate(None)[0].HasField("object_id")


def test_require_valid_raises_typed_error_carrying_violations():
    p = _valid()
    p.ClearField("price")
    with pytest.raises(ModelValidationError) as e:
        price_rules.require_valid(p)
    assert list(e.value.violations) == price_rules.validate(p)
    price_rules.require_valid(_valid())
