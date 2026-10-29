"""wire-diff.py rule lm408 allows exactly the LM-408 additions, with their types.

Keys use wire-diff's shape() form, with the leading dot. The messages and
fields come from test-fixtures/field-changes/lm-408.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SPEC = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-408.json").read_text())
VALUATION = ".fintekkers.requests.valuation"
PRODUCT_INPUT = f"{VALUATION}.ProductInput"
DECIMAL = ".fintekkers.models.util.DecimalValueProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _key(f: dict) -> str:
    return f"field {f['message']} = {f['number']}"


def test_the_thirteen_additions_are_allowed():
    assert SPEC["added_messages"] == [f"{VALUATION}.MbsInput", f"{VALUATION}.EquityInput", f"{VALUATION}.CashInput"]
    assert len(SPEC["added"]) == 10
    for m in SPEC["added_messages"]:
        assert wire_diff.lm408(f"message {m}", None, "message", {}), m
    for f in SPEC["added"]:
        assert wire_diff.lm408(_key(f), None, f"{f['type']} {f['name']}", {}), _key(f)


def test_the_three_arms_are_13_14_and_15():
    arms = [(f["number"], f["name"], f["type"]) for f in SPEC["added"] if f["message"] == PRODUCT_INPUT]
    assert arms == [
        (13, "mbs", f"{VALUATION}.MbsInput"),
        (14, "equity", f"{VALUATION}.EquityInput"),
        (15, "cash", f"{VALUATION}.CashInput"),
    ]


def test_a_retyped_existing_arm_is_rejected():
    old = f"{VALUATION}.BondInput bond"
    assert not wire_diff.lm408(f"field {PRODUCT_INPUT} = 1", old, f"{VALUATION}.MbsInput bond", {})


def test_a_deleted_existing_arm_is_rejected():
    assert not wire_diff.lm408(f"field {PRODUCT_INPUT} = 8", f"{VALUATION}.FrnInput frn", None, {})


def test_an_mbs_field_in_10_to_19_is_rejected():
    assert not wire_diff.lm408(f"field {VALUATION}.MbsInput = 10", None, f"{DECIMAL} psa_speed", {})


def test_arm_13_with_the_wrong_name_or_type_is_rejected():
    assert not wire_diff.lm408(f"field {PRODUCT_INPUT} = 13", None, f"{VALUATION}.MbsInput amortizing_bond", {})
    assert not wire_diff.lm408(f"field {PRODUCT_INPUT} = 13", None, f"{VALUATION}.BondInput mbs", {})


def test_another_arm_number_is_rejected():
    assert not wire_diff.lm408(f"field {PRODUCT_INPUT} = 4", None, f"{VALUATION}.MbsInput mbs", {})


def test_lm408_is_in_allowed():
    assert wire_diff.lm408 in wire_diff.ALLOWED
