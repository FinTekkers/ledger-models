"""wire-diff.py rule lm509 allows exactly SettlementConventionProto and its
three fields, ValuationRequestProto.settlement_convention = 80,
ValuationResponseProto.settlement_date = 60 and measure_asof_date = 61, all as
additions. A removed, renumbered or retyped field or value, DV01 = 25
included, is rejected. Measure 31, which LM-509 also added, is removed by
LM-514 (test_wire_diff_lm514.py), so lm509 no longer allows adding it.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-509.json.
"""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
VALUATION = ".fintekkers.requests.valuation"
CONVENTION = f"{VALUATION}.SettlementConventionProto"
REQUEST = f"{VALUATION}.ValuationRequestProto"
RESPONSE = f"{VALUATION}.ValuationResponseProto"
MEASURE = ".fintekkers.models.position.MeasureProto"
LOCAL_DATE = ".fintekkers.models.util.LocalDateProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _field(message: str, number: int) -> str:
    return f"field {message} = {number}"


def test_the_additions_are_allowed():
    assert wire_diff.lm509(f"message {CONVENTION}", None, "message", {})
    assert wire_diff.lm509(_field(CONVENTION, 1), None, f"{LOCAL_DATE} trade_date", {})
    assert wire_diff.lm509(_field(CONVENTION, 2), None, "uint32 settlement_lag_business_days", {})
    assert wire_diff.lm509(_field(CONVENTION, 3), None, "string calendar_id", {})
    assert wire_diff.lm509(_field(REQUEST, 80), None, f"{CONVENTION} settlement_convention", {})
    assert wire_diff.lm509(_field(RESPONSE, 60), None, f"{LOCAL_DATE} settlement_date", {})
    assert wire_diff.lm509(_field(RESPONSE, 61), None, f"{LOCAL_DATE} measure_asof_date", {})
    assert len(wire_diff.LM509) == 7


def test_a_renumbered_addition_is_rejected():
    assert not wire_diff.lm509(_field(REQUEST, 81), None, f"{CONVENTION} settlement_convention", {})
    assert not wire_diff.lm509(_field(CONVENTION, 4), None, "string calendar_id", {})
    assert not wire_diff.lm509(_field(RESPONSE, 62), None, f"{LOCAL_DATE} measure_asof_date", {})


def test_another_type_or_name_is_rejected():
    assert not wire_diff.lm509(_field(CONVENTION, 2), None, "int32 settlement_lag_business_days", {})
    assert not wire_diff.lm509(_field(CONVENTION, 3), None, ".fintekkers.models.util.UUIDProto calendar_id", {})
    assert not wire_diff.lm509(_field(REQUEST, 80), None, f"repeated {CONVENTION} settlement_convention", {})
    assert not wire_diff.lm509(f"value {MEASURE} = 31", None, "DV01", {})


def test_a_changed_or_removed_existing_field_or_value_is_rejected():
    assert not wire_diff.lm509(f"value {MEASURE} = 25", "DV01", "DV01_RENAMED", {})
    assert not wire_diff.lm509(f"value {MEASURE} = 25", "DV01", None, {})
    assert not wire_diff.lm509(_field(REQUEST, 23), ".fintekkers.models.util.LocalTimestampProto asof_datetime", None, {})
    assert not wire_diff.lm509(_field(REQUEST, 80), f"{CONVENTION} settlement_convention", None, {})


def test_lm509_is_in_allowed():
    assert wire_diff.lm509 in wire_diff.ALLOWED
