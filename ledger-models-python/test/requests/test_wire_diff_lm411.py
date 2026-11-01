"""wire-diff.py rule lm411 allows exactly the two LM-411 deletions.

Keys use wire-diff's shape() form, with the leading dot. The fields come from
test-fixtures/removed-fields/lm-376.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-376.json").read_text())
FIELDS = FIXTURE["fields"]

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def _old(f: dict) -> str:
    return f"{f['type']} {f['name']}"


def test_each_deletion_is_allowed():
    assert len(FIELDS) == 2
    for f in FIELDS:
        assert wire_diff.lm411(_key(f), _old(f), None, {}), _key(f)


def test_deleting_position_input_is_rejected():
    kept = FIXTURE["kept"]
    assert not wire_diff.lm411(_key(kept), _old(kept), None, {})
    assert not any(rule(_key(kept), _old(kept), None, {}) for rule in wire_diff.ALLOWED)


def test_a_type_change_is_rejected():
    f = FIELDS[0]
    assert not wire_diff.lm411(_key(f), _old(f), f".fintekkers.models.price.PriceProto {f['name']}", {})


def test_lm411_is_in_allowed():
    assert wire_diff.lm411 in wire_diff.ALLOWED
