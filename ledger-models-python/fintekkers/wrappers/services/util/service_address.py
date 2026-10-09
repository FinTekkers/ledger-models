"""Finds the address of a FinTekkers service from the environment.

Mirrors Java ``ServiceAddress`` and Rust ``service_address.rs`` (LM-278).
Every default client resolves through here, in this order:

1. ``BROKER_HOST`` (``host[:port]``, port defaults to ``BROKER_PORT``): all
   calls go through the broker.
2. Only if that is unset, ``<SERVICE>_SERVICE_HOST`` with
   ``<SERVICE>_SERVICE_PORT`` (or the service's standard port). ``_PORT``
   without ``_HOST`` is ignored.
3. ``API_URL``, with the service's standard port unless it carries one.
4. ``localhost`` on the service's standard port.

An empty value counts as unset. A leading ``http://`` or ``https://`` is
ignored. Loopback hosts (``localhost``, ``127.0.0.1``) are plaintext; any
other host uses TLS. A port that is not a number raises ``ValueError``
naming the variable.

The same cases are checked in every language against
``test-fixtures/service-address-cases.json``.
"""

import os
import re
from dataclasses import dataclass
from enum import Enum
from typing import Mapping, Optional

BROKER_PORT = 8085
LEDGER_PORT = 8082
VALUATION_PORT = 8080
PRICE_PORT = 8083


class Service(Enum):
    BROKER = "BROKER"
    SECURITY = "SECURITY"
    TRANSACTION = "TRANSACTION"
    PORTFOLIO = "PORTFOLIO"
    VALUATION = "VALUATION"
    PRICE = "PRICE"

    @property
    def env_prefix(self) -> str:
        """Prefix of this service's ``<SERVICE>_SERVICE_HOST/_PORT`` variables."""
        return _SERVICE_ENV[self][0]

    @property
    def standard_port(self) -> int:
        return _SERVICE_ENV[self][1]


_SERVICE_ENV = {
    Service.BROKER: ("BROKER", BROKER_PORT),
    Service.SECURITY: ("LEDGER", LEDGER_PORT),
    Service.TRANSACTION: ("LEDGER", LEDGER_PORT),
    Service.PORTFOLIO: ("LEDGER", LEDGER_PORT),
    Service.VALUATION: ("VALUATION", VALUATION_PORT),
    Service.PRICE: ("PRICE", PRICE_PORT),
}


@dataclass(frozen=True)
class Endpoint:
    host: str
    port: int
    plaintext: bool

    @property
    def target(self) -> str:
        """The ``host:port`` string a gRPC channel connects to."""
        return f"{self.host}:{self.port}"


def resolve(service: Service, env: Optional[Mapping[str, str]] = None) -> Endpoint:
    """Resolves ``service`` against ``env`` (defaults to ``os.environ``)."""
    if env is None:
        env = os.environ

    broker = _read(env, "BROKER_HOST")
    if broker is not None:
        return _parse(broker, "BROKER_HOST", BROKER_PORT)

    host_var = service.env_prefix + "_SERVICE_HOST"
    host = _read(env, host_var)
    if host is not None:
        port_var = service.env_prefix + "_SERVICE_PORT"
        port = _read(env, port_var)
        endpoint = _parse(host, host_var, service.standard_port)
        if port is None:
            return endpoint
        return _endpoint(endpoint.host, _parse_port(port, port_var))

    api_url = _read(env, "API_URL")
    if api_url is not None:
        return _parse(api_url, "API_URL", service.standard_port)

    return _endpoint("localhost", service.standard_port)


def _read(env: Mapping[str, str], name: str) -> Optional[str]:
    value = env.get(name)
    if value is None:
        return None
    value = value.strip()
    return value or None


def _parse(value: str, variable: str, default_port: int) -> Endpoint:
    address = value
    scheme = address.find("://")
    if scheme >= 0:
        address = address[scheme + 3:]
    address = address.rstrip("/")

    host = address
    port = default_port
    colon = address.rfind(":")
    if colon >= 0:
        host = address[:colon]
        port = _parse_port(address[colon + 1:], variable)
    if not host:
        raise ValueError(f"{variable} has no host: '{value}'")
    return _endpoint(host, port)


def _parse_port(value: str, variable: str) -> int:
    text = value.strip()
    # Java's Integer.parseInt accepts an optional sign; the range check below rejects negatives.
    if not re.fullmatch(r"[+-]?[0-9]+", text):
        raise _invalid_port(value, variable)
    port = int(text)
    if port < 1 or port > 65535:
        raise _invalid_port(value, variable)
    return port


def _invalid_port(value: str, variable: str) -> ValueError:
    return ValueError(f"{variable} has an invalid port: '{value}'")


def _endpoint(host: str, port: int) -> Endpoint:
    return Endpoint(host, port, host in ("localhost", "127.0.0.1"))
