"""The Treasury FRN spec for ADJUSTED_COST_BASIS (LM-383). The measure.proto
comment and the catalog entry both state the per-lot rule, the coupon from the
fixing in effect at the lot's accrual start plus the spread, the OID fixing,
resets, the money-market yield conversion with its 360-day basis and day-count
start, missing data and other indices. The inputs are the existing
FrnInput.cost_basis and FrnInput.fixings: no new fields. Every line of the
comment and every catalog model assumption from before LM-383 stays, in order.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
PRODUCT_INPUTS = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "requests" / "valuation" / "product_inputs.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"
# Snapshot from main before LM-383. A missing file fails at import: never skipped.
BEFORE = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-383-acb-before.json").read_text())

# One or more phrases per rule; each must appear in both the proto comment and
# the catalog entry (lower case, whitespace collapsed).
RULES = {
    "index": ["treasury frn", "t_bill_13_week"],
    "inputs": ["frninput.cost_basis", "frninput.fixings"],
    "per lot": ["equivalent fixed-rate instrument",
                "same constant-yield, elections and de minimis rules as the fixed-rate bonds"],
    "coupon": ["coupon_i = mmy(fixing_i) + spread / 10000",
               "fixing in effect at the lot's accrual start",
               "latest fixing_date on or before it",
               "frn_extension.spread, in basis points"],
    "oid": ["fixing in effect on bond_details.issue_date"],
    "resets": ["later coupon resets do not change a lot's schedule"],
    "conversion": ["published high discount rate in percent", "money-market yield",
                   "360-day basis", "mmy = 360 * d / (360 - d * t)", "d = rate / 100",
                   "t = bill_maturity_date - bill_issue_date, in days",
                   "a reopened bill counts from the reopening"],
    "example": ["mmy = 360 * 0.04215 / (360 - 0.04215 * 91) = 0.042604"],
    "missing data": ["no fixing on or before a needed date", "makes the request invalid"],
    "other indices": ["sofr", "not defined yet"],
}
PHRASES = [(rule, phrase) for rule, phrases in RULES.items() for phrase in phrases]
# test_lm378_tips_acb_spec.py rejects these in the whole ADJUSTED_COST_BASIS text.
BANNED = ["settlement date", "settlement_date", "m-1", "m-4"]
# LM-405 replaced these TIPS lines (lot months, Appendix B rounding); the
# snapshot keeps them as history.
SUPERSEDED = {
    "  //     readings in TipsInput.cpi. Lot dates need no CPI readings.",
    "  //   Rounding: none. real_acb_i, the weighted average, the index ratio and",
    "  //     the result are all unrounded, as for INDEX_RATIO and MARKET_VALUE.",
    "TIPS CPI: only the m-3 and m-2 readings for the valuation date in TipsInput.cpi; lot dates need no CPI readings",
    "TIPS rounding: none. real_acb_i, the weighted average, the index ratio and the result are all unrounded, "
    "as for INDEX_RATIO and MARKET_VALUE",
}


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


def _prose(text: str) -> str:
    """Comment markers dropped, whitespace collapsed, lower case."""
    return " ".join(text.replace("//", " ").split()).lower()


def _entry() -> dict:
    return next(m for m in json.loads(CATALOG.read_text())["measures"] if m["name"] == "ADJUSTED_COST_BASIS")


BLOCK = _block(MEASURE, "ADJUSTED_COST_BASIS")
ENTRY = _entry()
TEXTS = {
    "proto": _prose(BLOCK),
    "catalog": _prose(" ".join(
        [ENTRY["description"], ENTRY["formula"], ENTRY["units"]] + ENTRY["model_assumptions"])),
}


@pytest.mark.parametrize("source", TEXTS)
@pytest.mark.parametrize("rule,phrase", PHRASES, ids=[f"{r}: {p}" for r, p in PHRASES])
def test_frn_spec_phrase_is_stated(source, rule, phrase):
    assert phrase in TEXTS[source], rule


@pytest.mark.parametrize("source", TEXTS)
@pytest.mark.parametrize("phrase", BANNED)
def test_frn_spec_asks_for_no_settlement_date(source, phrase):
    assert phrase not in TEXTS[source]


def _in_order(old: list, new: list) -> bool:
    """Every item of `old` appears in `new`, in the same order."""
    rest = iter(new)
    return all(item in rest for item in old)


def _kept(lines: list) -> list:
    return [line for line in lines if line not in SUPERSEDED]


def test_original_proto_comment_lines_are_kept_in_order():
    assert _in_order(_kept(BEFORE["measure_proto_comment_lines"]), BLOCK.splitlines())


def test_original_catalog_model_assumptions_are_kept_in_order():
    assert _in_order(_kept(BEFORE["catalog"]["model_assumptions"]), ENTRY["model_assumptions"])


def test_superseded_lines_are_in_the_snapshot():
    assert SUPERSEDED <= set(BEFORE["measure_proto_comment_lines"]) | set(BEFORE["catalog"]["model_assumptions"])


@pytest.mark.parametrize("key", ["description", "formula", "units"])
def test_catalog_description_formula_and_units_are_unchanged(key):
    assert ENTRY[key] == BEFORE["catalog"][key]


def test_fixing_rate_comment_keeps_the_published_rate_unit():
    """The conversion is valuation-service's job: rate stays the published
    high discount rate in percent (LM-382)."""
    message = re.search(r"^message ReferenceRateFixingProto \{\n(.*?)^\}", PRODUCT_INPUTS.read_text(),
                        re.MULTILINE | re.DOTALL)
    assert message, "ReferenceRateFixingProto in product_inputs.proto"
    rate = _prose(message.group(1).split("bill_maturity_date = 4")[0].split("fixing_date = 2;")[1])
    assert "high discount rate as treasury publishes it, in percent" in rate
    assert "valuation-service converts it to the money-market yield" in rate
