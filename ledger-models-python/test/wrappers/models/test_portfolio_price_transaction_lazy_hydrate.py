"""Lazy-hydrate tests for the Portfolio / Price / Transaction wrappers.

Mirror of test_security_lazy_hydrate.py — same Given/When/Then shape,
same coverage axes (accessor hydration, link-safe accessors, cache
behavior, asOf semantics, resolve failure)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto

from fintekkers.wrappers.models.portfolio import Portfolio, set_portfolio_fetcher
from fintekkers.wrappers.models.price import Price, set_price_fetcher
from fintekkers.wrappers.models.transaction import Transaction, set_transaction_fetcher
from fintekkers.wrappers.models import portfolio as portfolio_module
from fintekkers.wrappers.models import price as price_module
from fintekkers.wrappers.models import transaction as transaction_module
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache


def _as_of(epoch_seconds: int) -> LocalTimestampProto:
    return LocalTimestampProto(timestamp=Timestamp(seconds=epoch_seconds), time_zone="UTC")


def _link_portfolio(uuid_obj: UUID, as_of: LocalTimestampProto) -> PortfolioProto:
    return PortfolioProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), is_link=True, as_of=as_of)


def _full_portfolio(uuid_obj: UUID, as_of: LocalTimestampProto, name: str) -> PortfolioProto:
    return PortfolioProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
        is_link=False,
        portfolio_name=name,
    )


def _link_price(uuid_obj: UUID, as_of: LocalTimestampProto) -> PriceProto:
    return PriceProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), is_link=True, as_of=as_of)


def _full_price(uuid_obj: UUID, as_of: LocalTimestampProto, value: str) -> PriceProto:
    return PriceProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
        is_link=False,
        price=DecimalValueProto(arbitrary_precision_value=value),
    )


def _link_txn(uuid_obj: UUID, as_of: LocalTimestampProto) -> TransactionProto:
    return TransactionProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), is_link=True, as_of=as_of)


def _full_txn(uuid_obj: UUID, as_of: LocalTimestampProto) -> TransactionProto:
    return TransactionProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), as_of=as_of, is_link=False)


class _Spy:
    def __init__(self, resolved):
        self.calls = []
        self.resolved = resolved

    def __call__(self, uuid, as_of):
        self.calls.append((uuid, as_of))
        return self.resolved


@pytest.fixture(autouse=True)
def _isolate():
    link_cache.PORTFOLIO.clear()
    link_cache.PRICE.clear()
    link_cache.TRANSACTION.clear()
    saved_p = portfolio_module._portfolio_fetcher
    saved_pr = price_module._price_fetcher
    saved_t = transaction_module._transaction_fetcher
    yield
    set_portfolio_fetcher(saved_p)
    set_price_fetcher(saved_pr)
    set_transaction_fetcher(saved_t)
    link_cache.PORTFOLIO.clear()
    link_cache.PRICE.clear()
    link_cache.TRANSACTION.clear()


# ---------- Portfolio ----------

def test_portfolio_get_name_on_link_invokes_fetcher_once():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_000)
    spy = _Spy(_full_portfolio(uuid_obj, as_of, "Strategy Z"))
    set_portfolio_fetcher(spy)

    p = Portfolio(_link_portfolio(uuid_obj, as_of))
    assert p.is_link() is True
    assert p.get_name() == "Strategy Z"
    assert len(spy.calls) == 1


def test_portfolio_second_call_does_not_re_invoke():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_001)
    spy = _Spy(_full_portfolio(uuid_obj, as_of, "Strategy Z"))
    set_portfolio_fetcher(spy)

    p = Portfolio(_link_portfolio(uuid_obj, as_of))
    p.get_name()
    p.get_name()
    assert len(spy.calls) == 1


def test_portfolio_fresh_wrapper_hits_cache():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_002)
    link_cache.PORTFOLIO.put(uuid_obj, _full_portfolio(uuid_obj, as_of, "shared"),
                              ProtoSerializationUtil.deserialize(as_of))
    set_portfolio_fetcher(_Spy(None))  # should NOT be called

    p = Portfolio(_link_portfolio(uuid_obj, as_of))
    assert p.get_name() == "shared"


def test_portfolio_no_fetcher_raises_with_uuid():
    set_portfolio_fetcher(None)
    uuid_obj = uuid4()
    p = Portfolio(_link_portfolio(uuid_obj, _as_of(1_700_000_010)))
    with pytest.raises(RuntimeError, match=str(uuid_obj)):
        p.get_name()


# ---------- Price ----------

def test_price_get_price_on_link_invokes_fetcher_once():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_020)
    spy = _Spy(_full_price(uuid_obj, as_of, "123.45"))
    set_price_fetcher(spy)

    pr = Price(_link_price(uuid_obj, as_of))
    assert pr.is_link() is True
    # get_price returns a Decimal-like value; we only assert hydration happened.
    _ = pr.get_price()
    assert len(spy.calls) == 1


def test_price_no_fetcher_raises_with_uuid():
    set_price_fetcher(None)
    uuid_obj = uuid4()
    pr = Price(_link_price(uuid_obj, _as_of(1_700_000_021)))
    with pytest.raises(RuntimeError, match=str(uuid_obj)):
        pr.get_price()


def test_price_fresh_wrapper_hits_cache():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_022)
    link_cache.PRICE.put(uuid_obj, _full_price(uuid_obj, as_of, "9.99"),
                         ProtoSerializationUtil.deserialize(as_of))
    set_price_fetcher(_Spy(None))

    pr = Price(_link_price(uuid_obj, as_of))
    _ = pr.get_price()


# ---------- Transaction ----------

def test_transaction_ensure_hydrated_on_link_invokes_fetcher_once():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_030)
    spy = _Spy(_full_txn(uuid_obj, as_of))
    set_transaction_fetcher(spy)

    t = Transaction(_link_txn(uuid_obj, as_of))
    assert t.is_link() is True
    t._ensure_hydrated()
    assert len(spy.calls) == 1
    assert t.proto.is_link is False


def test_transaction_fresh_wrapper_hits_cache():
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_031)
    link_cache.TRANSACTION.put(uuid_obj, _full_txn(uuid_obj, as_of),
                                ProtoSerializationUtil.deserialize(as_of))
    set_transaction_fetcher(_Spy(None))

    t = Transaction(_link_txn(uuid_obj, as_of))
    t._ensure_hydrated()
    assert t.proto.is_link is False


def test_transaction_no_fetcher_raises_with_uuid():
    set_transaction_fetcher(None)
    uuid_obj = uuid4()
    t = Transaction(_link_txn(uuid_obj, _as_of(1_700_000_032)))
    with pytest.raises(RuntimeError, match=str(uuid_obj)):
        t._ensure_hydrated()
