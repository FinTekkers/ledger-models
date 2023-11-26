from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.services.portfolio import PortfolioService

import os

print(os.getcwd())

TEST_PORTFOLIO = "Test Portfolio 2"


def test_portfolio_service():
    svc = PortfolioService()

    portfolio: Portfolio = svc.get_or_create_portfolio(TEST_PORTFOLIO)

    assert portfolio is not None
    assert portfolio.get_name() == TEST_PORTFOLIO


if __name__ == "__main__":
    test_portfolio_service()
