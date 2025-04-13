from datetime import datetime
from uuid import UUID

from fintekkers.wrappers.models.portfolio import Portfolio


def test_create_portfolio():
    portfolio:Portfolio = Portfolio.create_portfolio("ABC")

    assert type(portfolio.get_name()) == str, "expected name to be a str"
    assert type(portfolio.get_uuid()) == UUID, "expected uuid"
    assert type(portfolio.get_as_of()) == datetime, "expected datetime"

    assert portfolio.get_as_of().year >= 1969
