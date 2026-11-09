"""The measure catalog lists REFERENCE_CPI (28) and INDEX_RATIO (29) (LM-343),
in the source copy and the packaged Python mirror, matching MeasureProto.
applies_to holds ProductTypeProto names or hierarchy.json nodes (LM-372),
every language's mirror is byte-equal to the source, LM-364 leaves the
UNADJUSTED_COST_BASIS entry unchanged, every MeasureProto value has one
catalog entry (LM-402, which also added PROFIT_LOSS), and every entry says
what computes it and what it depends on (LM-403). LM-425 corrects applies_to
and implemented to match valuation-service: every change is listed, with its
engine file, in test-fixtures/catalog/lm-425-changes.json; LM-427 adds one
row (PROFIT_LOSS_PERCENT off TREASURY_FRN) and reads the per-input-type lists through
product_inputs.measures_for_input_type. LM-434 flips only
INFLATION_COMPENSATION.implemented to true (valuation-service VS-155). LM-456
states that TIPS accrued interest is scaled by the index ratio (31 CFR 356):
every catalog equals the v1.1.39 snapshot test-fixtures/catalog/lm-456-before.json
but for ACCRUED_INTEREST's formula, model_assumptions and depends_on, and the
ACCRUED_INTEREST proto comment states the same rule."""
import json
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2
from fintekkers.models.security import product_type_pb2
from fintekkers.wrappers.models.security.product_inputs import _measures_for_input_type_in, measures_for_input_type

_PYTHON = Path(__file__).resolve().parents[1]
SOURCE = _PYTHON.parent / "ledger-models-protos" / "catalog" / "measures.json"
MIRROR = _PYTHON / "fintekkers" / "catalog" / "measures.json"
_REPO = _PYTHON.parent
HIERARCHY = _REPO / "ledger-models-protos" / "hierarchy.json"
OTHER_MIRRORS = {
    "java": _REPO / "ledger-models-java" / "src" / "main" / "resources" / "catalog" / "measures.json",
    "javascript": _REPO / "ledger-models-javascript" / "catalog" / "measures.json",
    "rust": _REPO / "ledger-models-rust" / "catalog" / "measures.json",
}
COMPUTED_BY = {"input", "ledger-service", "valuation-service"}
INPUTS = {"TAX_LOTS", "SECURITY_TERMS", "CPI_U", "BILL_FIXINGS", "YIELD_CURVE", "TREASURY_PRICES"}
LM403_KEYS = {"computed_by", "depends_on"}
LM364_UNCHANGED = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
@pytest.mark.parametrize("name,number", [("REFERENCE_CPI", 28), ("INDEX_RATIO", 29)])
def test_catalog_lists_new_tips_measure(path, name, number):
    measures = {m["name"]: m for m in json.loads(path.read_text())["measures"]}
    assert measures[name]["enum_value"] == number
    assert measures[name]["implemented"] is True
    assert measures[name]["applies_to"] == ["TIPS"]
    assert measure_pb2.MeasureProto.Value(name) == number


def test_python_mirror_matches_source():
    assert MIRROR.read_bytes() == SOURCE.read_bytes()


@pytest.mark.parametrize("mirror", OTHER_MIRRORS.values(), ids=OTHER_MIRRORS.keys())
def test_language_mirror_matches_source(mirror):
    assert mirror.read_bytes() == SOURCE.read_bytes()


def test_applies_to_names_product_types_or_hierarchy_nodes():
    product_types = set(product_type_pb2.ProductTypeProto.keys())
    nodes = {
        name
        for name, entry in json.loads(HIERARCHY.read_text())["product_types"].items()
        if entry.get("abstract")
    }
    measures = json.loads(SOURCE.read_text())["measures"]
    unknown = {
        (m["name"], name)
        for m in measures
        for name in m["applies_to"]
        if name not in product_types and name not in nodes
    }
    assert not unknown
    assert any(m["applies_to"] for m in measures)


@pytest.mark.parametrize("name", LM364_UNCHANGED["catalog"])
def test_lm364_leaves_unadjusted_cost_basis_and_profit_loss_unchanged(name):
    if LM364_UNCHANGED["catalog"][name] is None:
        pytest.skip(f"{name} had no entry before LM-364; LM-402 added one")
    baseline = LM364_UNCHANGED["catalog"][name]
    entry = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}[name]
    assert set(entry) - set(baseline) <= LM403_KEYS
    assert {key: entry.get(key) for key in baseline} == baseline


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
def test_every_measure_has_one_catalog_entry(path):
    measures = json.loads(path.read_text())["measures"]
    for name, number in measure_pb2.MeasureProto.items():
        if name == "UNKNOWN_MEASURE":
            continue
        entries = [m for m in measures if m["name"] == name]
        assert len(entries) == 1, name
        assert entries[0]["enum_value"] == number, name


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
def test_every_measure_has_computed_by_and_depends_on(path):
    measures = json.loads(path.read_text())["measures"]
    names = {m["name"] for m in measures}
    for m in measures:
        assert LM403_KEYS <= set(m), m["name"]
        assert isinstance(m["depends_on"], list), m["name"]
        if m["category"] == "sentinel":
            assert m["computed_by"] is None and m["depends_on"] == [], m["name"]
            continue
        assert m["computed_by"] in COMPUTED_BY, m["name"]
        unknown = [d for d in m["depends_on"] if d not in names and d not in INPUTS]
        assert not unknown, (m["name"], unknown)
        assert m["name"] not in m["depends_on"], m["name"]
        if m["computed_by"] == "input":
            assert m["depends_on"] == [], m["name"]


def test_lm403_dependency_values():
    measures = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}
    assert (measures["CLEAN_PRICE"]["computed_by"], measures["CLEAN_PRICE"]["depends_on"]) == ("input", [])
    assert measures["DIRECTED_QUANTITY"]["computed_by"] == "ledger-service"
    assert measures["UNADJUSTED_COST_BASIS"]["depends_on"] == ["TAX_LOTS"]
    assert measures["ADJUSTED_COST_BASIS"]["depends_on"] == [
        "TAX_LOTS", "SECURITY_TERMS", "REFERENCE_CPI", "BILL_FIXINGS"]
    assert measures["DV01"]["depends_on"] == ["MODIFIED_DURATION", "MARKET_VALUE"]
    assert measures["REFERENCE_CPI"]["depends_on"] == ["CPI_U"]


LM425_BEFORE = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-425-before.json").read_text())["measures"]
LM425_CHANGES = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-425-changes.json").read_text())["changes"]
LM425_FIELDS = ("applies_to", "implemented")
# LM-456 states the TIPS index-ratio scaling in these ACCRUED_INTEREST keys only.
LM456_FIELDS = {"formula", "model_assumptions", "depends_on"}
INPUT_TYPES = ("bond", "tips", "frn", "mbs", "equity", "cash")


def test_lm425_catalog_edits_touch_only_applies_to_and_implemented():
    # Later items append entries (LM-433: INFLATION_COMPENSATION); the
    # LM-425 entries stay first, in order.
    after = json.loads(SOURCE.read_text())["measures"][:len(LM425_BEFORE)]
    assert [m["name"] for m in after] == [m["name"] for m in LM425_BEFORE]
    for old, new in zip(LM425_BEFORE, after):
        assert set(new) == set(old), new["name"]
        exempt = LM456_FIELDS if new["name"] == "ACCRUED_INTEREST" else set()
        for key in set(old) - set(LM425_FIELDS) - exempt:
            assert new[key] == old[key], (new["name"], key)


def _lm425_diffs():
    after = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}
    return {
        (old["name"], field): (old[field], after[old["name"]][field])
        for old in LM425_BEFORE
        for field in LM425_FIELDS
        if old[field] != after[old["name"]][field]
    }


def test_lm425_every_catalog_change_is_listed_with_its_engine_file():
    rows = {(row["measure"], row["field"]): row for row in LM425_CHANGES}
    assert len(rows) == len(LM425_CHANGES)
    assert set(rows) == set(_lm425_diffs())
    for key, (before, after) in _lm425_diffs().items():
        row = rows[key]
        assert (row["before"], row["after"]) == (before, after), key
        assert row["engine_file"].startswith("src/engine/") and row["reason"], key


def _by_input_type(measures_for):
    return {
        input_type: {measure_pb2.MeasureProto.Name(m) for m in measures_for(input_type)}
        for input_type in INPUT_TYPES
    }


def test_measures_by_helper_is_gone():
    # LM-427: the public product_inputs.measures_for_input_type replaced the
    # test-local _measures_by_* helper.
    assert not [name for name in globals() if name.startswith("_measures_by_")]


def test_lm425_changes_per_input_type_are_only_the_listed_ones():
    before = _by_input_type(lambda input_type: _measures_for_input_type_in(LM425_BEFORE, input_type))
    after = _by_input_type(measures_for_input_type)
    changes = {
        input_type: (before[input_type] - after[input_type], after[input_type] - before[input_type])
        for input_type in before
        if before[input_type] != after[input_type]
    }
    assert changes == {
        "frn": ({"YIELD_TO_MATURITY", "MACAULAY_DURATION", "PRESENT_VALUE",
                 "CONVEXITY", "MODIFIED_DURATION", "DV01", "PROFIT_LOSS_PERCENT"},
                {"ADJUSTED_COST_BASIS"}),
        "tips": (set(), {"REFERENCE_CPI", "INDEX_RATIO", "ADJUSTED_COST_BASIS", "INFLATION_COMPENSATION"}),
        "bond": (set(), {"ADJUSTED_COST_BASIS"}),
    }
    # What src/engine/frn.rs computes, ADJUSTED_COST_BASIS included (LM-429:
    # VS-123). PROFIT_LOSS_PERCENT is gone: frn.rs returns UNIMPLEMENTED for
    # it (LM-427, owner ruling 31 Oct).
    assert after["frn"] == {
        "MARKET_VALUE", "CURRENT_YIELD", "PRESENT_VALUE_CASHFLOWS", "DISCOUNT_MARGIN",
        "SPREAD_DURATION", "PROFIT_LOSS", "ACCRUED_INTEREST", "DIRTY_PRICE",
        "ADJUSTED_COST_BASIS",
    }


LM456_BEFORE = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-456-before.json").read_text())
CATALOGS = {"protos": SOURCE, "python": MIRROR, **OTHER_MIRRORS}
MEASURE_PROTO = _REPO / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
# v1.1.39 ACCRUED_INTEREST text that LM-456 must leave byte-identical.
LM456_FIXED_COUPON_FORMULA = (
    "AccruedInterest = (coupon_rate / coupon_frequency) * (days_since_last_coupon / days_in_period)"
    " * directed_quantity."
)
LM456_FRN_FORMULA = (
    "Treasury FRNs: AccruedInterest = Σ_{each day} (index_fixing_d + spread) / 360 * directed_quantity,"
    " where directed_quantity is the position's face"
)
LM456_PROTO_UNCHANGED = (
    """  //   AccruedInterest = (coupon_rate / coupon_frequency) * (days_since_last_coupon / days_in_period)
  //                     * directed_quantity
  //   Day count: the security's (Actual/Actual (ICMA) for US Treasuries).
""",
    """  // Treasury FRNs: the sum, over each day from the last coupon date to
  // settlement, of that day's (13-week bill index fixing + spread) / 360 on face:
  //   AccruedInterest = Σ_{each day} (index_fixing_d + spread) / 360 * directed_quantity
  //   where directed_quantity is the position's face.
  //   The fixings are the ones supplied in the request; no curve is used.
  //
  // Applicability: Bond, TIPS, FRN (coupon-bearing securities).
  //   Returns null/zero for Equity, Cash, and zero-coupon bonds.
  // Units: Dollars (absolute dollar amount for the position).
""",
)


def _accrued_interest(catalog):
    entries = [m for m in catalog["measures"] if m["name"] == "ACCRUED_INTEREST"]
    assert len(entries) == 1
    return entries[0]


def _accrued_interest_proto_comment():
    lines = MEASURE_PROTO.read_text().splitlines(keepends=True)
    end = next(i for i, line in enumerate(lines) if line.strip() == "ACCRUED_INTEREST = 20;")
    start = end
    while lines[start - 1].lstrip().startswith("//"):
        start -= 1
    return "".join(lines[start:end])


@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_lm456_accrued_interest_formula_states_tips_index_ratio(path):
    entry = _accrued_interest(json.loads(path.read_text()))
    assert "index_ratio" in entry["formula"]
    assert "reference_cpi / base_cpi" in entry["formula"]
    assert "Appendix B" in entry["formula"]
    assert "not floored" in entry["formula"]
    assert "returns an error, never an unscaled figure" in entry["formula"]
    assert "INDEX_RATIO" in entry["depends_on"]


def test_lm456_proto_accrued_interest_comment_states_tips_index_ratio():
    comment = _accrued_interest_proto_comment()
    for phrase in ("index_ratio", "reference_cpi / base_cpi", "Appendix B", "not floored",
                   "returns an error", "exception to the\n  //   absent rule"):
        assert phrase in comment, phrase
    # Fixed-coupon, zero-coupon and FRN wording stays as at v1.1.39; only the
    # shared heading splits so TIPS gets its own formula.
    for unchanged in LM456_PROTO_UNCHANGED:
        assert unchanged in comment
    assert "  // Fixed-coupon bonds:\n" + LM456_PROTO_UNCHANGED[0] in comment
    assert "Fixed-coupon bonds and TIPS" not in comment


# This freezes the whole catalog at the LM-450 release (v1.1.39). A later
# item that edits any catalog must update this test (or retire it), the way
# LM-456 retired the LM-434 freeze.
@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_lm456_catalogs_differ_from_v1_1_39_only_in_accrued_interest_tips(path):
    before = LM456_BEFORE["catalog"]
    after = json.loads(path.read_text())
    assert "v1.1.39" in LM456_BEFORE["note"]
    assert list(after) == list(before)
    for key in set(before) - {"measures"}:
        assert after[key] == before[key], key
    assert [m["name"] for m in after["measures"]] == [m["name"] for m in before["measures"]]
    for old, new in zip(before["measures"], after["measures"]):
        assert list(new) == list(old), new["name"]
        if new["name"] != "ACCRUED_INTEREST":
            assert new == old, new["name"]
            continue
        for key in set(old) - LM456_FIELDS:
            assert new[key] == old[key], key
        assert LM456_FIXED_COUPON_FORMULA in old["formula"] and LM456_FRN_FORMULA in old["formula"]
        assert "Fixed-coupon bonds: " + LM456_FIXED_COUPON_FORMULA in new["formula"]
        assert new["formula"].endswith(LM456_FRN_FORMULA)
        assert "Fixed-coupon bonds and TIPS" not in new["formula"]
        assert new["model_assumptions"][:len(old["model_assumptions"])] == old["model_assumptions"]
        assert len(new["model_assumptions"]) == len(old["model_assumptions"]) + 1
        assert new["depends_on"] == old["depends_on"] + ["INDEX_RATIO"]
