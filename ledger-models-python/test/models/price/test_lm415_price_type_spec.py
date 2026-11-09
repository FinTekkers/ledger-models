"""The LM-415 spec text. RATE stays, is not deprecated and keeps number 5; its
comment states percent per annum (4.32 = 4.32%). PERCENTAGE is a % of par price
(99.75 = 99.75% of par). The ADR amendment records that a rate never shares a
price type with a price, and leaves the LM-412 amendment untouched.

Comments are found by the enum value they document, never by line number.
"""
import hashlib
import re
from pathlib import Path

import pytest

from fintekkers.models.price.price_type_pb2 import PriceTypeProto

REPO_ROOT = Path(__file__).resolve().parents[4]
PRICE_TYPE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "price" / "price_type.proto"
ADR = REPO_ROOT / "docs" / "adr" / "frn_reference_rate_fixings.md"
HEADING_PREFIX = "## Amendment "
LM415 = "(LM-415): a rate never shares a price type with a price"
LM412_HEADING = "## Amendment 2026-10-29 (LM-412)"
# sha256 of the LM-412 amendment body as merged; ADR amendments are append-only.
LM412_SHA256 = "f99938d2ec6694b70bb3d1d3ac3079b3fe3f287dd78d1ef4a9e2baeefb0d5f59"


def _lines_starting(prefix: str) -> list:
    return [raw.strip() for raw in PRICE_TYPE.read_text().splitlines() if raw.strip().startswith(prefix)]


def _section(text: str, heading: str) -> str:
    return text.split(heading, 1)[1].split("\n## ", 1)[0]


def _lm415_heading() -> str:
    headings = [line for line in ADR.read_text().splitlines() if line.startswith(HEADING_PREFIX) and line.endswith(LM415)]
    assert len(headings) == 1
    return headings[0]


def test_rate_is_not_deprecated_and_keeps_5():
    rate = PriceTypeProto.DESCRIPTOR.values_by_name["RATE"]
    assert rate.number == 5
    assert PriceTypeProto.DESCRIPTOR.values_by_number[5].name == "RATE"
    assert rate.GetOptions().deprecated is False


@pytest.mark.parametrize("prefix", ["PERCENTAGE = 2;", "RATE = 5;"])
def test_price_type_comment_is_on_one_line(prefix):
    assert len(_lines_starting(prefix)) == 1


@pytest.mark.parametrize("phrase", ["per annum", "4.32 = 4.32%"])
def test_rate_comment_states_percent_per_annum(phrase):
    assert phrase in _lines_starting("RATE = 5;")[0]


def test_percentage_comment_states_percent_of_par():
    assert "99.75 = 99.75% of par" in _lines_starting("PERCENTAGE = 2;")[0]


def test_adr_lm415_amendment_is_accepted():
    heading = _lm415_heading()
    assert re.fullmatch(r"## Amendment \d{4}-\d{2}-\d{2} " + re.escape(LM415), heading)
    amendment = _section(ADR.read_text(), heading)
    status = amendment.split("### Status", 1)[1].split("###", 1)[0].strip()
    assert status.startswith("Accepted")
    assert "https://github.com/FinTekkers/ledger-models/issues/415" in status
    assert "A rate never shares a value with a price." in amendment


def test_adr_lm412_amendment_is_unchanged():
    text = ADR.read_text()
    assert text.count(LM412_HEADING) == 1
    lm412 = _section(text, LM412_HEADING)
    assert "`INDEX_LEVEL` (CPI readings) and `PERCENTAGE` (bond prices as % of par) keep their meanings." in lm412
    assert hashlib.sha256(lm412.encode()).hexdigest() == LM412_SHA256
