"""Dated security metrics (LM-482): shares outstanding, NAV per share and
total net assets, read through an installed SecurityMetricFetcher.

`Security.get_security_metric` and `Security.get_security_metric_series` call
the installed fetcher only; they make no network call of their own. There is
no default fetcher: with none installed they raise SecurityMetricFetcherMissing.
See docs/adr/security_metric.md.
"""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Optional, Protocol
from uuid import UUID


@dataclass(frozen=True)
class SecurityMetricObservation:
    """One observation: the value and the date it is for.

    observation_date is the observation's own date, which may be earlier than
    the date asked for. An unknown value has no observation: absent is never 0.
    """

    value: Decimal
    observation_date: date

    def __post_init__(self):
        if self.value is None:
            raise ValueError("value is required: an unknown value has no observation")
        if self.observation_date is None:
            raise ValueError("observation_date is required")


class SecurityMetricFetcher(Protocol):
    """Where the metric helpers read observations from. Production installs an
    adapter over the SecurityMetric gRPC service; tests install a fake."""

    def latest(self, security_id: UUID, metric: int, d: date) -> Optional[SecurityMetricObservation]:
        """The observation with the latest observation_date on or before `d`,
        or None when there is none."""
        ...

    def series(self, security_id: UUID, metric: int, from_date: date, to_date: date) -> list[SecurityMetricObservation]:
        """The observations with observation_date in [from_date, to_date], inclusive."""
        ...


class SecurityMetricFetcherMissing(RuntimeError):
    """No SecurityMetricFetcher is installed."""


_security_metric_fetcher: Optional[SecurityMetricFetcher] = None


def set_security_metric_fetcher(fetcher: SecurityMetricFetcher) -> None:
    """Install the fetcher the metric helpers read from. Process-wide."""
    global _security_metric_fetcher
    _security_metric_fetcher = fetcher


def clear_security_metric_fetcher() -> None:
    """Remove the installed fetcher; the helpers raise again."""
    global _security_metric_fetcher
    _security_metric_fetcher = None


def require_security_metric_fetcher() -> SecurityMetricFetcher:
    """The installed fetcher. Raises SecurityMetricFetcherMissing when there is none."""
    fetcher = _security_metric_fetcher
    if fetcher is None:
        raise SecurityMetricFetcherMissing(
            "No SecurityMetricFetcher installed: call "
            "fintekkers.wrappers.models.security.security_metric.set_security_metric_fetcher(...)"
        )
    return fetcher
