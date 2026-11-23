"""wire-diff.py rule lm484 allows exactly the security metric messages, the
SecurityMetricTypeProto enum and ObjectTypeProto 17 and 134-139, all as
additions. A change to an existing field or value, including on SecurityProto
and PriceProto, is rejected.

Keys use wire-diff's shape() form, with the leading dot. The values come from
test-fixtures/field-changes/lm-484.json.
"""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SPEC = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-484.json").read_text())
SERIES = ".fintekkers.models.security.SecurityMetricSeriesProto"
POINT = ".fintekkers.models.security.SecurityMetricPointProto"
OBJECT_TYPE = ".fintekkers.models.util.ObjectTypeProto"
UUID = ".fintekkers.models.util.UUIDProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def _field(message: str, number: int) -> str:
    return f"field {message} = {number}"


def test_the_additions_are_allowed():
    assert wire_diff.lm484(f"message {SERIES}", None, "message", {})
    assert wire_diff.lm484(f"message {POINT}", None, "message", {})
    assert wire_diff.lm484(_field(SERIES, 10), None, f"{UUID} security_id", {})
    assert wire_diff.lm484(_field(SERIES, 20), None, f"repeated {POINT} points", {})
    assert wire_diff.lm484(_field(POINT, 1), None, ".fintekkers.models.util.LocalDateProto observation_date", {})
    assert wire_diff.lm484(_field(POINT, 2), None, f"{wire_diff.DECIMAL} value", {})
    assert wire_diff.lm484("enum .fintekkers.models.security.SecurityMetricTypeProto", None, "enum", {})
    assert wire_diff.lm484("value .fintekkers.models.security.SecurityMetricTypeProto = 1", None, "SHARES_OUTSTANDING", {})
    assert sorted(v["number"] for v in SPEC["added_values"]) == [17, 134, 135, 136, 137, 138, 139]
    for v in SPEC["added_values"]:
        assert wire_diff.lm484(f"value {OBJECT_TYPE} = {v['number']}", None, v["name"], {})


def test_a_point_field_beyond_date_and_value_is_rejected():
    assert not wire_diff.lm484(_field(POINT, 3), None, f"{UUID} uuid", {})
    assert not wire_diff.lm484(_field(POINT, 3), None, ".fintekkers.models.util.LocalTimestampProto as_of", {})
    assert not wire_diff.lm484(_field(POINT, 1), None, f"{OBJECT_TYPE} object_type", {})


def test_another_type_or_label_is_rejected():
    assert not wire_diff.lm484(_field(SERIES, 10), None, ".fintekkers.models.security.SecurityProto security_id", {})
    assert not wire_diff.lm484(_field(SERIES, 20), None, f"{POINT} points", {})
    assert not wire_diff.lm484(_field(POINT, 2), None, "double value", {})


def test_another_object_type_number_is_rejected():
    assert not wire_diff.lm484(f"value {OBJECT_TYPE} = 18", None, "OBJECT_TYPE_SECURITY_METRIC_SERIES", {})
    assert not wire_diff.lm484(f"value {OBJECT_TYPE} = 140", None, "OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE", {})


def test_a_changed_or_removed_existing_field_is_rejected():
    assert not wire_diff.lm484(_field(".fintekkers.models.security.SecurityProto", 13),
                               ".fintekkers.models.security.SecurityProto settlement_currency", None, {})
    assert not wire_diff.lm484(_field(".fintekkers.models.price.PriceProto", 30),
                               None, f"repeated {POINT} points", {})
    assert not wire_diff.lm484(f"value {OBJECT_TYPE} = 16", "OBJECT_TYPE_TRANSACTION", "OBJECT_TYPE_SECURITY_METRIC_SERIES", {})
    assert not wire_diff.lm484(_field(SERIES, 10), f"{UUID} security_id", None, {})


def test_lm484_is_in_allowed():
    assert wire_diff.lm484 in wire_diff.ALLOWED
