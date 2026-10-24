"""wire-diff.py rule lm389 allows exactly the LM-389 addition, with its type.

Keys use wire-diff's shape() form, with the leading dot. The field comes from
test-fixtures/field-changes/lm-389.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-389.json").read_text())["added"]
FIXING = ".fintekkers.requests.valuation.ReferenceRateFixingProto"
LOCAL_DATE = ".fintekkers.models.util.LocalDateProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def test_the_addition_is_allowed():
    assert [(f["message"], f["number"], f["name"], f["type"]) for f in ADDED] == [
        (FIXING, 5, "bill_issue_date", LOCAL_DATE),
    ]
    for f in ADDED:
        assert wire_diff.lm389(_key(f), None, f"{f['type']} {f['name']}", {}), _key(f)


def test_another_field_number_is_rejected():
    assert not wire_diff.lm389(f"field {FIXING} = 6", None, f"{LOCAL_DATE} bill_issue_date", {})


def test_a_string_date_is_rejected():
    assert not wire_diff.lm389(f"field {FIXING} = 5", None, "string bill_issue_date", {})


def test_a_changed_existing_field_is_rejected():
    old = f"{LOCAL_DATE} bill_maturity_date"
    assert not wire_diff.lm389(f"field {FIXING} = 4", old, f"{LOCAL_DATE} bill_issue_date", {})


def test_lm389_is_in_allowed():
    assert wire_diff.lm389 in wire_diff.ALLOWED
