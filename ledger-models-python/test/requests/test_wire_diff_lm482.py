"""wire-diff.py rule lm482 allows exactly the additions listed in
test-fixtures/field-changes/lm-482.json: the security metric messages, enum
and ObjectTypeProto values. Nothing that changes or removes an existing field.
"""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
METRIC = ".fintekkers.models.security.SecurityMetricProto"
OBJECT_TYPE = ".fintekkers.models.util.ObjectTypeProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def test_the_additions_are_allowed():
    assert wire_diff.lm482(f"message {METRIC}", None, "message", {})
    assert wire_diff.lm482(f"field {METRIC} = 10", None, ".fintekkers.models.util.UUIDProto security_id", {})
    assert wire_diff.lm482(f"field {METRIC} = 13", None, f"{wire_diff.DECIMAL} value", {})
    assert wire_diff.lm482(
        "field .fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto = 10", None,
        "repeated .fintekkers.models.util.UUIDProto security_id", {})
    assert wire_diff.lm482(f"value {OBJECT_TYPE} = 17", None, "OBJECT_TYPE_SECURITY_METRIC", {})
    assert wire_diff.lm482(f"value {OBJECT_TYPE} = 139", None, "OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE", {})


def test_another_number_name_or_type_is_rejected():
    assert not wire_diff.lm482(f"field {METRIC} = 7", None, "bool is_link", {})
    assert not wire_diff.lm482(f"field {METRIC} = 13", None, "double value", {})
    assert not wire_diff.lm482(f"field {METRIC} = 11", None, ".fintekkers.models.security.SecurityProto security", {})
    assert not wire_diff.lm482(
        "field .fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto = 10", None,
        ".fintekkers.models.util.UUIDProto security_id", {})
    assert not wire_diff.lm482(f"value {OBJECT_TYPE} = 140", None, "OBJECT_TYPE_SECURITY_METRIC_HISTORY", {})


def test_a_changed_or_removed_existing_field_is_rejected():
    assert not wire_diff.lm482(
        "field .fintekkers.models.price.PriceProto = 11", ".fintekkers.models.security.SecurityProto security", None, {})
    assert not wire_diff.lm482(f"value {OBJECT_TYPE} = 16", "OBJECT_TYPE_TRANSACTION", "OBJECT_TYPE_SECURITY_METRIC", {})


def test_lm482_is_in_allowed():
    assert wire_diff.lm482 in wire_diff.ALLOWED
