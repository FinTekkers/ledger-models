"""The LM-412 spec text. ReferenceRateFixingProto.rate carries SOFR as published,
in percent (4.32 = 4.32%), per the owner ruling of 29 Oct; the ADR amendment
records it and supersedes the LM-382 "SOFR is unchanged" line; the
PERCENTAGE and INDEX_LEVEL price types keep their meanings.

Comments are found by the message and field they document, never by line number.
"""
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos" / "fintekkers"
PRODUCT_INPUTS = PROTOS / "requests" / "valuation" / "product_inputs.proto"
PRICE_TYPE = PROTOS / "models" / "price" / "price_type.proto"
ADR = REPO_ROOT / "docs" / "adr" / "frn_reference_rate_fixings.md"
UNITS_ADR = REPO_ROOT / "docs" / "adr" / "valuation_input_units.md"
HEADING = "## Amendment 2026-10-29 (LM-412)"


def _rate_comment() -> list:
    """The `//` comment lines directly above ReferenceRateFixingProto.rate."""
    lines = PRODUCT_INPUTS.read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if re.match(r"message ReferenceRateFixingProto\s*\{", line))
    end = next(i for i in range(start, len(lines)) if re.search(r"\srate\s*=\s*3;", lines[i]))
    first = end
    while lines[first - 1].strip().startswith("//"):
        first -= 1
    return [line.strip().lstrip("/").strip() for line in lines[first:end]]


def _adr_amendment() -> str:
    text = ADR.read_text()
    assert text.count(HEADING) == 1
    rest = text.split(HEADING, 1)[1]
    return rest.split("\n## ", 1)[0]


RATE = _rate_comment()
AMENDMENT = _adr_amendment()


def test_rate_comment_states_sofr_in_published_percent():
    sofr = [line for line in RATE if line.startswith("SOFR:")]
    assert len(sofr) == 1
    assert "4.32 = 4.32%" in sofr[0]
    assert "New York Fed publishes it" in sofr[0]


@pytest.mark.parametrize("phrase", ["as a decimal fraction: 0.0432", "Not a percentage", "0.0432"])
def test_rate_comment_drops_the_sofr_decimal_fraction(phrase):
    assert phrase not in " ".join(RATE)


@pytest.mark.parametrize("phrase", ["supersedes", "SOFR is unchanged", "`4.32` = 4.32%", "PriceTypeProto.RATE",
                                    "ProductTypeProto.T_BILL_13_WEEK_SERIES", "valuation-service converts"])
def test_adr_amendment(phrase):
    assert phrase in AMENDMENT


def test_adr_amendment_is_accepted_with_the_ruling():
    """Percent wording in the proto ships only with the owner ruling recorded."""
    status = AMENDMENT.split("### Status", 1)[1].split("###", 1)[0].strip()
    assert status.startswith("Accepted")
    assert "owner ruling" in status
    assert "https://github.com/FinTekkers/ledger-models/issues/412" in status


def test_units_adr_restates_l7_for_sofr():
    amendment = UNITS_ADR.read_text().split(HEADING, 1)[1]
    row = next(line for line in amendment.splitlines() if line.startswith("| L7 |"))
    assert "4.32` = 4.32%" in row
    assert "decimal fraction**" not in row


@pytest.mark.parametrize("line", [
    "PERCENTAGE = 2; //Price as a percentage (e.g. bond prices quoted as % of par)",
    "INDEX_LEVEL = 4; //Index level (e.g. CPI readings)",
])
def test_existing_price_type_meanings_are_unchanged(line):
    assert line in [raw.strip() for raw in PRICE_TYPE.read_text().splitlines()]


def test_rate_price_type_points_to_the_fixing_unit():
    rate = [raw.strip() for raw in PRICE_TYPE.read_text().splitlines() if raw.strip().startswith("RATE = 5;")]
    assert len(rate) == 1
    assert "ReferenceRateFixingProto.rate" in rate[0]
