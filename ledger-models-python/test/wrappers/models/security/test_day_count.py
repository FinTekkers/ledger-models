"""LM-498: bond day-count convention. DayCountConventionProto, optional
BondDetailsProto.day_count, hierarchy.json default_day_count, the
Security.get_day_count getter and the date helpers. Parity with Java
DayCountsTest, JS day_count.test.ts and Rust day_count_test.rs.

Shared cases live in ledger-models-protos/fixtures/default_day_count_cases.json
and test-fixtures/day-count/cases.json; expected values come from those files
only, never from the code under test.
"""
import json
import re
from datetime import date
from fractions import Fraction
from pathlib import Path

import pytest

from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.day_count_convention_pb2 import DayCountConventionProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import BondDetailsProto, EquityDetailsProto, SecurityProto
from fintekkers.wrappers.models.errors import InvalidRegistryError, ModelValidationError
from fintekkers.wrappers.models.security import day_count as DC
from fintekkers.wrappers.models.security import default_price_types as DPT
from fintekkers.wrappers.models.security import product_hierarchy
from fintekkers.wrappers.models.security.security import Security


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "ledger-models-protos" / "hierarchy.json").exists():
            return parent
    raise FileNotFoundError("ledger-models-protos/ not found above this test")


ROOT = _repo_root()
PROTOS = ROOT / "ledger-models-protos"


def _read(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


PRODUCT_CASES = _read(PROTOS / "fixtures" / "default_day_count_cases.json")["cases"]
DATE_CASES = _read(ROOT / "test-fixtures" / "day-count" / "cases.json")["cases"]


def _bond(product_type, day_count=None) -> SecurityProto:
    bond = BondDetailsProto()
    if day_count is not None:
        bond.day_count = day_count
    return SecurityProto(product_type=product_type, bond_details=bond)


def _d(iso: str) -> date:
    return date.fromisoformat(iso)


# ---------- metric 1: enum numbers and presence ----------

def test_enum_numbers():
    assert DayCountConventionProto.UNKNOWN_DAY_COUNT == 0
    assert DayCountConventionProto.ACT_ACT_ICMA == 1
    assert DayCountConventionProto.THIRTY_360_US == 2
    assert DayCountConventionProto.ACT_360 == 3
    assert DayCountConventionProto.ACT_365_FIXED == 4
    assert len(DayCountConventionProto.keys()) == 5


def test_day_count_presence_is_false_when_unset():
    assert not BondDetailsProto().HasField("day_count")
    assert BondDetailsProto(day_count=DayCountConventionProto.ACT_360).HasField("day_count")
    assert BondDetailsProto.DESCRIPTOR.fields_by_name["day_count"].number == 11


# ---------- metric 2: hierarchy.json default_day_count ----------

def test_shipped_section_has_the_six_leaf_mappings():
    section = _read(PROTOS / "hierarchy.json")["default_day_count"]
    assert section == {
        "TREASURY_NOTE": "ACT_ACT_ICMA",
        "TREASURY_BOND": "ACT_ACT_ICMA",
        "TIPS": "ACT_ACT_ICMA",
        "STRIPS": "ACT_ACT_ICMA",
        "TBILL": "ACT_360",
        "CORP_BOND": "THIRTY_360_US",
    }
    assert DC.parse_default_day_count(section).entries == DC.shipped().entries


def test_fixture_lists_every_product_type_enum_value():
    assert set(PRODUCT_CASES) == set(ProductTypeProto.keys())


@pytest.mark.parametrize("product_type,expected", sorted(PRODUCT_CASES.items()))
def test_every_product_resolves_as_the_fixture_says(product_type, expected):
    security = _bond(ProductTypeProto.Value(product_type))
    assert DC.resolve_day_count(security) == DayCountConventionProto.Value(expected)


def test_shipped_entries_are_read_only():
    with pytest.raises(TypeError):
        DC.shipped().entries["BOND"] = DayCountConventionProto.ACT_360


@pytest.mark.parametrize("section,match", [
    ({"NOT_A_NODE": "ACT_360"}, "NOT_A_NODE"),
    ({"CORP_BOND": "THIRTY_360"}, "THIRTY_360"),
    ({"CORP_BOND": "UNKNOWN_DAY_COUNT"}, "UNKNOWN_DAY_COUNT"),
    ({"CORP_BOND": 2}, "CORP_BOND"),
    (None, "missing"),
    (["CORP_BOND", "ACT_360"], "object"),
])
def test_broken_section_raises_invalid_registry_error(section, match):
    with pytest.raises(InvalidRegistryError, match=match):
        DC.parse_default_day_count(section)


# ---------- metric 3: the getter ----------

@pytest.mark.parametrize("product_type,expected", [
    (ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_ACT_ICMA),
    (ProductTypeProto.CORP_BOND, DayCountConventionProto.THIRTY_360_US),
    (ProductTypeProto.TBILL, DayCountConventionProto.ACT_360),
])
def test_getter_returns_the_product_default_when_unset(product_type, expected):
    assert Security(_bond(product_type)).get_day_count() == expected


def test_getter_explicit_value_wins():
    security = Security(_bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360))
    assert security.get_day_count() == DayCountConventionProto.ACT_360


def test_round_trip_keeps_explicit_and_keeps_unset_unset():
    explicit = SecurityProto.FromString(
        _bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360).SerializeToString())
    assert explicit.bond_details.HasField("day_count")
    assert Security(explicit).get_day_count() == DayCountConventionProto.ACT_360

    unset = SecurityProto.FromString(_bond(ProductTypeProto.TREASURY_NOTE).SerializeToString())
    assert not unset.bond_details.HasField("day_count")
    assert Security(unset).get_day_count() == DayCountConventionProto.ACT_ACT_ICMA


def test_round_trip_explicit_unknown_is_present_and_resolves_like_unset():
    parsed = SecurityProto.FromString(
        _bond(ProductTypeProto.CORP_BOND, DayCountConventionProto.UNKNOWN_DAY_COUNT).SerializeToString())
    assert parsed.bond_details.HasField("day_count")
    assert Security(parsed).get_day_count() == DayCountConventionProto.THIRTY_360_US


# ---------- guardrail 3: no entry is UNKNOWN_DAY_COUNT, never a guess ----------

@pytest.mark.parametrize("product_type", [ProductTypeProto.TREASURY_FRN, ProductTypeProto.PRODUCT_TYPE_UNKNOWN])
def test_getter_returns_unknown_for_a_product_with_no_entry(product_type):
    assert Security(_bond(product_type)).get_day_count() == DayCountConventionProto.UNKNOWN_DAY_COUNT


def test_getter_returns_unknown_for_an_unrecognised_explicit_value():
    assert Security(_bond(ProductTypeProto.CORP_BOND, 99)).get_day_count() == DayCountConventionProto.UNKNOWN_DAY_COUNT


def test_getter_on_an_equity_returns_unknown():
    equity = SecurityProto(product_type=ProductTypeProto.COMMON_STOCK, equity_details=EquityDetailsProto())
    assert Security(equity).get_day_count() == DayCountConventionProto.UNKNOWN_DAY_COUNT


# ---------- metric 4: the date helpers ----------

def _case_id(c):
    return f"{c['convention']}:{c['case']}"


@pytest.mark.parametrize("case", DATE_CASES, ids=_case_id)
def test_helpers_match_every_fixture_row(case):
    conv = DayCountConventionProto.Value(case["convention"])
    start, end = _d(case["start"]), _d(case["end"])
    assert DC.day_count(conv, start, end) == case["day_count"]
    if conv == DayCountConventionProto.ACT_ACT_ICMA:
        ps, pe = _d(case["period_start"]), _d(case["period_end"])
        assert (pe - ps).days == case["period_days"]
        assert DC.icma_period_fraction(start, end, ps, pe) == pytest.approx(case["period_fraction"], abs=1e-12)
        assert DC.icma_year_fraction(start, end, ps, pe, case["frequency"]) == pytest.approx(
            case["year_fraction"], abs=1e-12)
    else:
        assert DC.year_fraction(conv, start, end) == pytest.approx(case["year_fraction"], abs=1e-12)


def test_fixture_covers_every_convention_and_required_shape():
    conventions = {c["convention"] for c in DATE_CASES}
    assert conventions == {"ACT_ACT_ICMA", "THIRTY_360_US", "ACT_360", "ACT_365_FIXED"}
    required = {"coreweave", "31_to_31", "30_to_31", "31_to_1", "feb28_nonleap", "feb29_leap",
                "month_end_feb_nonleap", "month_end_feb_leap", "feb28_to_feb29"}
    for conv in conventions:
        tags = {c["case"] for c in DATE_CASES if c["convention"] == conv}
        assert required <= tags, f"{conv} is missing {sorted(required - tags)}"
    for c in DATE_CASES:
        assert float(Fraction(c["year_fraction_ratio"])) == pytest.approx(c["year_fraction"], abs=1e-15), c
        if c["convention"] == "ACT_ACT_ICMA":
            assert {"period_start", "period_end", "frequency", "period_days", "period_fraction"} <= c.keys(), c


def test_fixture_coreweave_rows():
    rows = {c["convention"]: c for c in DATE_CASES if c["case"] == "coreweave"}
    thirty = rows["THIRTY_360_US"]
    assert (thirty["start"], thirty["end"], thirty["day_count"], thirty["year_fraction_ratio"]) == (
        "2026-12-01", "2027-03-01", 90, "90/360")
    icma = rows["ACT_ACT_ICMA"]
    assert (icma["period_start"], icma["period_end"], icma["frequency"]) == ("2026-12-01", "2027-06-01", 2)
    assert (icma["day_count"], icma["period_days"], icma["year_fraction_ratio"]) == (90, 182, "90/364")


@pytest.mark.parametrize("call", [
    lambda: DC.day_count(DayCountConventionProto.THIRTY_360_US, date(2027, 3, 1), date(2027, 2, 1)),
    lambda: DC.day_count(DayCountConventionProto.UNKNOWN_DAY_COUNT, date(2027, 1, 1), date(2027, 2, 1)),
    lambda: DC.year_fraction(DayCountConventionProto.UNKNOWN_DAY_COUNT, date(2027, 1, 1), date(2027, 2, 1)),
    lambda: DC.year_fraction(DayCountConventionProto.ACT_ACT_ICMA, date(2027, 1, 1), date(2027, 2, 1)),
    lambda: DC.icma_year_fraction(date(2027, 3, 1), date(2027, 2, 1), date(2026, 12, 1), date(2027, 6, 1), 2),
    lambda: DC.icma_year_fraction(date(2026, 11, 1), date(2027, 2, 1), date(2026, 12, 1), date(2027, 6, 1), 2),
    lambda: DC.icma_year_fraction(date(2027, 1, 1), date(2027, 2, 1), date(2026, 12, 1), date(2027, 6, 1), 0),
])
def test_bad_input_raises_model_validation_error(call):
    with pytest.raises(ModelValidationError):
        call()


# ---------- guardrail 1: a bad day-count section breaks nothing else ----------

def test_bad_day_count_section_leaves_price_types_and_helpers_working(monkeypatch):
    real = product_hierarchy.registry_section

    def broken(name):
        return {"NOT_A_NODE": "ACT_360"} if name == "default_day_count" else real(name)

    monkeypatch.setattr(product_hierarchy, "registry_section", broken)
    DC.shipped.cache_clear()
    DPT.shipped.cache_clear()
    try:
        with pytest.raises(InvalidRegistryError):
            Security(_bond(ProductTypeProto.CORP_BOND)).get_day_count()
        note = SecurityProto(product_type=ProductTypeProto.TREASURY_NOTE)
        assert DPT.resolve_trade_price_type(note) == PriceTypeProto.PERCENTAGE
        assert DC.day_count(DayCountConventionProto.THIRTY_360_US, date(2026, 12, 1), date(2027, 3, 1)) == 90
    finally:
        DC.shipped.cache_clear()
        DPT.shipped.cache_clear()


# ---------- metric 5: the proto comments are the spec ----------

def test_proto_comments_define_the_conventions():
    enum_proto = (PROTOS / "fintekkers/models/security/day_count_convention.proto").read_text(encoding="utf-8")
    thirty = enum_proto.split("ACT_ACT_ICMA = 1;", 1)[1].split("THIRTY_360_US = 2;", 1)[0]
    assert "If D1 = 31, set D1 = 30." in thirty
    assert "If D2 = 31 and D1 >= 30" in thirty
    assert "no February end-of-month adjustment" in thirty
    assert "Year fraction = days / 360" in thirty

    security_proto = (PROTOS / "fintekkers/models/security/security.proto").read_text(encoding="utf-8")
    field = re.search(r"((?:\s*//[^\n]*\n)+)\s*optional DayCountConventionProto day_count = 11;", security_proto)
    assert field, "BondDetailsProto.day_count = 11 with a comment"
    comment = field.group(1)
    assert "default_day_count" in comment
    assert "Unset means the product default" in comment
    assert "explicit UNKNOWN_DAY_COUNT resolves like unset" in comment

    assert (ROOT / "docs" / "adr" / "day_count_convention.md").exists()
