from fintekkers.requests.portfolio.create_portfolio_request_pb2 import CreatePortfolioRequestProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.requests.portfolio import CreatePortfolioRequest
from fintekkers.wrappers.services.portfolio import PortfolioService

TEST_PORTFOLIO = "Test Portfolio 2"


def test_portfolio_service():
    portfolio: Portfolio = PortfolioService().get_or_create_portfolio_by_name(TEST_PORTFOLIO)

    request:CreatePortfolioRequestProto = CreatePortfolioRequest.create_portfolio_request_from_proto(portfolio.proto)
    PortfolioService().create_or_update(request)

    assert portfolio is not None
    assert portfolio.get_name() == TEST_PORTFOLIO


if __name__ == "__main__":
    test_portfolio_service()
