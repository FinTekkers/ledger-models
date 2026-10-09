"""LM-287: every Python service client gets its address from the per-service
lookup, so with the UI's environment (BROKER_HOST=127.0.0.1:8085,
API_URL=localhost) all of them call the broker rather than ledger-service on
localhost:8082.

grpc's channel factories are replaced with recorders, so no channel opens.
"""

from unittest.mock import MagicMock

import pytest

from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.price import PriceService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.services.util import Environment
from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType
from fintekkers.wrappers.services.valuation import ValuationService

# Every variable the lookup reads; each test starts with none of them set
# (the repo's .env sets API_URL=localhost).
LOOKUP_VARS = ["BROKER_HOST", "API_URL"] + [
    f"{prefix}_SERVICE_{part}"
    for prefix in ("BROKER", "LEDGER", "VALUATION", "PRICE")
    for part in ("HOST", "PORT")
]

# (client, port with only API_URL=localhost)
CLIENTS = [
    (PriceService, 8083),
    (SecurityService, 8082),
    (TransactionService, 8082),
    (PortfolioService, 8082),
    (ValuationService, 8080),
]


@pytest.fixture
def channels(monkeypatch):
    """Records the target of each channel the clients open, by kind."""
    opened = {"insecure": [], "secure": []}

    def insecure_channel(target, *args, **kwargs):
        opened["insecure"].append(target)
        return MagicMock()

    def secure_channel(target, *args, **kwargs):
        opened["secure"].append(target)
        return MagicMock()

    for var in LOOKUP_VARS:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setattr(Environment.grpc, "insecure_channel", insecure_channel)
    monkeypatch.setattr(Environment.grpc, "secure_channel", secure_channel)
    for client, _ in CLIENTS:
        client._reset_for_tests()
    yield opened
    for client, _ in CLIENTS:
        client._reset_for_tests()


@pytest.mark.parametrize("client", [c for c, _ in CLIENTS], ids=lambda c: c.__name__)
def test_with_broker_host_every_client_targets_the_broker_in_plaintext(channels, monkeypatch, client):
    monkeypatch.setenv("BROKER_HOST", "127.0.0.1:8085")
    monkeypatch.setenv("API_URL", "localhost")

    client()

    assert channels["insecure"] == ["127.0.0.1:8085"]
    assert "localhost:8082" not in channels["insecure"]
    assert channels["secure"] == []


@pytest.mark.parametrize("client,port", CLIENTS, ids=lambda c: getattr(c, "__name__", str(c)))
def test_with_only_api_url_each_client_uses_its_standard_port(channels, monkeypatch, client, port):
    monkeypatch.setenv("API_URL", "localhost")

    client()

    assert channels["insecure"] == [f"localhost:{port}"]


@pytest.mark.parametrize("client", [c for c, _ in CLIENTS], ids=lambda c: c.__name__)
def test_a_client_rebuilt_after_the_environment_changes_uses_the_new_address(channels, monkeypatch, client):
    monkeypatch.setenv("BROKER_HOST", "127.0.0.1:8085")
    client()
    client._reset_for_tests()
    monkeypatch.setenv("BROKER_HOST", "broker.example:9000")
    client()

    assert channels["insecure"] == ["127.0.0.1:8085"]
    assert channels["secure"] == ["broker.example:9000"]


def test_api_url_entry_point_routes_through_the_lookup(channels, monkeypatch):
    monkeypatch.setenv("API_URL", "localhost")
    assert EnvConfig.api_url(ServiceType.PRICE_SERVICE) == "localhost:8083"
    assert EnvConfig.api_url(ServiceType.LEDGER_SERVICE) == "localhost:8082"
    assert EnvConfig.api_url(ServiceType.VALUATION_SERVICE) == "localhost:8080"
    # No service type means the broker; it used to raise on localhost.
    assert EnvConfig.api_url() == "localhost:8085"

    monkeypatch.setenv("BROKER_HOST", "127.0.0.1:8085")
    assert EnvConfig.api_url(ServiceType.PRICE_SERVICE) == "127.0.0.1:8085"
    assert EnvConfig.api_url() == "127.0.0.1:8085"


def test_nothing_set_defaults_to_localhost(channels):
    assert EnvConfig.api_url() == "localhost:8085"
    assert EnvConfig.api_url(ServiceType.SECURITY_SERVICE) == "localhost:8082"
