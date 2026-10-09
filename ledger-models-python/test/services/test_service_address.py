"""LM-287: the Python service-address lookup resolves every case in the
shared fixture exactly as Java ``ServiceAddress`` and Rust
``service_address.rs`` do. No cases are written here; they all come from the
fixture."""

import json
from pathlib import Path

import pytest

from fintekkers.wrappers.services.util.service_address import (
    BROKER_PORT,
    LEDGER_PORT,
    PRICE_PORT,
    VALUATION_PORT,
    Endpoint,
    Service,
    resolve,
)

FIXTURE = Path(__file__).resolve().parents[3] / "test-fixtures" / "service-address-cases.json"


def _fixture():
    return json.loads(FIXTURE.read_text())


def _rows():
    for case in _fixture()["cases"]:
        for service in case["services"]:
            yield pytest.param(case, service, id=f"{case['name']} [{service}]")


@pytest.mark.parametrize("case,service_name", list(_rows()))
def test_resolves_as_the_shared_fixture_says(case, service_name):
    service = Service[service_name]
    if "error" in case:
        with pytest.raises(ValueError, match=case["error"]):
            resolve(service, case["env"])
        return
    expected = case["expected"]
    endpoint = resolve(service, case["env"])
    assert endpoint == Endpoint(expected["host"], expected["port"], expected["plaintext"])
    assert endpoint.target == f"{expected['host']}:{expected['port']}"


def test_fixture_has_cases_covering_every_step():
    cases = _fixture()["cases"]
    # 30 cases expanding to 55 (case, service) checks; an emptied or
    # truncated fixture must not pass silently.
    assert len(cases) >= 30
    assert len(list(_rows())) >= 55
    assert {c["step"] for c in cases} == {"a", "b", "c", "d"}
    for c in cases:
        assert c["services"]
        assert ("expected" in c) != ("error" in c), c["name"]


def test_standard_ports_match_the_shared_fixture():
    assert _fixture()["standard_ports"] == {
        "BROKER": BROKER_PORT,
        "LEDGER": LEDGER_PORT,
        "VALUATION": VALUATION_PORT,
        "PRICE": PRICE_PORT,
    }
    ports = _fixture()["standard_ports"]
    for service in Service:
        assert service.standard_port == ports[service.env_prefix]


def test_standard_ports():
    assert (BROKER_PORT, LEDGER_PORT, VALUATION_PORT, PRICE_PORT) == (8085, 8082, 8080, 8083)
