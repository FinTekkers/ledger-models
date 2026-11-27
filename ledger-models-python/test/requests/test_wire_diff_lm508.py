"""wire-diff.py rule lm508 allows exactly the PriceProto field 10 rename
price -> mid (same number and type) and the bid = 14 / ask = 15 additions,
both DecimalValueProto. Any other change, including to field 10's number or
type, is rejected.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-508.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SPEC = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-508.json").read_text())
PRICE = ".fintekkers.models.price.PriceProto"
DECIMAL = ".fintekkers.models.util.DecimalValueProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _field(number: int) -> str:
    return f"field {PRICE} = {number}"


def test_the_spec_is_the_lm508_change():
    assert SPEC["renamed"] == [
        {"message": PRICE, "number": 10, "type": DECIMAL, "old_name": "price", "new_name": "mid"}]
    assert [(f["number"], f["name"], f["type"]) for f in SPEC["added"]] == [(14, "bid", DECIMAL), (15, "ask", DECIMAL)]


def test_the_rename_and_additions_are_allowed():
    assert wire_diff.lm508(_field(10), f"{DECIMAL} price", f"{DECIMAL} mid", {})
    assert wire_diff.lm508(_field(14), None, f"{DECIMAL} bid", {})
    assert wire_diff.lm508(_field(15), None, f"{DECIMAL} ask", {})


def test_field_10_changing_type_is_rejected():
    assert not wire_diff.lm508(_field(10), f"{DECIMAL} price", "double mid", {})
    assert not wire_diff.lm508(_field(10), f"{DECIMAL} price", "string mid", {})
    assert not wire_diff.lm508(_field(10), f"{DECIMAL} price", f"repeated {DECIMAL} mid", {})


def test_field_10_changing_number_is_rejected():
    # A renumber shows as field 10 removed and the name added elsewhere.
    assert not wire_diff.lm508(_field(10), f"{DECIMAL} price", None, {})
    assert not wire_diff.lm508(_field(16), None, f"{DECIMAL} mid", {})
    assert not wire_diff.lm508(_field(14), None, f"{DECIMAL} mid", {})


def test_another_name_for_field_10_is_rejected():
    assert not wire_diff.lm508(_field(10), f"{DECIMAL} price", f"{DECIMAL} mid_price", {})
    assert not wire_diff.lm508(_field(10), None, f"{DECIMAL} mid", {})


def test_bid_or_ask_of_another_type_is_rejected():
    for number, name in ((14, "bid"), (15, "ask")):
        assert not wire_diff.lm508(_field(number), None, f"double {name}", {})
        assert not wire_diff.lm508(_field(number), None, f"string {name}", {})
        assert not wire_diff.lm508(_field(number), None, f"repeated {DECIMAL} {name}", {})
        assert not wire_diff.lm508(_field(number), None, f".fintekkers.models.price.PriceTypeProto {name}", {})


def test_bid_and_ask_swapped_or_renumbered_are_rejected():
    assert not wire_diff.lm508(_field(14), None, f"{DECIMAL} ask", {})
    assert not wire_diff.lm508(_field(15), None, f"{DECIMAL} bid", {})
    assert not wire_diff.lm508(_field(16), None, f"{DECIMAL} bid", {})


def test_another_price_field_renamed_or_removed_is_rejected():
    assert not wire_diff.lm508(_field(11), ".fintekkers.models.security.SecurityProto security", None, {})
    assert not wire_diff.lm508(_field(12), ".fintekkers.models.price.PriceTypeProto price_type",
                               ".fintekkers.models.price.PriceTypeProto unit", {})
    assert not wire_diff.lm508(_field(13), ".fintekkers.models.price.PriceSourceProto price_source", None, {})
    assert not wire_diff.lm508(_field(6), ".fintekkers.models.util.LocalTimestampProto as_of", None, {})


def test_a_new_enum_is_rejected():
    assert not wire_diff.lm508("enum .fintekkers.models.price.PriceKindProto", None, "enum", {})
    assert not wire_diff.lm508("value .fintekkers.models.price.PriceKindProto = 0", None, "MID", {})


def test_lm508_is_in_allowed():
    assert wire_diff.lm508 in wire_diff.ALLOWED
