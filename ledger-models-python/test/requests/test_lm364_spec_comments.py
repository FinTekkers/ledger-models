"""The proto comments are the spec (LM-364). The ADJUSTED_COST_BASIS comment in
measure.proto and its catalog entry both state every rule: what it is, OID,
premium, market discount, de minimis, accrual start, TIPS, FRN, no lots and
scope, plus its units and the seven product types it applies to. The
UNADJUSTED_COST_BASIS comment is unchanged. The PROFIT_LOSS comment keeps every
original line, in order; LM-405 added its TIPS paragraph.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"
UNCHANGED = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())

# One or more phrases per Outcome 4 rule; each must appear in both the proto
# comment and the catalog entry (lower case, whitespace collapsed).
RULES = {
    "what it is": ["tax amortised cost", "per 100 face", "quantity-weighted over the open lots"],
    "oid": ["oid: always accreted (mandatory, whatever the elections) at constant yield",
            "issuanceproto.price_for_single_price_auction", "mdi-82", "reduced by any acquisition premium"],
    "premium": ["premium (irc §171): amortised at constant yield if elected"],
    "market discount": ["market discount: accreted only with include_currently",
                        "ratably or at constant yield per market_discount_accrual",
                        "left until disposition"],
    "de minimis": ["oid and market discount below 0.25% × complete years to maturity are treated as zero"],
    "accrual start": ["from each lot's open_date plus the product's settlement lag", "t+1 for treasuries"],
    "tips": ["amortise in real terms, then multiply by the index ratio", "at the valuation date",
             "per 100 original face in nominal dollars"],
    "frn": ["frn: use the equivalent fixed rate from the fixing at settlement"],
    "no lots": ["the measure is absent", "\"no open lots\" warning", "never 0"],
    "scope": ["tax basis only"],
}
PHRASES = [(rule, phrase) for rule, phrases in RULES.items() for phrase in phrases]
APPLIES_TO = ["TREASURY_NOTE", "TREASURY_BOND", "SOVEREIGN_BOND", "CORP_BOND", "MUNI_BOND", "TIPS", "TREASURY_FRN"]


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


SPEC = _prose(_block(MEASURE, "ADJUSTED_COST_BASIS"))
ENTRY = _entry()
CATALOG_TEXT = _prose(" ".join(
    [ENTRY["description"], ENTRY["formula"], ENTRY["units"]] + ENTRY["model_assumptions"]))


@pytest.mark.parametrize("rule,phrase", PHRASES, ids=[f"{r}: {p}" for r, p in PHRASES])
def test_proto_comment_states_the_rule(rule, phrase):
    assert phrase in SPEC, rule


@pytest.mark.parametrize("rule,phrase", PHRASES, ids=[f"{r}: {p}" for r, p in PHRASES])
def test_catalog_entry_states_the_rule(rule, phrase):
    assert phrase in CATALOG_TEXT, rule


def test_proto_comment_is_no_longer_reserved():
    assert "reserved" not in SPEC
    assert "not currently implemented" not in SPEC


def test_proto_comment_applies_to_the_seven_product_types():
    applicability = re.search(r"applicability: (.*?)\. units:", SPEC).group(1)
    assert [t.strip() for t in applicability.split(",")] == [t.lower() for t in APPLIES_TO]


def test_catalog_entry_applies_to_the_seven_product_types():
    assert ENTRY["enum_value"] == 4
    assert "reserved" not in ENTRY["description"].lower()
    assert ENTRY["applies_to"] == APPLIES_TO
    assert ENTRY["implemented"] is False


def test_units_are_per_100_face_and_per_100_original_face_for_tips():
    for text in (SPEC, _prose(ENTRY["units"])):
        assert "per 100 face (% of par)" in text
        assert "tips: per 100 original face, in nominal dollars" in text


def test_unadjusted_cost_basis_comment_is_unchanged():
    name = "UNADJUSTED_COST_BASIS"
    assert _block(MEASURE, name) == UNCHANGED["measure_proto_comments"][name]


def test_profit_loss_comment_keeps_its_original_lines_in_order():
    rest = iter(_block(MEASURE, "PROFIT_LOSS").splitlines())
    assert all(line in rest for line in UNCHANGED["measure_proto_comments"]["PROFIT_LOSS"].splitlines())


def test_baseline_covers_unadjusted_cost_basis_and_profit_loss():
    assert list(UNCHANGED["measure_proto_comments"]) == ["UNADJUSTED_COST_BASIS", "PROFIT_LOSS"]
