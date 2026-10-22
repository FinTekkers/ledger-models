"""wire-diff.py rule lm365 allows exactly the LM-365 additions, with their types.

Keys use wire-diff's shape() form, with the leading dot. The fields come from
test-fixtures/field-changes/lm-365.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-365.json").read_text())["added"]
FIXING = ".fintekkers.requests.valuation.ReferenceRateFixingProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def _new(f: dict) -> str:
    return f"{'repeated ' if f.get('repeated') else ''}{f['type']} {f['name']}"


def test_each_addition_is_allowed():
    assert len(ADDED) == 5
    assert wire_diff.lm365(f"message {FIXING}", None, "message", {})
    for f in ADDED:
        assert wire_diff.lm365(_key(f), None, _new(f), {}), _key(f)


def test_a_double_rate_is_rejected():
    assert not wire_diff.lm365(f"field {FIXING} = 3", None, "double rate", {})


def test_a_string_fixing_date_is_rejected():
    assert not wire_diff.lm365(f"field {FIXING} = 2", None, "string fixing_date", {})


def test_a_map_of_fixings_is_rejected():
    key = "field .fintekkers.requests.valuation.FrnInput = 11"
    assert not wire_diff.lm365(key, None, ".fintekkers.requests.valuation.FrnInput.FixingsEntry fixings", {})
    assert not wire_diff.lm365("message .fintekkers.requests.valuation.FrnInput.FixingsEntry", None, "message", {})


def test_a_new_enum_is_rejected():
    assert not wire_diff.lm365(f"enum {FIXING}.IndexType", None, "enum", {})


def test_a_retyped_kept_field_is_rejected():
    key = "field .fintekkers.models.security.bond.IssuanceProto = 27"
    old = ".fintekkers.models.util.DecimalValueProto mature_security_amount"
    assert not wire_diff.lm365(key, old, "double mature_security_amount", {})


def test_lm365_is_in_allowed():
    assert wire_diff.lm365 in wire_diff.ALLOWED
