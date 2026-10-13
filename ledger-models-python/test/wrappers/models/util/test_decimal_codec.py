"""LM-305: the Python DecimalValueProto codec against the shared oracle
ledger-models-protos/fixtures/decimal_compact.json (docs/adr/compact_decimal.md).

Python must write each case's exact wire bytes and decode them to the same
unscaled value and scale as Rust and JS."""
import inspect
import json
from decimal import Decimal, localcontext
from pathlib import Path

import pytest

from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.util.decimal import (
    MAX_DIGITS,
    MAX_SCALE,
    MAX_UNSCALED_BYTES,
    decode_decimal,
    encode_decimal,
    is_decimal_set,
)
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


def _fixtures_dir() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "ledger-models-protos" / "fixtures"
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError("ledger-models-protos/fixtures not found above this test")


ORACLE = json.loads((_fixtures_dir() / "decimal_compact.json").read_text())
CASES = ORACLE["cases"]


def _parts(d: Decimal) -> tuple[int, int]:
    """(unscaled, scale) of a decoded Decimal."""
    sign, digits, exponent = d.as_tuple()
    magnitude = int("".join(str(x) for x in digits))
    return (-magnitude if sign else magnitude), -exponent


def _compact_only(unscaled_hex: str, scale: int) -> DecimalValueProto:
    return DecimalValueProto(unscaled_value=bytes.fromhex(unscaled_hex), scale=scale)


def test_oracle_matches_codec_limits():
    assert ORACLE["limits"] == {
        "max_digits": MAX_DIGITS,
        "max_scale": MAX_SCALE,
        "max_unscaled_bytes": MAX_UNSCALED_BYTES,
    }
    assert len(CASES) >= 15


# Metric 1: Python writes the fixture's exact bytes and scale.
@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_encode_matches_fixture_bytes(case):
    proto = encode_decimal(Decimal(case["string"]))

    assert proto.SerializeToString().hex() == case["wire_hex"]
    assert proto.unscaled_value.hex() == case["unscaled_hex"]
    assert proto.scale == case["scale"]
    assert format(decode_decimal(proto), "f") == case["canonical"]


# Metric 1: decoding the wire bytes gives an equal Decimal with the same exponent.
@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_decode_wire_keeps_value_and_exponent(case):
    proto = DecimalValueProto.FromString(bytes.fromhex(case["wire_hex"]))

    decoded = decode_decimal(proto)

    assert decoded.as_tuple() == Decimal(case["canonical"]).as_tuple()
    assert _parts(decoded) == (int.from_bytes(bytes.fromhex(case["unscaled_hex"]), "big", signed=True),
                               case["scale"])


def test_one_fifty_keeps_scale_two():
    decoded = decode_decimal(DecimalValueProto.FromString(bytes.fromhex("5a0200966002")))

    assert str(decoded) == "1.50"
    assert decoded.as_tuple().exponent == -2


# Metric 3: one plain call taking only the proto, as in Rust (LM-307).
def test_decode_takes_only_the_proto():
    params = inspect.signature(decode_decimal).parameters

    assert list(params) == ["proto"]
    assert decode_decimal(encode_decimal(Decimal("100.25"))) == Decimal("100.25")


# LM-318: a decimal written as the old string only (field 10) is unset.
def test_string_only_decimal_from_old_bytes_is_unset():
    # 0x52 = field 10, length-delimited: "1.5" as a v0.4.33 writer stored it.
    old = DecimalValueProto.FromString(bytes.fromhex("5203") + b"1.5")

    assert not is_decimal_set(old)
    with pytest.raises(ModelValidationError, match="decimal is required but unset"):
        decode_decimal(old)
    # Compact zero is still set.
    assert is_decimal_set(encode_decimal(Decimal("0")))
    assert encode_decimal(Decimal("0")).unscaled_value == b"\x00"


# Guardrail 1: lossless, no float anywhere.
@pytest.mark.parametrize("bad", [1.5, 0.0, True, False, "1.5", None])
def test_encode_rejects_non_decimal_input(bad):
    with pytest.raises(TypeError):
        encode_decimal(bad)


def test_serialize_rejects_float_and_bool():
    with pytest.raises(TypeError):
        ProtoSerializationUtil.serialize(1.5)
    with pytest.raises(TypeError):
        ProtoSerializationUtil.serialize(True)


@pytest.mark.parametrize("bad", ["NaN", "Infinity", "-Infinity", "sNaN"])
def test_encode_rejects_non_finite(bad):
    with pytest.raises(ModelValidationError):
        encode_decimal(Decimal(bad))


def test_encode_rejects_values_over_the_limits():
    with pytest.raises(ModelValidationError):
        encode_decimal(Decimal(f"1E-{MAX_SCALE + 1}"))
    with pytest.raises(ModelValidationError):
        encode_decimal(Decimal(f"1E+{MAX_DIGITS}"))
    with pytest.raises(ModelValidationError):
        encode_decimal(10 ** MAX_DIGITS)
    # Exactly at the caps is fine.
    assert encode_decimal(Decimal(f"1E-{MAX_SCALE}")).scale == MAX_SCALE
    assert len(str(decode_decimal(encode_decimal(10 ** MAX_DIGITS - 1)))) == MAX_DIGITS


def test_encode_int_and_positive_exponent():
    assert encode_decimal(-1).SerializeToString().hex() == "5a01ff"
    proto = encode_decimal(Decimal("1E+3"))
    assert (proto.unscaled_value.hex(), proto.scale) == ("03e8", 0)
    assert encode_decimal(Decimal("0E+5")).SerializeToString().hex() == "5a0100"


@pytest.mark.parametrize("name", ["scale_28", "two_pow_127", "scale_40"])
def test_decode_ignores_context_precision(name):
    case = next(c for c in CASES if c["name"] == name)
    with localcontext() as ctx:
        ctx.prec = 5
        from_compact = decode_decimal(_compact_only(case["unscaled_hex"], case["scale"]))
        encoded = encode_decimal(from_compact)

    assert from_compact.as_tuple() == Decimal(case["canonical"]).as_tuple()
    assert encoded.SerializeToString().hex() == case["wire_hex"]


def test_deserialize_returns_decimal_not_float():
    value = ProtoSerializationUtil.deserialize(encode_decimal(Decimal("0.1")))

    assert isinstance(value, Decimal)
    assert value == Decimal("0.1")


def test_unset_decimal_is_a_typed_error():
    with pytest.raises(ModelValidationError, match="unset"):
        decode_decimal(DecimalValueProto())
    with pytest.raises(ModelValidationError):
        ProtoSerializationUtil.deserialize(DecimalValueProto())


def _decode_error_bytes(case) -> bytes:
    if "unscaled_hex_repeat" in case:
        repeat = case["unscaled_hex_repeat"]
        return bytes.fromhex(repeat["hex"] * repeat["count"])
    return bytes.fromhex(case["unscaled_hex"])


@pytest.mark.parametrize("case", ORACLE["decode_errors"], ids=[c["name"] for c in ORACLE["decode_errors"]])
def test_decode_errors_are_typed(case):
    raw = _decode_error_bytes(case)
    if "unscaled_hex_repeat" in case:
        repeat = case["unscaled_hex_repeat"]
        assert len(raw) == repeat["count"]

    with pytest.raises(ModelValidationError):
        decode_decimal(DecimalValueProto(unscaled_value=raw, scale=case["scale"]))


def test_non_minimal_bytes_are_accepted():
    assert decode_decimal(_compact_only("0001", 0)) == 1
    assert decode_decimal(_compact_only("ffff", 0)) == -1


def test_bytes_at_cap_within_digit_limit_decode():
    raw = bytes.fromhex("01" + "00" * (MAX_UNSCALED_BYTES - 2))

    assert decode_decimal(DecimalValueProto(unscaled_value=raw)) == 2 ** (8 * (MAX_UNSCALED_BYTES - 2))
