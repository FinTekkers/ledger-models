"""LM-485: the README.rst security metrics example runs against the fake
SecurityMetric server, and the README shows exactly the code run here."""
import re
import textwrap
import datetime as dt
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from security_metric_fake import FakeServer

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.security_metric import SHARES_OUTSTANDING as SHARES
from fintekkers.wrappers.services import security_metric as metric_service

README = Path(__file__).resolve().parents[2] / "README.rst"
SPY = UUID(bytes=bytes([1] * 16))
QQQ = UUID(bytes=bytes([2] * 16))
LOOKUP_VARS = ["BROKER_HOST", "API_URL"] + [
    f"{prefix}_SERVICE_{part}"
    for prefix in ("BROKER", "LEDGER", "VALUATION", "PRICE")
    for part in ("HOST", "PORT")
]


def _marked_example() -> str:
    source = Path(__file__).read_text()
    match = re.search(r"# README:start\n(.*?)\n\s*# README:end", source, re.S)
    assert match, "README markers missing"
    return textwrap.dedent(match.group(1)).strip()


def _readme_example() -> str:
    text = README.read_text()
    match = re.search(r"Security metrics\n=+\n.*?\.\. code-block:: python\n\n(.*?)(?:\n\S|\Z)", text, re.S)
    assert match, "README.rst has no security metrics python block"
    return textwrap.dedent(match.group(1)).strip()


def test_readme_block_is_the_code_this_test_runs():
    assert _readme_example() == _marked_example()


def test_readme_example_runs_against_the_fake(monkeypatch):
    server = FakeServer()
    server.servicer.seed(SPY, SHARES, {dt.date(2026, 11, 19): "15204137000", dt.date(2026, 11, 20): "15210000000"})
    for var in LOOKUP_VARS:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("PRICE_SERVICE_HOST", "127.0.0.1")
    monkeypatch.setenv("PRICE_SERVICE_PORT", str(server.port))
    metric_service.set_security_metric_fetcher(None)
    metric_service.SecurityMetricService._reset_for_tests()
    security = Security(Security.link_of_latest(SPY))
    other_uuid = QQQ
    try:
        # README:start
        from datetime import date

        from fintekkers.wrappers.models.security.security_metric import SHARES_OUTSTANDING
        from fintekkers.wrappers.services.security_metric import SecurityMetricService

        # `security` is any Security you already hold, e.g. from SecurityService.
        latest = security.get_metric(SHARES_OUTSTANDING, on=date(2026, 11, 23))  # a Monday
        print(latest.value, latest.date, latest.age_days)  # Friday's point, 3 days old
        friday = security.shares_outstanding(on=date(2026, 11, 20))  # None if no point, never 0

        service = SecurityMetricService()  # address from the service config
        by_uuid = service.get(SHARES_OUTSTANDING, [security.get_id(), other_uuid], on=date(2026, 11, 23))

        history = security.shares_outstanding_history(date(2026, 11, 1), date(2026, 11, 23))
        print(history.latest, history.to_dict())  # history.to_pandas() if pandas is installed

        as_of = service.record(SHARES_OUTSTANDING, security.get_id(), {date(2026, 11, 23): 15211000000})
        # README:end

        assert (latest.value, latest.date, latest.age_days) == (Decimal("15210000000"), dt.date(2026, 11, 20), 3)
        assert friday.age_days == 0
        assert by_uuid[SPY].value == Decimal("15210000000") and by_uuid[QQQ] is None
        assert len(history.points) == 2
        assert as_of is not None
        assert len(server.servicer.create_requests) == 1
    finally:
        metric_service.SecurityMetricService._reset_for_tests()
        server.stop()
