from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.services.portfolio import PortfolioService


def test_query_portfolio():
    portfolioService = PortfolioService()
    portfolio_to_find = "Federal Reserve SOMA Holdings"

    PortfolioService.get_or_create_portfolio(portfolioService, portfolio_to_find)

    searchResults = get_portfolio(portfolioService, portfolio_to_find)

    assert len(searchResults) > 1

    print(searchResults[0].get_name())


def get_portfolio(portfolioService, portfolio_to_find):
    request = QueryPortfolioRequest.create_query_request(
        {
            FieldProto.PORTFOLIO_NAME: portfolio_to_find,
        }
    )

    searchResults: list[Portfolio] = list(portfolioService.search(request))
    return searchResults


def test_create_portfolio():
    import random

    portfolioService = PortfolioService()
    portfolio_to_find = "Federal Reserve SOMA Holdings" + str(random.randint(1, 99999))
    searchResults = get_portfolio(portfolioService, portfolio_to_find)

    while len(searchResults) != 0:
        portfolio_to_find = "Federal Reserve SOMA Holdings" + str(
            random.randint(1, 99999)
        )
        searchResults = get_portfolio(portfolioService, portfolio_to_find)

    result = portfolioService.create_or_update(
        Portfolio.create_portfolio(portfolio_to_find)
    )

    result
