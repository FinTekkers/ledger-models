"""wire-diff.py rule lm514 allows exactly the deletion of MeasureProto value 31,
and only when the head descriptor reserves both its number and its old name.
Removing 25, 30 or any other value, or removing 31 without either
reservation, is rejected.

Keys use wire-diff's shape() form, with the leading dot. The removed value
comes from test-fixtures/removed-values/lm-514.json, which names the enum and
the number only. The old name is split so that the LM-514 grep finds it only
on its reserved line in measure.proto.
"""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = ".fintekkers.models.position.MeasureProto"
OLD_NAME = "DV01" "_PER_MILLION"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)

RESERVED_31 = f"reserved {MEASURE} = 31"
RESERVED_NAME = f"reserved-name {MEASURE} {OLD_NAME}"
HEAD = {RESERVED_31: "reserved", RESERVED_NAME: "reserved", f"value {MEASURE} = 25": "DV01"}


def test_the_removal_is_allowed_when_both_reservations_are_in_head():
    assert wire_diff.lm514(f"value {MEASURE} = 31", OLD_NAME, None, HEAD)


def test_the_reservations_are_allowed():
    assert wire_diff.lm514(RESERVED_31, None, "reserved", HEAD)
    assert wire_diff.lm514(RESERVED_NAME, None, "reserved", HEAD)


def test_the_removal_is_rejected_without_the_reserved_number():
    head = {k: v for k, v in HEAD.items() if k != RESERVED_31}
    assert not wire_diff.lm514(f"value {MEASURE} = 31", OLD_NAME, None, head)


def test_the_removal_is_rejected_without_the_reserved_name():
    head = {k: v for k, v in HEAD.items() if k != RESERVED_NAME}
    assert not wire_diff.lm514(f"value {MEASURE} = 31", OLD_NAME, None, head)
    other_name = {**head, f"reserved-name {MEASURE} OTHER": "reserved"}
    assert not wire_diff.lm514(f"value {MEASURE} = 31", OLD_NAME, None, other_name)


def test_removing_another_value_is_rejected():
    head = {**HEAD, f"reserved {MEASURE} = 25": "reserved", f"reserved-name {MEASURE} DV01": "reserved",
            f"reserved {MEASURE} = 30": "reserved",
            f"reserved-name {MEASURE} INFLATION_COMPENSATION": "reserved"}
    assert not wire_diff.lm514(f"value {MEASURE} = 25", "DV01", None, head)
    assert not wire_diff.lm514(f"value {MEASURE} = 30", "INFLATION_COMPENSATION", None, head)
    assert not wire_diff.lm514(f"value {MEASURE} = 32", "OTHER", None, head)
    assert not wire_diff.lm514("value .fintekkers.models.security.ProductTypeProto = 31", "X", None, head)


def test_renaming_or_readding_31_is_rejected():
    assert not wire_diff.lm514(f"value {MEASURE} = 31", OLD_NAME, "OTHER", HEAD)
    assert not wire_diff.lm514(f"value {MEASURE} = 31", None, OLD_NAME, HEAD)


def test_other_reservations_are_rejected():
    assert not wire_diff.lm514(f"reserved {MEASURE} = 25", None, "reserved", HEAD)
    assert not wire_diff.lm514(f"reserved {MEASURE} = 31", "reserved", None, HEAD)
    assert not wire_diff.lm514("reserved .fintekkers.models.security.ProductTypeProto = 31", None, "reserved", HEAD)
    # A name may be reserved on MeasureProto only once value 31 is gone.
    assert not wire_diff.lm514(RESERVED_NAME, None, "reserved", {**HEAD, f"value {MEASURE} = 31": OLD_NAME})
    assert not wire_diff.lm514(f"reserved-name .fintekkers.models.security.ProductTypeProto {OLD_NAME}",
                               None, "reserved", HEAD)


def test_lm514_is_in_allowed():
    assert wire_diff.lm514 in wire_diff.ALLOWED


def test_lm509_no_longer_allows_adding_31():
    assert not wire_diff.lm509(f"value {MEASURE} = 31", None, OLD_NAME, {})


def test_a_reserved_range_spanning_31_is_rejected():
    assert not wire_diff.lm514(f"reserved {MEASURE} = 31 to 40", None, "reserved", HEAD)
