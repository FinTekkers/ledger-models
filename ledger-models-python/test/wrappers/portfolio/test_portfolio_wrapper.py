from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.services.portfolio import PortfolioService


def test_query_portfolio():
    portfolio_to_find = "Federal Reserve SOMA Holdings"

    portfolioService = PortfolioService()

    request = QueryPortfolioRequest.create_query_request(
        {
            FieldProto.PORTFOLIO_NAME: portfolio_to_find,
        }
    )

    searchResults: list[Portfolio] = list(portfolioService.search(request))
    print(searchResults[0].get_name())
