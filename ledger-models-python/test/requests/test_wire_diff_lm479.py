"""wire-diff.py rule lm479 allows exactly EquityDetailsProto.shares_outstanding
= 1, a DecimalValueProto.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-479.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-479.json").read_text())["added"]
EQUITY = ".fintekkers.models.security.EquityDetailsProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(message: str, number: int) -> str:
    return f"field {message} = {number}"


def test_the_addition_is_allowed():
    assert [(f["message"], f["number"], f["name"], f["type"]) for f in ADDED] == [
        (EQUITY, 1, "shares_outstanding", wire_diff.DECIMAL),
    ]
    assert wire_diff.lm479(_key(EQUITY, 1), None, f"{wire_diff.DECIMAL} shares_outstanding", {})


def test_another_number_name_or_type_is_rejected():
    assert not wire_diff.lm479(_key(EQUITY, 2), None, f"{wire_diff.DECIMAL} shares_outstanding", {})
    assert not wire_diff.lm479(_key(EQUITY, 1), None, f"{wire_diff.DECIMAL} dividend_yield", {})
    assert not wire_diff.lm479(_key(EQUITY, 1), None, "int64 shares_outstanding", {})


def test_a_second_added_field_is_rejected():
    assert not wire_diff.lm479(_key(EQUITY, 2), None, f"{wire_diff.DECIMAL} dividend_yield", {})
    assert not wire_diff.lm479(_key(EQUITY, 3), None, "string sector", {})


def test_a_changed_or_removed_field_is_rejected():
    assert not wire_diff.lm479(_key(EQUITY, 1), f"{wire_diff.DECIMAL} shares_outstanding", None, {})
    assert not wire_diff.lm479(
        _key(EQUITY, 1), f"{wire_diff.DECIMAL} shares_outstanding", f"{wire_diff.DECIMAL} float_shares", {})


def test_lm479_is_in_allowed():
    assert wire_diff.lm479 in wire_diff.ALLOWED
