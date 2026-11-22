"""wire-diff.py rule lm477 allows exactly TipsInput.assumed_inflation_rate = 5
and CashflowProto.index_ratio = 6, both DecimalValueProto.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-477.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-477.json").read_text())["added"]
TIPS_INPUT = ".fintekkers.requests.valuation.TipsInput"
CASHFLOW = ".fintekkers.models.valuation.CashflowProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(message: str, number: int) -> str:
    return f"field {message} = {number}"


def test_the_additions_are_allowed():
    assert [(f["message"], f["number"], f["name"], f["type"]) for f in ADDED] == [
        (TIPS_INPUT, 5, "assumed_inflation_rate", wire_diff.DECIMAL),
        (CASHFLOW, 6, "index_ratio", wire_diff.DECIMAL),
    ]
    assert wire_diff.lm477(_key(TIPS_INPUT, 5), None, f"{wire_diff.DECIMAL} assumed_inflation_rate", {})
    assert wire_diff.lm477(_key(CASHFLOW, 6), None, f"{wire_diff.DECIMAL} index_ratio", {})


def test_another_number_or_name_is_rejected():
    assert not wire_diff.lm477(_key(TIPS_INPUT, 6), None, f"{wire_diff.DECIMAL} assumed_inflation_rate", {})
    assert not wire_diff.lm477(_key(TIPS_INPUT, 5), None, f"{wire_diff.DECIMAL} inflation_rate", {})
    assert not wire_diff.lm477(_key(CASHFLOW, 7), None, f"{wire_diff.DECIMAL} index_ratio", {})
    assert not wire_diff.lm477(_key(CASHFLOW, 6), None, f"{wire_diff.DECIMAL} ratio", {})
    # Each field on the other message is rejected too.
    assert not wire_diff.lm477(_key(CASHFLOW, 5), None, f"{wire_diff.DECIMAL} assumed_inflation_rate", {})


def test_another_type_is_rejected():
    assert not wire_diff.lm477(_key(CASHFLOW, 6), None, "string index_ratio", {})
    assert not wire_diff.lm477(_key(TIPS_INPUT, 5), None, "double assumed_inflation_rate", {})


def test_a_third_added_field_is_rejected():
    assert not wire_diff.lm477(_key(TIPS_INPUT, 6), None, f"{wire_diff.DECIMAL} index_ratio", {})
    assert not wire_diff.lm477(_key(CASHFLOW, 7), None, f"{wire_diff.DECIMAL} adjusted_principal", {})


def test_a_changed_or_removed_field_is_rejected():
    assert not wire_diff.lm477(_key(CASHFLOW, 4), f"{wire_diff.DECIMAL} coupon_rate", f"{wire_diff.DECIMAL} index_ratio", {})
    assert not wire_diff.lm477(_key(CASHFLOW, 6), f"{wire_diff.DECIMAL} index_ratio", None, {})
    assert not wire_diff.lm477(_key(TIPS_INPUT, 4), ".fintekkers.requests.valuation.InflationIndexInput cpi", None, {})


def test_lm477_is_in_allowed():
    assert wire_diff.lm477 in wire_diff.ALLOWED
