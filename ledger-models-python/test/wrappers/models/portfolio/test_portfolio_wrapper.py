from datetime import datetime
from uuid import UUID

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid


def test_create_portfolio():
    portfolio:Portfolio = Portfolio.create_portfolio("ABC")

    assert type(portfolio.get_name()) == str, "expected name to be a str"
    assert type(portfolio.get_uuid()) == UUID, "expected uuid"
    assert type(portfolio.get_as_of()) == datetime, "expected datetime"

    assert portfolio.get_as_of().year >= 1969


def test_link_without_as_of_serializes():
    """LM-271: a link portfolio with no as_of serializes, on its own and
    inside a transaction, and as_of stays unset (never defaulted)."""
    uuid_value = FintekkersUuid.new_uuid().as_uuid()
    portfolio = Portfolio(PortfolioProto(uuid=UUIDProto(raw_uuid=uuid_value.bytes), is_link=True))

    assert portfolio.is_link()
    assert portfolio.get_uuid() == uuid_value

    copy = PortfolioProto.FromString(portfolio.proto.SerializeToString())
    assert copy.is_link
    assert not copy.HasField("as_of")

    txn = Transaction.create_from(portfolio=portfolio.proto)
    txn_copy = TransactionProto.FromString(txn.proto.SerializeToString())
    assert txn_copy.portfolio.is_link
    assert not txn_copy.portfolio.HasField("as_of")
    assert txn_copy.portfolio.uuid.raw_uuid == uuid_value.bytes
