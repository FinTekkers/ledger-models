"""wire-diff.py rule lm382 allows exactly the LM-382 additions, with their types.

Keys use wire-diff's shape() form, with the leading dot. The fields come from
test-fixtures/field-changes/lm-382.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-382.json").read_text())["added"]
ISSUANCE = ".fintekkers.models.security.bond.IssuanceProto"
FIXING = ".fintekkers.requests.valuation.ReferenceRateFixingProto"
LOCAL_DATE = ".fintekkers.models.util.LocalDateProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def test_each_addition_is_allowed():
    assert [(f["message"], f["number"], f["name"], f["type"]) for f in ADDED] == [
        (ISSUANCE, 29, "auction_date", LOCAL_DATE),
        (FIXING, 4, "bill_maturity_date", LOCAL_DATE),
    ]
    for f in ADDED:
        assert wire_diff.lm382(_key(f), None, f"{f['type']} {f['name']}", {}), _key(f)


def test_another_field_number_is_rejected():
    assert not wire_diff.lm382(f"field {ISSUANCE} = 30", None, f"{LOCAL_DATE} auction_date", {})
    assert not wire_diff.lm382(f"field {FIXING} = 5", None, f"{LOCAL_DATE} bill_maturity_date", {})


def test_a_string_date_is_rejected():
    assert not wire_diff.lm382(f"field {ISSUANCE} = 29", None, "string auction_date", {})
    assert not wire_diff.lm382(f"field {FIXING} = 4", None, "string bill_maturity_date", {})


def test_a_stored_term_field_is_rejected():
    assert not wire_diff.lm382(f"field {ISSUANCE} = 29", None, ".fintekkers.models.security.TenorProto term", {})


def test_a_changed_existing_field_is_rejected():
    old = f"{LOCAL_DATE} auction_issue_date"
    assert not wire_diff.lm382(f"field {ISSUANCE} = 21", old, f"{LOCAL_DATE} auction_date", {})


def test_lm382_is_in_allowed():
    assert wire_diff.lm382 in wire_diff.ALLOWED
