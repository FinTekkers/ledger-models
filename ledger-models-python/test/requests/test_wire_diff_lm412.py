"""wire-diff.py rule lm412 allows exactly the LM-412 enum values.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-412.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-412.json").read_text())["added_values"]
PRICE_TYPE = ".fintekkers.models.price.PriceTypeProto"
PRODUCT_TYPE = ".fintekkers.models.security.ProductTypeProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(enum: str, number: int) -> str:
    return f"value {enum} = {number}"


def test_each_addition_is_allowed():
    assert [(v["enum"], v["number"], v["name"]) for v in ADDED] == [
        (PRICE_TYPE, 5, "RATE"),
        (PRODUCT_TYPE, 36, "T_BILL_13_WEEK_SERIES"),
    ]
    for v in ADDED:
        assert wire_diff.lm412(_key(v["enum"], v["number"]), None, v["name"], {}), v


def test_another_number_is_rejected():
    assert not wire_diff.lm412(_key(PRICE_TYPE, 6), None, "RATE", {})
    assert not wire_diff.lm412(_key(PRODUCT_TYPE, 37), None, "T_BILL_13_WEEK_SERIES", {})


def test_another_name_is_rejected():
    assert not wire_diff.lm412(_key(PRICE_TYPE, 5), None, "RATES", {})
    assert not wire_diff.lm412(_key(PRODUCT_TYPE, 36), None, "TBILL_13_WEEK_SERIES", {})


def test_another_enum_is_rejected():
    assert not wire_diff.lm412(_key(PRICE_TYPE, 36), None, "T_BILL_13_WEEK_SERIES", {})
    assert not wire_diff.lm412(_key(PRODUCT_TYPE, 5), None, "RATE", {})


def test_a_renamed_or_removed_value_is_rejected():
    assert not wire_diff.lm412(_key(PRICE_TYPE, 4), "INDEX_LEVEL", "RATE", {})
    assert not wire_diff.lm412(_key(PRICE_TYPE, 5), "RATE", None, {})
    assert not wire_diff.lm412(_key(PRODUCT_TYPE, 35), "SOFR_SERIES", None, {})


def test_lm412_is_in_allowed():
    assert wire_diff.lm412 in wire_diff.ALLOWED
