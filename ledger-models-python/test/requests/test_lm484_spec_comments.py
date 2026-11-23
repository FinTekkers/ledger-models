"""The proto comments are the spec (LM-484). Each rule is stated in the
comment above the declaration it documents: units per metric (SHARES_OUTSTANDING
a whole-number count of shares), as_of as knowledge time, absent meaning
unknown and never 0, latest on or before for GetLatest, and a correction
closing the old point through valid_to. The ADR compares the series design
with LM-482's per-point design.

Comments are found by the name they document, never by line number.
"""
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos" / "fintekkers"
METRIC_TYPE = PROTOS / "models" / "security" / "security_metric_type.proto"
METRIC = PROTOS / "models" / "security" / "security_metric.proto"
SERVICE = PROTOS / "services" / "security-metric-service" / "security_metric_service.proto"
GET_LATEST = PROTOS / "requests" / "security_metric" / "get_latest_security_metric_request.proto"
ADR = REPO_ROOT / "docs" / "adr" / "security_metric_series.md"


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the one line whose code (not
    comment) matches `declaration`, as lower-case prose."""
    lines = path.read_text().splitlines()
    pattern = re.compile(declaration)
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return " ".join(" ".join(lines[start:end]).replace("//", " ").split()).lower()


def _value(name: str) -> str:
    return _block(METRIC_TYPE, rf"^\s*{name}\s*=")


def _field(path: Path, name: str) -> str:
    return _block(path, rf"\s{name}\s*=\s*\d+;")


def _message(path: Path, name: str) -> str:
    return _block(path, rf"^message {name} \{{")


def _rpc(name: str) -> str:
    return _block(SERVICE, rf"^\s*rpc {name} \(")


RULES = [
    ("SHARES_OUTSTANDING is a whole-number count of shares", lambda: _value("SHARES_OUTSTANDING"),
     ["whole-number count of shares", "no fractional part"]),
    ("NAV_PER_SHARE units", lambda: _value("NAV_PER_SHARE"),
     ["units: currency per share", "in the security's currency"]),
    ("TOTAL_NET_ASSETS units", lambda: _value("TOTAL_NET_ASSETS"),
     ["units: a currency amount", "in the security's currency"]),
    ("the security's currency is named", lambda: _block(METRIC_TYPE, r"^enum SecurityMetricTypeProto \{"),
     ["securityproto.settlement_currency"]),
    ("as_of is knowledge time (series)", lambda: _field(METRIC, "as_of"), ["knowledge time"]),
    ("as_of is knowledge time (model)", lambda: _message(METRIC, "SecurityMetricSeriesProto"),
     ["as_of (on the series) is the knowledge time", "never an observation date"]),
    ("absent is unknown, never 0 (series)", lambda: _message(METRIC, "SecurityMetricSeriesProto"),
     ["absent means unknown, never 0", "a point whose value is 0 is a real, observed zero"]),
    ("absent is unknown, never 0 (point value)", lambda: _field(METRIC, "value"), ["never a 0"]),
    ("point carries no metadata", lambda: _message(METRIC, "SecurityMetricPointProto"),
     ["no uuid, version, as_of or source"]),
    ("GetLatest is latest on or before", lambda: _rpc("GetLatest"),
     ["latest observation_date on or before", "zero points, meaning unknown, never 0"]),
    ("GetLatest response is latest on or before", lambda: _field(GET_LATEST, "series"),
     ["latest observation_date on or before", "unknown, never 0"]),
    ("a correction closes the old point through valid_to", lambda: _rpc("CreateOrUpdate"),
     ["a correction", "setting its valid_to to the new as_of", "earlier as_of still returns the old value"]),
    ("the server stamps as_of", lambda: _rpc("CreateOrUpdate"), ["ignores the request's series.as_of"]),
    ("a zero-point create is invalid", lambda: _rpc("CreateOrUpdate"), ["invalid_argument", "zero points"]),
    ("the create response is the header only", lambda: _rpc("CreateOrUpdate"),
     ["the header only", "not echoed"]),
    ("Search chunks", lambda: _rpc("Search"),
     ["consecutive messages", "client appends", "every chunk has at least one point",
      "exactly one message with zero points"]),
]
CASES = [(name, block, phrase) for name, block, phrases in RULES for phrase in phrases]


@pytest.mark.parametrize("rule,block,phrase", CASES, ids=[f"{r}: {p}" for r, _, p in CASES])
def test_proto_comment_states_the_rule(rule, block, phrase):
    assert phrase in block(), rule


def test_adr_compares_the_series_and_per_point_designs():
    text = ADR.read_text()
    assert "LM-482" in text
    lower = text.lower()
    assert "per-point" in lower
    assert "series" in lower
    assert "valid_to" in lower
    assert "knowledge time" in lower
