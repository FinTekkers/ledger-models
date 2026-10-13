"""Wire tests for the paging fields (limit, page_token, next_page_token).

See docs/adr/query_paging.md.
"""
import pytest

from fintekkers.models.util.date_range_pb2 import DateRangeProto
from fintekkers.models.util.version_pb2 import VersionProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import QueryPortfolioRequestProto
from fintekkers.requests.portfolio.query_portfolio_response_pb2 import QueryPortfolioResponseProto
from fintekkers.requests.price.query_price_request_pb2 import PRICE_HORIZON_1_YEAR, QueryPriceRequestProto
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto
from fintekkers.requests.security.query_security_request_pb2 import QuerySecurityRequestProto
from fintekkers.requests.security.query_security_response_pb2 import QuerySecurityResponseProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import QueryTransactionRequestProto
from fintekkers.requests.transaction.query_transaction_response_pb2 import QueryTransactionResponseProto

ENTITIES = [
    pytest.param(QuerySecurityRequestProto, QuerySecurityResponseProto, id="security"),
    pytest.param(QueryTransactionRequestProto, QueryTransactionResponseProto, id="transaction"),
    pytest.param(QueryPortfolioRequestProto, QueryPortfolioResponseProto, id="portfolio"),
    pytest.param(QueryPriceRequestProto, QueryPriceResponseProto, id="price"),
]

@pytest.mark.parametrize("request_cls,response_cls", ENTITIES)
def test_old_request_reads_defaults(request_cls, response_cls):
    old = request_cls()

    parsed = request_cls.FromString(old.SerializeToString())

    assert parsed.limit == 0
    assert parsed.page_token == ""
    assert response_cls.FromString(response_cls().SerializeToString()).next_page_token == ""


@pytest.mark.parametrize("request_cls,response_cls", ENTITIES)
def test_paging_fields_round_trip(request_cls, response_cls):
    request = request_cls(limit=25, page_token="opaque-abc")
    response = response_cls(next_page_token="opaque-def")

    parsed_request = request_cls.FromString(request.SerializeToString())
    parsed_response = response_cls.FromString(response.SerializeToString())

    assert parsed_request.limit == 25
    assert parsed_request.page_token == "opaque-abc"
    assert parsed_response.next_page_token == "opaque-def"


@pytest.mark.parametrize("request_cls,response_cls", ENTITIES)
def test_empty_next_page_token_encodes_as_unset(request_cls, response_cls):
    unset = response_cls()
    empty = response_cls(next_page_token="")

    assert empty.SerializeToString() == unset.SerializeToString()


def test_price_page_token_round_trips_with_horizon():
    request = QueryPriceRequestProto(horizon=PRICE_HORIZON_1_YEAR, page_token="opaque-abc", limit=10)

    parsed = QueryPriceRequestProto.FromString(request.SerializeToString())

    assert parsed.WhichOneof("time_range") == "horizon"
    assert parsed.horizon == PRICE_HORIZON_1_YEAR
    assert parsed.page_token == "opaque-abc"
    assert parsed.limit == 10


def test_price_page_token_round_trips_with_date_range():
    request = QueryPriceRequestProto(date_range=DateRangeProto(version=VersionProto(patch=1)), page_token="opaque-abc", limit=10)

    parsed = QueryPriceRequestProto.FromString(request.SerializeToString())

    assert parsed.WhichOneof("time_range") == "date_range"
    assert parsed.date_range.version.patch == 1
    assert parsed.page_token == "opaque-abc"
    assert parsed.limit == 10
