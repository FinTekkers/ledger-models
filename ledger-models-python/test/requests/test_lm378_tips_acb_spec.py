"""The TIPS spec for ADJUSTED_COST_BASIS (LM-378). The measure.proto comment and
the catalog entry both state the TIPS formula, real_acb_i, the accrual start,
the CPI the valuation date needs, the rounding and the units. Neither asks for
a settlement date or for CPI readings beyond m-3 and m-2. The
UNADJUSTED_COST_BASIS comment and catalog entry are unchanged. LM-405 amended
the rounding (31 CFR 356 Appendix B) and INDEX_RATIO and REFERENCE_CPI; see
test_lm405_tips_pnl_spec.py.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"
# Snapshot from main before LM-378. A missing file fails at import: never skipped.
UNCHANGED = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-378-unchanged.json").read_text())

# Each phrase must appear in both the proto comment and the catalog entry
# (lower case, whitespace collapsed).
PHRASES = [
    "sum(open_quantity_i * real_acb_i) / sum(open_quantity_i)",
    "indexratio(valuation date)",
    "real_acb_i",
    "taxlotproto.price",
    "constant yield on real principal",
    "open_date plus the product's settlement lag",
    "m-3 and m-2",
    "extra lot months there serve profit_loss and are ignored here",
    "rounding: the index ratio is index_ratio, rounded to 5 decimals per 31 cfr 356 appendix b",
    "never to the basis",
    "per 100 original face, in nominal dollars",
]
BANNED = ["settlement date", "settlement_date", "m-1", "m-4", "cpi reading for each lot"]
EXAMPLE = "(10000*99.00 + 5000*101.50) / 15000 * 1.2 = 119.80"
# LM-405 amended these (Appendix B rounding, lot-month readings); the baseline
# keeps them as history.
AMENDED = {"INDEX_RATIO", "REFERENCE_CPI"}


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


def _entries() -> dict:
    return {m["name"]: m for m in json.loads(CATALOG.read_text())["measures"]}


ENTRY = _entries()["ADJUSTED_COST_BASIS"]
TEXTS = {
    "proto": _prose(_block(MEASURE, "ADJUSTED_COST_BASIS")),
    "catalog": _prose(" ".join(
        [ENTRY["description"], ENTRY["formula"], ENTRY["units"]] + ENTRY["model_assumptions"])),
}


@pytest.mark.parametrize("source", TEXTS)
@pytest.mark.parametrize("phrase", PHRASES)
def test_tips_spec_phrase_is_stated(source, phrase):
    assert phrase in TEXTS[source]


@pytest.mark.parametrize("source", TEXTS)
@pytest.mark.parametrize("phrase", BANNED)
def test_tips_spec_asks_for_no_settlement_date_or_extra_cpi(source, phrase):
    assert phrase not in TEXTS[source]


@pytest.mark.parametrize("source", TEXTS)
def test_worked_example_is_stated(source):
    assert EXAMPLE in TEXTS[source]


@pytest.mark.parametrize("name", [n for n in UNCHANGED["measure_proto_comments"] if n not in AMENDED])
def test_proto_comment_is_unchanged(name):
    assert _block(MEASURE, name) == UNCHANGED["measure_proto_comments"][name]


@pytest.mark.parametrize("name", [n for n in UNCHANGED["catalog"] if n not in AMENDED])
def test_catalog_entry_is_unchanged(name):
    # LM-403 added computed_by and depends_on; every key in the baseline stays as it was.
    baseline = UNCHANGED["catalog"][name]
    entry = _entries()[name]
    assert set(entry) - set(baseline) <= {"computed_by", "depends_on"}
    assert {key: entry.get(key) for key in baseline} == baseline


def test_baseline_covers_the_three_measures():
    expected = ["UNADJUSTED_COST_BASIS", "INDEX_RATIO", "REFERENCE_CPI"]
    assert list(UNCHANGED["measure_proto_comments"]) == expected
    assert list(UNCHANGED["catalog"]) == expected
