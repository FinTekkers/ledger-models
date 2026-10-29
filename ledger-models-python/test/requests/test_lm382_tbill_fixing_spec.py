"""The T-bill fixing spec (LM-382). For T_BILL_13_WEEK, ReferenceRateFixingProto.rate
is the auction's high discount rate as Treasury publishes it (percent per annum,
bank-discount basis) and valuation-service converts it. SOFR's wording is the
LM-412 one (published percent). The bill_maturity_date and IssuanceProto.auction_date comments say what
each date is, and the DISCOUNT_MARGIN catalog entry states the same unit.

Comments are found by the message and field they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos"
PRODUCT_INPUTS = PROTOS / "fintekkers" / "requests" / "valuation" / "product_inputs.proto"
ISSUANCE = PROTOS / "fintekkers" / "models" / "security" / "bond" / "issuance.proto"
CATALOG = PROTOS / "catalog" / "measures.json"


def _message(path: Path, name: str) -> list:
    """The lines of `message name { ... }` in path, up to its closing brace."""
    lines = path.read_text().splitlines()
    starts = [i for i, line in enumerate(lines) if re.match(rf"message {name}\s*\{{", line)]
    assert len(starts) == 1, f"message {name} in {path.name}: {starts}"
    end = next(i for i in range(starts[0], len(lines)) if lines[i].startswith("}"))
    return lines[starts[0]:end + 1]


def _field(lines: list, field: str) -> int:
    pattern = re.compile(rf"\s{re.escape(field)}\s*=\s*\d+;")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{field}: {matches}"
    return matches[0]


def _line_comment(path: Path, message: str, field: str) -> str:
    """The `//` comment lines directly above `field` in `message`."""
    lines = _message(path, message)
    end = start = _field(lines, field)
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end])


def _block_comment(path: Path, message: str, field: str) -> str:
    """The `/** ... */` comment directly above `field` in `message`."""
    lines = _message(path, message)
    end = _field(lines, field)
    assert lines[end - 1].strip() == "*/", field
    start = end - 1
    while not lines[start].strip().startswith("/**"):
        start -= 1
    return "\n".join(lines[start:end])


def _prose(text: str) -> str:
    """Comment markers dropped, whitespace collapsed."""
    for marker in ("/**", "*/", "//"):
        text = text.replace(marker, " ")
    return " ".join(text.split())


RATE = _prose(_line_comment(PRODUCT_INPUTS, "ReferenceRateFixingProto", "rate"))
BILL_MATURITY_DATE = _prose(_line_comment(PRODUCT_INPUTS, "ReferenceRateFixingProto", "bill_maturity_date"))
AUCTION_DATE = _prose(_block_comment(ISSUANCE, "IssuanceProto", "auction_date"))
DISCOUNT_MARGIN = next(m for m in json.loads(CATALOG.read_text())["measures"] if m["name"] == "DISCOUNT_MARGIN")
CATALOG_LINES = [line for line in DISCOUNT_MARGIN["model_assumptions"] if "T_BILL_13_WEEK" in line]

# SOFR's LM-365 decimal-fraction sentences were superseded by the LM-412 owner
# ruling (29 Oct): SOFR is the published percent. These open the comment.
SOFR_SENTENCES = ("The index rate exactly as its source publishes it, in percent per annum. "
                  "SOFR: the rate as the New York Fed publishes it: 4.32 = 4.32%.")

RATE_PHRASES = [
    "T_BILL_13_WEEK",
    "high discount rate as Treasury publishes it",
    "percent per annum",
    "bank-discount basis",
    "4.215 = 4.215%",
    "IssuanceProto.high_discount_rate",
    "valuation-service converts it",
    "bill_maturity_date",
]
OLD_RATE_WORDING = [
    "It is not the bank-discount rate",
    "auction high rate converted to a money-market yield",
]


@pytest.mark.parametrize("phrase", RATE_PHRASES)
def test_rate_comment_states_the_published_unit(phrase):
    assert phrase in RATE


def test_rate_comment_keeps_the_sofr_sentences_verbatim():
    assert RATE.startswith(SOFR_SENTENCES)


@pytest.mark.parametrize("phrase", OLD_RATE_WORDING)
def test_rate_comment_drops_the_money_market_yield_unit(phrase):
    assert phrase not in RATE


@pytest.mark.parametrize("phrase", ["T_BILL_13_WEEK", "maturity date of the bill", "Unset for SOFR"])
def test_bill_maturity_date_comment(phrase):
    assert phrase in BILL_MATURITY_DATE


@pytest.mark.parametrize("phrase", ["date the auction was held", "auction_issue_date", "auction_announcement_date"])
def test_auction_date_comment(phrase):
    assert phrase in AUCTION_DATE


def test_auction_date_is_not_the_issue_date():
    assert "Not the issue date (auction_issue_date)" in AUCTION_DATE


def test_discount_margin_catalog_states_the_published_unit():
    assert len(CATALOG_LINES) == 1
    line = CATALOG_LINES[0]
    for phrase in ["percent per annum", "bank-discount basis", "4.215 = 4.215%",
                   "IssuanceProto.high_discount_rate", "valuation-service converts it",
                   "bill_maturity_date", "SOFR fixings are the rate as the New York Fed publishes it"]:
        assert phrase in line, phrase
