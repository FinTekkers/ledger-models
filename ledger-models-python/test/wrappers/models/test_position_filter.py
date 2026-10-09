"""LM-281: the Python filter helper matches Java's PositionFilter row for row.

ASSET_CLASS EQUALS / NOT_EQUALS use the shared asset_class_matches rule;
every other field compares exactly. A None stored value never throws.
"""

import json
from pathlib import Path

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_util_pb2 import PositionFilterOperator
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.position_filter import filter_rows, matches
from fintekkers.wrappers.models.security.security import Security


def _security(asset_class):
    return Security(SecurityProto(asset_class=asset_class))


class _StubRow:
    """Row whose ASSET_CLASS get_field returns a canned value (or None)."""

    def __init__(self, asset_class):
        self._asset_class = asset_class

    def get_field(self, field):
        assert field == FieldProto.ASSET_CLASS
        return self._asset_class


def _asset_classes(rows):
    return [row.get_field(FieldProto.ASSET_CLASS) for row in rows]


def test_asset_class_equals_matches_group_members():
    rows = [_security(v) for v in ("RATES", "CREDIT", "Fixed Income", "EQUITY")]

    result = filter_rows(
        rows, [(FieldProto.ASSET_CLASS, PositionFilterOperator.EQUALS, "FIXED_INCOME")]
    )

    assert _asset_classes(result) == ["RATES", "CREDIT", "Fixed Income"]


def test_asset_class_not_equals_keeps_only_non_members():
    rows = [_security(v) for v in ("RATES", "CREDIT", "Fixed Income", "EQUITY")]

    result = filter_rows(
        rows,
        [(FieldProto.ASSET_CLASS, PositionFilterOperator.NOT_EQUALS, "FIXED_INCOME")],
    )

    assert _asset_classes(result) == ["EQUITY"]


def test_asset_class_none_empty_unknown():
    rows = [_StubRow(None), _security(""), _security("NOT_A_CLASS")]

    assert (
        filter_rows(
            rows,
            [(FieldProto.ASSET_CLASS, PositionFilterOperator.EQUALS, "FIXED_INCOME")],
        )
        == []
    )
    assert _asset_classes(
        filter_rows(
            rows,
            [
                (
                    FieldProto.ASSET_CLASS,
                    PositionFilterOperator.NOT_EQUALS,
                    "FIXED_INCOME",
                )
            ],
        )
    ) == [None, "", "NOT_A_CLASS"]


def test_matches_other_fields_compare_exactly():
    assert matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, "a", "a")
    assert not matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, "a", "b")
    assert matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, "a", "b")
    assert not matches(
        FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, "a", "a"
    )
    assert matches(
        FieldProto.MATURITY_DATE, PositionFilterOperator.MORE_THAN, 1, 2
    )
    assert not matches(
        FieldProto.MATURITY_DATE, PositionFilterOperator.MORE_THAN, 2, 1
    )
    assert not matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, "a", None)
    assert not matches(
        FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, "a", None
    )


# ---------- LM-284: NOT_EQUALS drops a None on fields other than ASSET_CLASS ----------


def _null_case_rows():
    """Cases from ledger-models-protos/fixtures/position_filter_null_cases.json,
    shared with the Java, JS and Rust tests."""
    for parent in Path(__file__).resolve().parents:
        path = parent / "ledger-models-protos" / "fixtures" / "position_filter_null_cases.json"
        if path.exists():
            with path.open(encoding="utf-8") as f:
                return json.load(f)["cases"]
    raise FileNotFoundError("position_filter_null_cases.json not found above this test")


def test_matches_null_cases_shared_fixture():
    cases = _null_case_rows()
    assert len(cases) >= 7
    for case in cases:
        field = FieldProto.Value(case["field"])
        operator = PositionFilterOperator.Value(case["operator"])
        assert matches(field, operator, case["filter"], None) is case["expected"], case


class _NullFieldRow:
    """Row whose every get_field returns None."""

    def get_field(self, field):
        return None


def test_filter_rows_not_equals_drops_none_on_other_field():
    rows = [_NullFieldRow()]
    assert (
        filter_rows(rows, [(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, "a")])
        == []
    )
