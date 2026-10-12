"""LM-305, metric 2: messages written by the published v0.4.33 (string field
10 only) still decode in Python to the expected unscaled value and scale, and
re-serialising them writes the compact form.

Fixtures: ledger-models-protos/fixtures/legacy_v0433/. A missing fixture
directory fails, never skips."""
import json
from decimal import Decimal
from pathlib import Path

import pytest

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.mortgage_backed_security import MortgageBackedSecurity
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


def _legacy_dir() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "ledger-models-protos" / "fixtures" / "legacy_v0433"
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError("ledger-models-protos/fixtures/legacy_v0433 not found above this test")


LEGACY = _legacy_dir()
MESSAGES = {
    "PriceProto": PriceProto,
    "SecurityProto": SecurityProto,
    "TransactionProto": TransactionProto,
}


def _load(spec: dict):
    return MESSAGES[spec["message"]].FromString((LEGACY / spec["bin"]).read_bytes())


SPECS = [json.loads(p.read_text()) for p in sorted(LEGACY.glob("*.json"))]
PATHS = [(spec, d) for spec in SPECS for d in spec["decimals"]]


def _walk(message, path: str):
    for name in path.split("."):
        assert message.HasField(name), f"{path}: {name} is unset"
        message = getattr(message, name)
    return message


def _parts(d: Decimal) -> tuple[int, int]:
    sign, digits, exponent = d.as_tuple()
    magnitude = int("".join(str(x) for x in digits))
    return (-magnitude if sign else magnitude), -exponent


def _min_bytes(n: int) -> bytes:
    return n.to_bytes(((n + (n < 0)).bit_length() // 8) + 1, "big", signed=True)


def test_every_message_type_has_a_fixture():
    assert len(SPECS) >= 3
    assert {spec["message"] for spec in SPECS} >= set(MESSAGES)


@pytest.mark.parametrize("spec,expected", PATHS,
                         ids=[f"{s['message']}:{d['path']}" for s, d in PATHS])
def test_legacy_path_decodes_and_reencodes(spec, expected):
    proto = _walk(_load(spec), expected["path"])
    assert proto.arbitrary_precision_value == expected["stored_string"]
    assert proto.unscaled_value == b"", "legacy fixture must be string-only"
    unscaled, scale = int(expected["unscaled"]), expected["scale"]

    decoded = decode_decimal(proto)

    assert _parts(decoded) == (unscaled, scale)
    reencoded = encode_decimal(decoded)
    assert reencoded.unscaled_value == _min_bytes(unscaled)
    assert reencoded.scale == scale
    assert _parts(decode_decimal(reencoded)) == (unscaled, scale)


def _spec(message: str) -> dict:
    return next(s for s in SPECS if s["message"] == message)


def _expected(spec: dict, path: str) -> Decimal:
    d = next(d for d in spec["decimals"] if d["path"] == path)
    unscaled = int(d["unscaled"])
    return Decimal((1 if unscaled < 0 else 0, tuple(int(c) for c in str(abs(unscaled))), -d["scale"]))


# Through the wrapper getters that go through the codec in this item.
def test_price_wrapper_reads_legacy_price():
    spec = _spec("PriceProto")
    price = Price(_load(spec))

    got = price.get_price()

    assert isinstance(got, Decimal)
    assert got.as_tuple() == _expected(spec, "price").as_tuple()
    assert Security(price.proto.security).get_face_value().as_tuple() == \
        _expected(spec, "security.bond_details.face_value").as_tuple()


def test_security_wrapper_reads_legacy_face_value():
    spec = _spec("SecurityProto")

    got = Security(_load(spec)).get_face_value()

    assert got.as_tuple() == _expected(spec, "bond_details.face_value").as_tuple()


def test_transaction_legacy_quantity_and_price():
    spec = _spec("TransactionProto")
    txn = Transaction(_load(spec))

    quantity = ProtoSerializationUtil.deserialize(txn.proto.quantity)
    price = Price(txn.proto.price).get_price()

    assert quantity.as_tuple() == _expected(spec, "quantity").as_tuple()
    assert price.as_tuple() == _expected(spec, "price.price").as_tuple()


# Legacy path only: the MBS getters still read the string directly until
# LM-305b moves them onto the codec. This proves old messages keep reading
# through them, not that they use the compact form.
@pytest.mark.parametrize("message,prefix", [("SecurityProto", ""), ("PriceProto", "security.")])
def test_mbs_getters_read_legacy_strings_legacy_path_only(message, prefix):
    spec = _spec(message)
    proto = _load(spec)
    mbs = MortgageBackedSecurity(proto.security if prefix else proto)

    getters = {
        "wac": mbs.get_wac,
        "pass_through_rate": mbs.get_pass_through_rate,
        "current_factor": mbs.get_current_factor,
        "original_face_value": mbs.get_original_face_value,
        "current_upb": mbs.get_current_upb,
        "psa_speed": mbs.get_psa_speed,
    }
    for field, getter in getters.items():
        assert getter() == _expected(spec, f"{prefix}mbs_extension.{field}"), field
