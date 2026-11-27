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
ACCRUED_INTEREST proto comment states the same rule. LM-459 adds, in that
comment only, which bonds are not scaled and a TIPS example that recomputes
by hand to $5.99 per $1,000 face. LM-499 restates the formula and
model_assumptions of seven fixed-coupon entries (LM499_MEASURES) and their
proto comments for the street stub convention; every other entry and comment
stays as it was. LM-496 adds one `Unpublished CPI-U month` note (31 CFR 356
Appendix B fallback) to the REFERENCE_CPI and INDEX_RATIO proto comments and
catalog entries; the rest of each comment and entry stays as it was. LM-506
restates REAL_YIELD's formula and model_assumptions, and its proto comment, for
the street stub convention on the dirty real price; every other key stays as
it was. LM-509 appends DV01_PER_MILLION (31), implemented: false, with units
that match its proto comment; DV01 (25) stays as it was."""
import hashlib
import json
import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
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
# LM-477 states the projected TIPS cashflow formula in these
# PRESENT_VALUE_CASHFLOWS keys only; implemented, depends_on and applies_to
# stay as they were (the calculation ships in VS-159).
LM477_FIELDS = {"formula", "units", "model_assumptions"}
# LM-499 states the street stub convention in these keys of these entries only.
LM499_FIELDS = {"formula", "model_assumptions"}
LM499_MEASURES = ("YIELD_TO_MATURITY", "MACAULAY_DURATION", "PRESENT_VALUE", "PRESENT_VALUE_CASHFLOWS",
                  "CONVEXITY", "MODIFIED_DURATION", "DV01")
# LM-496 adds one model_assumptions string to these entries only.
LM496_MEASURES = ("REFERENCE_CPI", "INDEX_RATIO")
# LM-506 states the street stub convention on the dirty real price in the
# LM499_FIELDS keys of this entry only.
LM506_MEASURES = ("REAL_YIELD",)
INPUT_TYPES = ("bond", "tips", "frn", "mbs", "equity", "cash")


def test_lm425_catalog_edits_touch_only_applies_to_and_implemented():
    # Later items append entries (LM-433: INFLATION_COMPENSATION); the
    # LM-425 entries stay first, in order.
    after = json.loads(SOURCE.read_text())["measures"][:len(LM425_BEFORE)]
    assert [m["name"] for m in after] == [m["name"] for m in LM425_BEFORE]
    for old, new in zip(LM425_BEFORE, after):
        assert set(new) == set(old), new["name"]
        exempt = {"ACCRUED_INTEREST": LM456_FIELDS, "PRESENT_VALUE_CASHFLOWS": LM477_FIELDS}.get(new["name"], set())
        if new["name"] in LM499_MEASURES + LM506_MEASURES:
            exempt = exempt | LM499_FIELDS
        if new["name"] in LM496_MEASURES:
            # The added string is checked by _assert_lm496_fallback.
            exempt = exempt | {"model_assumptions"}
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
    return _proto_comment("ACCRUED_INTEREST = 20;")


def _proto_comment(declaration):
    lines = MEASURE_PROTO.read_text().splitlines(keepends=True)
    end = next(i for i, line in enumerate(lines) if line.strip() == declaration)
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


def _assert_lm477_present_value_cashflows(old, new):
    for key in set(old) - LM477_FIELDS:
        assert new[key] == old[key], key
    assert "index_ratio (TIPS only)" in new["formula"]
    assert "(1 + rate/100)^y" in new["formula"]
    assert new["units"].startswith(old["units"] + "; index_ratio dimensionless")
    assert new["model_assumptions"][0] == old["model_assumptions"][0]
    # LM-499 rewrote the invariant line (model_assumptions[1]); its spec test owns it.


def _assert_lm496_fallback(old, new):
    for key in set(old) - {"model_assumptions"}:
        assert new[key] == old[key], (new["name"], key)
    assert new["model_assumptions"][:len(old["model_assumptions"])] == old["model_assumptions"]
    assert len(new["model_assumptions"]) == len(old["model_assumptions"]) + 1


# This freezes the whole catalog at the LM-450 release (v1.1.39), apart from
# the LM-456 ACCRUED_INTEREST, LM-477 PRESENT_VALUE_CASHFLOWS, LM-499
# street-stub (formula and model_assumptions of LM499_MEASURES), LM-496
# fallback (one added model_assumptions string in LM496_MEASURES) and LM-506
# REAL_YIELD (formula and model_assumptions of LM506_MEASURES) edits. A
# later item that edits any catalog must update this test (or retire it), the
# way LM-456 retired the LM-434 freeze.
@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_lm456_catalogs_differ_from_v1_1_39_only_in_accrued_interest_tips(path):
    before = LM456_BEFORE["catalog"]
    after = json.loads(path.read_text())
    assert "v1.1.39" in LM456_BEFORE["note"]
    assert list(after) == list(before)
    for key in set(before) - {"measures"}:
        assert after[key] == before[key], key
    # LM-509 appends exactly one entry, DV01_PER_MILLION (test_lm509_catalog_entry).
    assert [m["name"] for m in after["measures"]] == [m["name"] for m in before["measures"]] + ["DV01_PER_MILLION"]
    for old, new in zip(before["measures"], after["measures"]):
        assert list(new) == list(old), new["name"]
        if new["name"] == "PRESENT_VALUE_CASHFLOWS":
            _assert_lm477_present_value_cashflows(old, new)
            continue
        if new["name"] in LM499_MEASURES + LM506_MEASURES:
            for key in set(old) - LM499_FIELDS:
                assert new[key] == old[key], (new["name"], key)
            continue
        if new["name"] in LM496_MEASURES:
            _assert_lm496_fallback(old, new)
            continue
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


# LM-459: the ACCRUED_INTEREST comment says which bonds are not scaled and
# gives a TIPS example a reader can check by hand. The rest of measure.proto
# stays as at the LM-456 merge (36186e66): sha256 of the file with the
# ACCRUED_INTEREST comment, the comments of the seven LM-499 entries and the
# LM-506 REAL_YIELD comment cut out (computed on main at e50ec873, before the
# LM-506 edit), the two LM-496 `Unpublished CPI-U month` bullets cut out by
# _lm496_strip, and the LM-509 additions cut out by _lm509_strip. A later item
# that edits measure.proto must update this hash (or retire the test).
LM459_PROTO_OUTSIDE_COMMENT_SHA256 = "ea2ab69d7c738e9081c5d9e5b86e9609de8c32e2dbd69de6e38f456adf6f803f"
LM459_FORMULA = (
    "coupon_rate / frequency × Actual/Actual ICMA fraction"
    " × index ratio at settlement × directed_quantity"
)


def _accrued_interest_proto_comment_text():
    """The comment with each `//` prefix removed and whitespace collapsed."""
    lines = _accrued_interest_proto_comment().splitlines()
    return " ".join(" ".join(line.strip().removeprefix("//") for line in lines).split())


def _search(pattern, text):
    match = re.search(pattern, text)
    assert match, pattern
    return match.group(1)


def test_lm459_comment_states_formula_and_not_scaled_bonds():
    text = _accrued_interest_proto_comment_text()
    assert LM459_FORMULA in text
    assert "Actual/Actual ICMA fraction = days_since_last_coupon / days_in_period" in text
    sentence = _search(r"(Not scaled:[^.;]*)", text).lower()
    for phrase in ("not scaled", "nominal", "zero-coupon bonds", "frns"):
        assert phrase in sentence, phrase
    assert "not scaled by the index ratio; their accrual is unchanged from today" in text


def test_lm459_tips_example_recomputes_to_stated_cents():
    text = _accrued_interest_proto_comment_text()
    example = text[text.index("Example (TIPS): 91282CPU9"):]
    coupon_rate = Decimal(_search(r"(\d+(?:\.\d+)?)% coupon", example)) / 100
    frequency = int(_search(r"\(coupon_frequency (\d+)\)", example))
    settlement = date.fromisoformat(_search(r"Settlement (\d{4}-\d{2}-\d{2})", example))
    index_ratio = Decimal(_search(r"Index ratio (\d+(?:\.\d+)?)", example))
    accrual_start = date.fromisoformat(_search(r"Accrual start (\d{4}-\d{2}-\d{2})", example))
    period_end = date.fromisoformat(_search(r"Period end (\d{4}-\d{2}-\d{2})", example))
    days_accrued = int(_search(r"Days accrued: (\d+)", example))
    days_in_period = int(_search(r"Days in period: (\d+)", example))

    assert (coupon_rate, frequency, index_ratio) == (Decimal("0.01875"), 2, Decimal("1.03192"))
    assert (days_accrued, days_in_period) == (114, 184)
    assert (settlement - accrual_start).days == days_accrued
    assert (period_end - accrual_start).days == days_in_period

    accrued = (coupon_rate / frequency * days_accrued / days_in_period * index_ratio * 1000)
    assert accrued.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) == Decimal("5.99")
    assert "$5.99 per $1,000 face" in example


def test_lm459_proto_outside_accrued_interest_comment_unchanged():
    proto = _lm496_strip(_lm509_strip(MEASURE_PROTO.read_text()))
    outside = proto
    for name in ("ACCRUED_INTEREST",) + LM499_MEASURES + LM506_MEASURES:
        comment = _proto_comment(f"{name} = {measure_pb2.MeasureProto.Value(name)};")
        assert proto.count(comment) == 1, name
        outside = outside.replace(comment, "", 1)
    assert hashlib.sha256(outside.encode()).hexdigest() == LM459_PROTO_OUTSIDE_COMMENT_SHA256


# LM-496: REFERENCE_CPI and INDEX_RATIO state the 31 CFR 356 Appendix B rule
# for a CPI-U month that was never published (owner ruling of 26 Nov 2026:
# fallback index rounded to 3 decimals; Treasury announced 325.604 for
# 2025-10). Every phrase is asserted inside the added note only, since the
# citation and the published-month rounding already appear elsewhere in both
# comments and entries.
LM496_ANCHOR = "Unpublished CPI-U month (31 CFR 356 Appendix B)"
LM496_PHRASES = (
    "31 CFR 356 Appendix B",
    "CPI(last) x (CPI(last) / CPI(last - 12))^(k / 12)",
    "k is the months since the last reported month",
    "absent by the last day of the following month",
    "The fallback index is rounded to 3 decimals",
    "a warning naming the filled month",
    "missing formula input (e.g. CPI(last - 12))",
    "a month still inside its window is an error naming the month",
    "Callers must send CPI(last - 12) in MonthlyIndexReadings",
)
LM496_BULLET = re.compile(r"^  //   - Unpublished CPI-U month .*\n(?:  //     .*\n)*", re.MULTILINE)


def _collapse(comment):
    return " ".join(" ".join(line.strip().removeprefix("//") for line in comment.splitlines()).split())


def _lm496_proto_note(name):
    comment = _proto_comment(f"{name} = {measure_pb2.MeasureProto.Value(name)};")
    bullets = LM496_BULLET.findall(comment)
    assert len(bullets) == 1, name
    return _collapse(bullets[0])


def _lm496_catalog_note(catalog, name):
    entries = [m for m in catalog["measures"] if m["name"] == name]
    assert len(entries) == 1, name
    notes = [a for a in entries[0]["model_assumptions"] if LM496_ANCHOR in a]
    assert len(notes) == 1, name
    return notes[0]


# LM-509: the DV01_PER_MILLION value with its comment, and the two-line
# settlement_convention notes added after four settlement sentences.
LM509_DV01_PER_MILLION = re.compile(r"\n(?:  //.*\n)*  DV01_PER_MILLION = 31;\n")
LM509_SETTLEMENT_NOTE = re.compile(
    r"^ *// .*ValuationRequestProto\.settlement_convention.*\n *// .*\(LM-509\)\.\n", re.MULTILINE)


def _lm509_strip(proto):
    """measure.proto with the LM-509 additions cut out."""
    stripped, removed = LM509_DV01_PER_MILLION.subn("", proto)
    assert removed == 1, removed
    stripped, removed = LM509_SETTLEMENT_NOTE.subn("", stripped)
    assert removed == 4, removed
    return stripped


def _lm496_strip(proto):
    """measure.proto with the two LM-496 bullets cut out."""
    stripped, removed = LM496_BULLET.subn("", proto)
    assert removed == 2, removed
    return stripped


@pytest.mark.parametrize("name", LM496_MEASURES)
def test_lm496_proto_note_states_appendix_b_fallback(name):
    note = _lm496_proto_note(name)
    assert note.startswith("- " + LM496_ANCHOR)
    for phrase in LM496_PHRASES:
        assert phrase in note, (name, phrase)


@pytest.mark.parametrize("name", LM496_MEASURES)
@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_lm496_catalog_note_states_appendix_b_fallback(path, name):
    note = _lm496_catalog_note(json.loads(path.read_text()), name)
    assert note.startswith(LM496_ANCHOR)
    for phrase in LM496_PHRASES:
        assert phrase in note, (name, phrase)


def test_lm496_index_ratio_note_uses_reference_cpi_fallback():
    assert _lm496_proto_note("INDEX_RATIO").startswith(f"- {LM496_ANCHOR}: uses the REFERENCE_CPI fallback.")
    note = _lm496_catalog_note(json.loads(SOURCE.read_text()), "INDEX_RATIO")
    assert note.startswith(f"{LM496_ANCHOR}: uses the REFERENCE_CPI fallback.")


@pytest.mark.parametrize("path", (MEASURE_PROTO, *CATALOGS.values()), ids=("proto", *CATALOGS.keys()))
def test_lm496_no_precision_placeholder(path):
    assert "<N>" not in path.read_text()


def test_lm496_october_2025_example_recomputes_to_treasury_figure():
    notes = (_lm496_proto_note("REFERENCE_CPI"),
             _lm496_catalog_note(json.loads(SOURCE.read_text()), "REFERENCE_CPI"))
    for note in notes:
        example = note[note.index("Example: CPI-U for 2025-10 was never published."):]
        last = Decimal(_search(r"CPI\(2025-09\) = (\d+\.\d+)", example))
        year_before = Decimal(_search(r"CPI\(2024-09\) = (\d+\.\d+)", example))
        k = int(_search(r"k = (\d+)", example))
        stated = Decimal(_search(r"(\d+\.\d{3}), the figure Treasury announced", example))
        assert (last, year_before, k) == (Decimal("324.800"), Decimal("315.301"), 1)
        fallback = Decimal(float(last) * (float(last) / float(year_before)) ** (k / 12))
        assert fallback.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP) == stated == Decimal("325.604")


# LM-509: DV01_PER_MILLION (31) is appended to every catalog with units that
# match its proto comment, and stays implemented: false until valuation-service
# computes it. The DV01 (25) entry is unchanged.
LM509_DV01_BEFORE = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-509-dv01-before.json").read_text())
LM509_UNITS_PHRASES = ("per basis point", "1,000,000 face", "settlement currency")


@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_lm509_catalog_entry(path):
    measures = json.loads(path.read_text())["measures"]
    assert measures[-1]["name"] == "DV01_PER_MILLION"
    entry = measures[-1]
    dv01 = next(m for m in measures if m["name"] == "DV01")
    assert entry["enum_value"] == 31 == measure_pb2.MeasureProto.Value("DV01_PER_MILLION")
    assert entry["implemented"] is False
    assert (entry["category"], entry["computed_by"]) == ("risk", "valuation-service")
    assert entry["depends_on"] == ["MODIFIED_DURATION", "DIRTY_PRICE"]
    assert entry["applies_to"] == dv01["applies_to"]
    assert entry["model_assumptions"][0] == dv01["model_assumptions"][0]
    comment = " ".join(_proto_comment("DV01_PER_MILLION = 31;").replace("//", " ").split())
    for phrase in LM509_UNITS_PHRASES:
        assert phrase in entry["units"], phrase
        assert phrase in comment, phrase
    assert "read dollar as one unit of settlement currency" in entry["units"]
    assert dv01 == LM509_DV01_BEFORE["entry"]


def test_lm509_implemented_false_keeps_dv01_per_million_out_of_every_input_type():
    for input_type in INPUT_TYPES:
        assert measure_pb2.MeasureProto.DV01_PER_MILLION not in measures_for_input_type(input_type), input_type
