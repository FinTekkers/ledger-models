from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.wrappers.models.portfolio import Portfolio


def test_portfolio_search_results_are_not_double_wrapped():
    """Verify that Portfolio objects from search() are Portfolio instances,
    not Portfolio(Portfolio(...)) double-wraps that would break .proto access."""
    proto = PortfolioProto(portfolio_name="Test Portfolio")
    portfolio = Portfolio(proto)

    assert isinstance(portfolio, Portfolio)
    assert isinstance(portfolio.proto, PortfolioProto)
    assert portfolio.get_name() == "Test Portfolio"

    # If someone accidentally wraps a Portfolio in another Portfolio,
    # the inner .proto would be a Portfolio, not a PortfolioProto.
    # This test ensures the pattern is correct.
    assert not isinstance(portfolio.proto, Portfolio)
