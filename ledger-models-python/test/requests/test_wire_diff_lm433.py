"""wire-diff.py rule lm433 allows exactly MeasureProto.INFLATION_COMPENSATION = 30.

Keys use wire-diff's shape() form, with the leading dot. The value comes from
test-fixtures/field-changes/lm-433.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-433.json").read_text())["added_values"]
MEASURE = ".fintekkers.models.position.MeasureProto"
TIPS_INPUT = ".fintekkers.requests.valuation.TipsInput"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(number: int) -> str:
    return f"value {MEASURE} = {number}"


def test_the_addition_is_allowed():
    assert [(v["enum"], v["number"], v["name"]) for v in ADDED] == [(MEASURE, 30, "INFLATION_COMPENSATION")]
    assert wire_diff.lm433(_key(30), None, "INFLATION_COMPENSATION", {})


def test_another_number_or_name_is_rejected():
    assert not wire_diff.lm433(_key(31), None, "INFLATION_COMPENSATION", {})
    assert not wire_diff.lm433(_key(30), None, "INFLATION_COMPENSATIONS", {})


def test_a_renamed_or_removed_measure_is_rejected():
    assert not wire_diff.lm433(_key(11), "INFLATION_ADJUSTED_PRINCIPAL", "INFLATION_COMPENSATION", {})
    assert not wire_diff.lm433(_key(29), "INDEX_RATIO", None, {})
    assert not wire_diff.lm433(_key(30), "INFLATION_COMPENSATION", None, {})


def test_a_clean_price_type_change_is_rejected():
    key = f"field {TIPS_INPUT} = 2"
    assert not wire_diff.lm433(key, f"{wire_diff.DECIMAL} clean_price", "string clean_price", {})


def test_lm433_is_in_allowed():
    assert wire_diff.lm433 in wire_diff.ALLOWED
