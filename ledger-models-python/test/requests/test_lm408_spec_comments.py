"""The proto comments are the spec (LM-408). The unit_price and clean_price
comments give their units, the MbsInput comment states G8, the bond and frn
comments name their coupon types, and the product_input (70) comment no longer
says "flat fallback". The ADR exists, names all six arms and links
valuation_input_units.md. No LM-376 wording placeholder remains.

Comments are found by the name they document, never by line number.
"""
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos"
PRODUCT_INPUTS = PROTOS / "fintekkers" / "requests" / "valuation" / "product_inputs.proto"
ADR = REPO_ROOT / "docs" / "adr" / "product_input_engine_arms.md"
PLACEHOLDER = "<wording from LM-376>"
G8 = ("mortgage_backed is valued as a bullet fixed-rate bond (no amortisation or prepayment), "
      "because it descends from bond.")


def _lines() -> list:
    return PRODUCT_INPUTS.read_text().splitlines()


def _field_block(message: str, declaration: str) -> str:
    """The `//` comment lines directly above `declaration` inside `message`,
    plus that line."""
    lines = _lines()
    begin = next(i for i, line in enumerate(lines) if re.match(rf"message {message}\s*\{{", line))
    end = next(i for i in range(begin, len(lines)) if lines[i].startswith("}"))
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i in range(begin, end) if pattern.search(lines[i].split("//")[0])]
    assert len(matches) == 1, f"{message}.{declaration}: {matches}"
    start = matches[0]
    while lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:matches[0] + 1])


def _message_header(message: str) -> str:
    """The `//` comment lines directly above `message <name> {`."""
    lines = _lines()
    end = next(i for i, line in enumerate(lines) if re.match(rf"message {message}\s*\{{", line))
    start = end
    while lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end])


def _prose(text: str) -> str:
    """Comment markers dropped, whitespace collapsed, lower case."""
    return " ".join(text.replace("//", " ").split()).lower()


def test_equity_unit_price_is_per_share():
    assert "per share" in _prose(_field_block("EquityInput", "unit_price"))


def test_cash_unit_price_is_nav_per_unit():
    assert "nav per unit" in _prose(_field_block("CashInput", "unit_price"))


def test_mbs_clean_price_is_percent_of_current_face():
    text = _prose(_field_block("MbsInput", "clean_price"))
    assert "% of current face" in text
    assert "not the original face" in text


def test_mbs_comment_states_g8():
    text = _prose(_message_header("MbsInput"))
    assert "g8" in text
    assert "vs-71" in text
    assert G8 in text
    assert "still uses the bond engine" in text
    assert "numbers are unchanged until a real mbs engine replaces it" in text


def test_mbs_comment_keeps_10_to_19_free():
    assert "fields 10-19 are kept free" in _prose(_message_header("MbsInput"))


def test_bond_arm_names_fixed():
    assert "coupon_type FIXED" in _field_block("ProductInput", "bond")


def test_frn_arm_names_float():
    assert "coupon_type FLOAT" in _field_block("ProductInput", "frn")


def test_no_flat_fallback_in_the_protos():
    hits = [str(p.relative_to(REPO_ROOT)) for p in PROTOS.rglob("*.proto") if "flat fallback" in p.read_text().lower()]
    assert hits == []


@pytest.mark.parametrize("path", [PRODUCT_INPUTS, ADR], ids=["proto", "adr"])
def test_no_lm376_placeholder(path):
    assert PLACEHOLDER not in path.read_text()


def test_adr_exists_and_names_all_six_arms():
    text = ADR.read_text()
    for arm in ("bond", "tips", "frn", "mbs", "equity", "cash"):
        assert f"`{arm}`" in text, arm


def test_adr_links_valuation_input_units():
    assert "(valuation_input_units.md)" in ADR.read_text()


def test_adr_states_g8():
    text = _prose(ADR.read_text()).replace("`", "")
    assert "g8" in text and "vs-71" in text
    assert G8 in text
