"""ProductInput gains mbs = 13, equity = 14 and cash = 15 (LM-408). The oneof
is exactly bond, tips, frn, mbs, equity and cash; bond, tips and frn keep their
numbers, names and types. EquityInput and CashInput have exactly security and
unit_price; MbsInput has exactly security, clean_price and cost_basis, with
10-19 unused. Each new arm round-trips through bytes as the same arm, with its
values.

Expectations come from test-fixtures/field-changes/lm-408.json, the same file
wire-diff.py's lm408 rule reads.
"""
import json
from decimal import Decimal
from pathlib import Path

import pytest
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.position import tax_lot_pb2
from fintekkers.models.security import product_type_pb2, security_pb2
from fintekkers.models.util import decimal_value_pb2, local_date_pb2
from fintekkers.requests.valuation import product_inputs_pb2
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

REPO_ROOT = Path(__file__).resolve().parents[3]
SPEC = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-408.json").read_text())
PRODUCT_INPUT = product_inputs_pb2.ProductInput.DESCRIPTOR


def _type_name(field: FieldDescriptor) -> str:
    return f".{field.message_type.full_name}"


def _expected(message: str, entries: list) -> dict:
    return {e["number"]: (e["name"], e["type"]) for e in entries if e["message"] == message}


def _actual(descriptor) -> dict:
    return {f.number: (f.name, _type_name(f)) for f in descriptor.fields}


def test_oneof_is_exactly_the_kept_and_added_arms():
    name = f".{PRODUCT_INPUT.full_name}"
    expected = _expected(name, SPEC["kept_arms"] + SPEC["added"])
    assert sorted(expected) == [1, 2, 8, 13, 14, 15]
    assert _actual(PRODUCT_INPUT) == expected
    oneof = PRODUCT_INPUT.oneofs_by_name["input"]
    assert sorted(f.number for f in oneof.fields) == [1, 2, 8, 13, 14, 15]


@pytest.mark.parametrize("message", SPEC["added_messages"])
def test_new_message_has_exactly_its_fields(message):
    descriptor = product_inputs_pb2.DESCRIPTOR.message_types_by_name[message.rsplit(".", 1)[1]]
    assert f".{descriptor.full_name}" == message
    assert _actual(descriptor) == _expected(message, SPEC["added"])
    assert all(f.label == FieldDescriptor.LABEL_OPTIONAL for f in descriptor.fields)


def test_equity_and_cash_have_security_and_unit_price():
    for message in (product_inputs_pb2.EquityInput, product_inputs_pb2.CashInput):
        assert {f.number: f.name for f in message.DESCRIPTOR.fields} == {1: "security", 2: "unit_price"}


def test_mbs_has_security_clean_price_and_cost_basis_and_leaves_10_to_19_free():
    fields = product_inputs_pb2.MbsInput.DESCRIPTOR.fields_by_number
    assert {n: f.name for n, f in fields.items()} == {1: "security", 2: "clean_price", 20: "cost_basis"}
    assert not set(fields) & set(range(10, 20))
    assert fields[20].message_type is product_inputs_pb2.CostBasisInput.DESCRIPTOR


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return encode_decimal(Decimal(value))


def _text(d: decimal_value_pb2.DecimalValueProto) -> str:
    return str(decode_decimal(d))


def _roundtrip(original: product_inputs_pb2.ProductInput) -> product_inputs_pb2.ProductInput:
    return product_inputs_pb2.ProductInput.FromString(original.SerializeToString())


def test_mbs_arm_round_trips():
    security = security_pb2.SecurityProto(
        product_type=product_type_pb2.MORTGAGE_BACKED,
        mbs_extension=security_pb2.MbsExtensionProto(pool_number="FN AS1234", current_factor=_decimal("0.8125")),
    )
    lot = tax_lot_pb2.TaxLotProto(
        open_date=local_date_pb2.LocalDateProto(year=2025, month=6, day=2),
        open_quantity=_decimal("250000"),
        price=_decimal("99.50"),
    )
    original = product_inputs_pb2.ProductInput(mbs=product_inputs_pb2.MbsInput(
        security=security,
        clean_price=_decimal("101.5"),
        cost_basis=product_inputs_pb2.CostBasisInput(lots=[lot]),
    ))

    parsed = _roundtrip(original)

    assert parsed.WhichOneof("input") == "mbs"
    assert parsed.mbs.HasField("security")
    assert parsed.mbs.security.product_type == product_type_pb2.MORTGAGE_BACKED
    assert parsed.mbs.security.mbs_extension.pool_number == "FN AS1234"
    assert _text(parsed.mbs.clean_price) == "101.5"
    assert parsed.mbs.HasField("cost_basis")
    assert [(_text(lot.open_quantity), _text(lot.price)) for lot in parsed.mbs.cost_basis.lots] == [("250000", "99.50")]
    assert parsed == original


@pytest.mark.parametrize("arm,message,product_type,price", [
    ("equity", product_inputs_pb2.EquityInput, product_type_pb2.COMMON_STOCK, "187.25"),
    ("cash", product_inputs_pb2.CashInput, product_type_pb2.MONEY_MARKET_FUND, "1.00"),
])
def test_unit_priced_arm_round_trips(arm, message, product_type, price):
    original = product_inputs_pb2.ProductInput(**{arm: message(
        security=security_pb2.SecurityProto(product_type=product_type, issuer_name=arm),
        unit_price=_decimal(price),
    )})

    parsed = _roundtrip(original)

    assert parsed.WhichOneof("input") == arm
    decoded = getattr(parsed, arm)
    assert decoded.HasField("security")
    assert decoded.security.product_type == product_type
    assert decoded.security.issuer_name == arm
    assert _text(decoded.unit_price) == price
    assert parsed == original
