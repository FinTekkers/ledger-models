from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import (
    QueryPortfolioRequestProto,
)
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.models.util.date_utils import datetime


def test_transaction_position():
    now = datetime.now()

    portfolioService = PortfolioService()

    request = QueryPortfolioRequestProto(
        search_portfolio_input=PositionFilterProto(), as_of=now
    )

    searchResults = portfolioService.search(request)

    for searchResult in searchResults:
        print(searchResult.get_name())
        break
