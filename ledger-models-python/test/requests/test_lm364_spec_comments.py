"""The proto comments are the spec (LM-364). ADJUSTED_COST_BASIS is written
down, effective_from applies to "lots purchased on or after", a TIPS lot price
is the real (unadjusted) price, and the UNADJUSTED_COST_BASIS and PROFIT_LOSS
comments are unchanged.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos" / "fintekkers"
MEASURE = PROTOS / "models" / "position" / "measure.proto"
ELECTIONS = PROTOS / "models" / "portfolio" / "amortisation_elections.proto"
PRODUCT_INPUTS = PROTOS / "requests" / "valuation" / "product_inputs.proto"
UNCHANGED = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())


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


def _text(block: str) -> str:
    """The comment as prose: markers dropped, whitespace collapsed, lower case."""
    return " ".join(block.replace("//", " ").split()).lower()


def test_adjusted_cost_basis_is_specified():
    spec = _text(_block(MEASURE, "ADJUSTED_COST_BASIS"))
    assert "reserved" not in spec
    for phrase in ("tax amortised cost", "constant yield", "per 100 face",
                   "quantity-weighted across open lots", "settlement_date",
                   "real (unadjusted) price", "index_ratio", "nominal",
                   "absent, never 0, when there are no open lots", "no open lots"):
        assert phrase in spec, phrase
    applicability = re.search(r"applicability: ([^.]*)\.", spec).group(1)
    assert "equity" not in applicability


def test_effective_from_applies_to_lots_purchased_on_or_after():
    assert "lots purchased on or after" in _text(_block(ELECTIONS, "effective_from"))


def test_tax_lot_price_is_the_real_unadjusted_price_for_tips():
    assert "tips: the real (unadjusted) price" in _text(_block(PRODUCT_INPUTS, "price"))


@pytest.mark.parametrize("name", UNCHANGED["measure_proto_comments"])
def test_unadjusted_cost_basis_and_profit_loss_comments_are_unchanged(name):
    assert _block(MEASURE, name) == UNCHANGED["measure_proto_comments"][name]
