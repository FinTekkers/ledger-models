"""wire-diff.py rule lm344 allows exactly the three LM-344 deletions.

Keys use wire-diff's shape() form, with the leading dot. The fields come from
test-fixtures/removed-fields/lm-344.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIELDS = json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-344.json").read_text())["fields"]

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def _old(f: dict) -> str:
    return f"{f['type']} {f['name']}"


def test_each_deletion_is_allowed():
    assert len(FIELDS) == 3
    for f in FIELDS:
        assert f["message"].startswith(".")
        assert wire_diff.lm344(_key(f), _old(f), None, {}), _key(f)


def test_a_fourth_deletion_is_rejected():
    key = "field .fintekkers.requests.valuation.TipsInput = 4"
    old = ".fintekkers.requests.valuation.InflationIndexInput cpi"
    assert not wire_diff.lm344(key, old, None, {})
    assert not any(rule(key, old, None, {}) for rule in wire_diff.ALLOWED)


def test_a_type_change_is_rejected():
    f = FIELDS[0]
    changed = f".fintekkers.models.util.DecimalValueProto {f['name']}"
    assert not wire_diff.lm344(_key(f), _old(f), changed, {})


def test_a_renamed_deletion_is_rejected():
    f = FIELDS[2]
    assert not wire_diff.lm344(_key(f), f"{f['type']} other_name", None, {})


def test_lm344_is_in_allowed():
    assert wire_diff.lm344 in wire_diff.ALLOWED
