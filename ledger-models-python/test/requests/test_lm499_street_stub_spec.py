"""The street/SIFMA stub convention for fixed-coupon measures (LM-499).
YIELD_TO_MATURITY, MACAULAY_DURATION, CONVEXITY, MODIFIED_DURATION, DV01,
PRESENT_VALUE and PRESENT_VALUE_CASHFLOWS state w = DSC/E, flow k at k−1+w
periods and a yield solved against the dirty price (clean + ACT/ACT accrued),
in the catalog and in the MeasureProto comments. The coupon-date assumptions
are gone, the TIPS and FRN lines in these entries are unchanged, the price
input stays clean, and no proto field, enum value or number changes.

Entries and comments are found by name, never by line number.
"""
import hashlib
import json
import re
from decimal import Decimal
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE_PROTO = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"

SEVEN = ("YIELD_TO_MATURITY", "MACAULAY_DURATION", "CONVEXITY", "MODIFIED_DURATION", "DV01",
         "PRESENT_VALUE", "PRESENT_VALUE_CASHFLOWS")

# k−1+w uses U+2212 (minus sign), as in the issue.
STUB = ["w = DSC/E", "k−1+w periods", "dirty price (clean + ACT/ACT accrued)"]
CLEAN_INPUT = "The price input is the clean price"
MACAULAY_T = "t_k = (k−1+w)/f"
CONVEXITY_WEIGHT = "(k−1+w)(k+w)/(f²(1+y/f)²)"
DV01_FORMULA = "ModifiedDuration × dirty price × face × 0.0001"
PV_CLEAN = "price == PRESENT_VALUE for the clean input price"
PVC_INVARIANT = "sum(pv_amounts) == dirty price × face / 100"
REMOVED = ["settlement on a coupon date", "no accrued interest adjustment",
           "actual/365 for years-to-maturity", "integer period exponents"]
OLD_INVARIANT = ["three-way invariant", "price == present_value == sum", "sum(pv_amounts) == present_value"]

# TIPS and FRN wording in the seven entries, copied from main (54bc1942).
KEPT_CATALOG = {
    "YIELD_TO_MATURITY": [
        "For TIPS: returns the same value as REAL_YIELD, with the response summary warning \"YIELD_TO_MATURITY"
        " for TIPS is the real yield (same as REAL_YIELD); a nominal yield needs an inflation forecast\"",
    ],
    "CONVEXITY": [
        "For TIPS: y = REAL_YIELD and CF_t are the inflation-adjusted cash flows",
        "For FRN: uses flat-forwards effective YTM (same model as PRESENT_VALUE)",
    ],
    "MODIFIED_DURATION": ["For TIPS, ytm = REAL_YIELD (on the inflation-adjusted cash flows)"],
    "PRESENT_VALUE": [
        "For TIPS: inflation-adjusted cash flows discounted at REAL_YIELD, consistent with clean_price × index_ratio",
    ],
    "PRESENT_VALUE_CASHFLOWS": [
        "TIPS: ratio(t) = INDEX_RATIO at settlement x (1 + rate/100)^y, where rate = TipsInput.assumed_inflation_rate"
        " and y = days from settlement to t / 365 (ACT/365); without a rate, ratio(t) = today's INDEX_RATIO. Coupon"
        " = principal x ratio(t) x coupon rate per period. Principal at maturity = principal x max(ratio, 1), with"
        " ratio at maturity; this is the principal row's fv_amount. index_ratio reports the unfloored ratio(t)."
        " Discounting of pv_amount is unchanged; see VS-159.",
        "TIPS: constant assumed inflation from settlement to maturity, compounded annually on ACT/365. Deflation"
        " floor max(ratio, 1) on principal at maturity only",
        "TIPS without TipsInput.assumed_inflation_rate: every row uses today's INDEX_RATIO (unchanged behaviour)."
        " Unset is absent, never 0%",
    ],
}
KEPT_PROTO = {
    "YIELD_TO_MATURITY": [
        "For TIPS the left side is also scaled by index_ratio (see REAL_YIELD).",
        "For TIPS: returns the same value as REAL_YIELD (the real yield), and adds this warning to the response"
        " summary: \"YIELD_TO_MATURITY for TIPS is the real yield (same as REAL_YIELD); a nominal yield needs an"
        " inflation forecast\". There is no nominal TIPS yield without an inflation forecast.",
    ],
    "MACAULAY_DURATION": ["For TIPS, r = REAL_YIELD and cashflow_t is the inflation-adjusted cash flow."],
    "CONVEXITY": [
        "For TIPS: y = REAL_YIELD and CF_t are the inflation-adjusted cash flows.",
        "For FRN: uses flat-forwards effective YTM (same model as PRESENT_VALUE).",
    ],
    "MODIFIED_DURATION": ["For TIPS, ytm = REAL_YIELD (on the inflation-adjusted cash flows)."],
    "PRESENT_VALUE": [
        "For TIPS: the inflation-adjusted cash flows are discounted at REAL_YIELD, consistent with the scaled"
        " price clean_price × index_ratio (so the invariant reads clean_price × index_ratio == present_value).",
    ],
}

# sha256 of measure.proto with every `//` comment and blank line stripped,
# computed on main (54bc1942) before the LM-499 edit: no field, enum value or
# number may change.
PROTO_CODE_SHA256 = "7d7bdf6130a2b96ab3ac891a52b629a98a227eb4df2310a2bc668680d9612678"
# LM-514 reserves measure 31's number and name (the value LM-509 added and
# LM-514 removed); those two lines are the only code added since.
LM514_RESERVED = re.compile(r'^reserved (31|"[A-Z0-9_]+");$')


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the line that declares
    `declaration`, plus that line, as in the file."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1])


def _entry(name: str) -> dict:
    entries = [m for m in json.loads(CATALOG.read_text())["measures"] if m["name"] == name]
    assert len(entries) == 1, name
    return entries[0]


def _text(name: str) -> str:
    entry = _entry(name)
    return "\n".join([entry["formula"]] + entry["model_assumptions"])


def _comment(name: str) -> str:
    """The proto comment with each `//` prefix removed and whitespace collapsed."""
    lines = _block(MEASURE_PROTO, name).splitlines()
    return " ".join(" ".join(line.strip().removeprefix("//") for line in lines).split())


@pytest.mark.parametrize("name", SEVEN)
def test_each_entry_states_stub_and_dirty_price_solve(name):
    for text in (_text(name), _comment(name)):
        for phrase in STUB + [CLEAN_INPUT]:
            assert phrase in text, (name, phrase)


def test_yield_to_maturity_states_act_act_without_day_count_choice():
    for text in (_text("YIELD_TO_MATURITY"), _comment("YIELD_TO_MATURITY")):
        assert "Day count: ACT/ACT" in text
        assert "no day-count choice until LM-498" in text


def test_duration_convexity_dv01_formulas():
    for text in (_entry("MACAULAY_DURATION")["formula"], _comment("MACAULAY_DURATION")):
        assert MACAULAY_T in text
    for text in (_entry("CONVEXITY")["formula"], _comment("CONVEXITY")):
        assert CONVEXITY_WEIGHT in text
    for text in (_entry("DV01")["formula"], _comment("DV01")):
        assert DV01_FORMULA in text


def test_dv01_example_recomputes_to_stated_dollars():
    example = _comment("DV01")
    assert "For ModifiedDuration=5, dirty price 100.50 and face $1,000,000" in example
    dv01 = Decimal(5) * Decimal("100.50") / 100 * Decimal(1_000_000) * Decimal("0.0001")
    assert dv01 == Decimal("502.50")
    assert "5 × 1.005 × 1,000,000 × 0.0001 = $502.50 per bp" in example


@pytest.mark.parametrize("name", SEVEN)
def test_no_coupon_date_assumptions_remain(name):
    for text in (_text(name) + "\n" + _entry(name)["description"], _comment(name)):
        for phrase in REMOVED:
            assert phrase not in text.lower(), (name, phrase)


def test_present_value_and_cashflow_invariants():
    pv = _text("PRESENT_VALUE")
    pv_comment = _comment("PRESENT_VALUE")
    for text in (pv, pv_comment):
        assert "dirty PV minus accrued" in text
        assert "% of par" in text
        assert PV_CLEAN in text
    assert "sum(cashflow_pvs) == dirty price × face / 100" in pv
    assert "sum(cashflow_pvs) == dirty price × face / 100" in pv_comment
    for text in (_text("PRESENT_VALUE_CASHFLOWS"), _comment("PRESENT_VALUE_CASHFLOWS")):
        assert PVC_INVARIANT in text
    assert PV_CLEAN in _comment("PRESENT_VALUE_CASHFLOWS")


@pytest.mark.parametrize("name", ["PRESENT_VALUE", "PRESENT_VALUE_CASHFLOWS"])
def test_old_three_way_invariant_is_gone(name):
    for text in (_text(name), _comment(name)):
        for phrase in OLD_INVARIANT:
            assert phrase not in text.lower(), (name, phrase)


@pytest.mark.parametrize("name", sorted(set(KEPT_CATALOG) | set(KEPT_PROTO)))
def test_tips_and_frn_lines_are_unchanged(name):
    for phrase in KEPT_CATALOG.get(name, []):
        assert phrase in _text(name), (name, phrase)
    for phrase in KEPT_PROTO.get(name, []):
        assert phrase in _comment(name), (name, phrase)


def test_proto_code_outside_comments_is_unchanged():
    code = [line.split("//")[0].rstrip() for line in MEASURE_PROTO.read_text().splitlines()]
    # LM-514 adds exactly the two reserved lines; the rest of the code is unchanged.
    stripped = "\n".join(line for line in code if line.strip() and not LM514_RESERVED.match(line.strip()))
    assert hashlib.sha256(stripped.encode()).hexdigest() == PROTO_CODE_SHA256
    for name in SEVEN:
        assert f"{name} = {measure_pb2.MeasureProto.Value(name)};" in _block(MEASURE_PROTO, name)
