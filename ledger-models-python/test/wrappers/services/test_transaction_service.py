"""
Unit tests for TransactionService.search_with_security_and_portfolio.

Mocks both the TransactionStub (for the streaming search) and the
SecurityStub / PortfolioStub used by LinkResolver, so this is a pure
unit test — no `@pytest.mark.integration`.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.portfolio.query_portfolio_response_pb2 import (
    QueryPortfolioResponseProto,
)
from fintekkers.requests.security.query_security_response_pb2 import (
    QuerySecurityResponseProto,
)
from fintekkers.requests.transaction.query_transaction_response_pb2 import (
    QueryTransactionResponseProto,
)
from fintekkers.wrappers.requests.transaction import QueryTransactionRequest
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.util.link_resolver import LinkResolver


# ---------- helpers ----------

def _full_security(uuid_obj: UUID, name: str) -> SecurityProto:
    return SecurityProto(
        object_class="Security",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        is_link=False,
        issuer_name=name,
        identifiers=[IdentifierProto(identifier_value=f"TICKER-{name}")],
    )


def _full_portfolio(uuid_obj: UUID, name: str) -> PortfolioProto:
    return PortfolioProto(
        object_class="Portfolio",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        is_link=False,
        portfolio_name=name,
    )


def _link_security(uuid_obj: UUID) -> SecurityProto:
    return SecurityProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), is_link=True)


def _link_portfolio(uuid_obj: UUID) -> PortfolioProto:
    return PortfolioProto(uuid=UUIDProto(raw_uuid=uuid_obj.bytes), is_link=True)


def _link_txn(security_uuid: UUID, portfolio_uuid: UUID) -> TransactionProto:
    return TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        is_link=False,
        security=_link_security(security_uuid),
        portfolio=_link_portfolio(portfolio_uuid),
    )


class _FakeStreamResponse:
    """Mimics the gRPC streaming response object used in services/security.py
    et al — yields chunks via .next() until ._is_complete() is True."""

    def __init__(self, chunks: list):
        self._chunks = list(chunks)

    def _is_complete(self) -> bool:
        return len(self._chunks) == 0

    def next(self):
        if not self._chunks:
            raise StopIteration
        return self._chunks.pop(0)

    def cancel(self):
        pass


class _MockTransactionStub:
    def __init__(self, txn_protos: list[TransactionProto]):
        self._chunks = [
            QueryTransactionResponseProto(transaction_response=txn_protos),
        ]

    def Search(self, request):
        return _FakeStreamResponse(self._chunks)


class _MockSecurityStub:
    def __init__(self, store: dict[str, SecurityProto]):
        self._store = store
        self.calls = 0

    def GetByIds(self, request):
        self.calls += 1
        response = QuerySecurityResponseProto()
        for u in request.uuIds:
            uid = str(UUID(bytes=bytes(u.raw_uuid)))
            if uid in self._store:
                response.security_response.append(self._store[uid])
        return response


class _MockPortfolioStub:
    def __init__(self, store: dict[str, PortfolioProto]):
        self._store = store
        self.calls = 0

    def GetByIds(self, request):
        self.calls += 1
        response = QueryPortfolioResponseProto()
        for u in request.uuIds:
            uid = str(UUID(bytes=bytes(u.raw_uuid)))
            if uid in self._store:
                response.portfolio_response.append(self._store[uid])
        return response


# ---------- tests ----------

def test_search_with_security_and_portfolio_hydrates_both_via_batched_rpcs():
    """3 transactions, 2 unique securities + 2 unique portfolios → 2 RPCs total
    (one batched per entity type), both halves hydrated end-to-end."""
    sec_a, sec_b = uuid4(), uuid4()
    port_x, port_y = uuid4(), uuid4()

    sec_store = {
        str(sec_a): _full_security(sec_a, "AAPL"),
        str(sec_b): _full_security(sec_b, "MSFT"),
    }
    port_store = {
        str(port_x): _full_portfolio(port_x, "Strategy X"),
        str(port_y): _full_portfolio(port_y, "Strategy Y"),
    }

    txn_protos = [
        _link_txn(sec_a, port_x),
        _link_txn(sec_a, port_y),
        _link_txn(sec_b, port_x),
    ]

    sec_stub = _MockSecurityStub(sec_store)
    port_stub = _MockPortfolioStub(port_store)
    txn_stub = _MockTransactionStub(txn_protos)

    resolver = LinkResolver(security_stub=sec_stub, portfolio_stub=port_stub)
    service = TransactionService(stub=txn_stub)

    # Build a minimal QueryTransactionRequest — the request wrapper takes
    # a proto directly via its constructor.
    from fintekkers.requests.transaction.query_transaction_request_pb2 import (
        QueryTransactionRequestProto,
    )
    request = QueryTransactionRequest(QueryTransactionRequestProto())

    txns = service.search_with_security_and_portfolio(request, resolver)

    assert len(txns) == 3

    # Exactly 1 batched RPC per entity type (2 unique securities, 2 unique portfolios).
    assert sec_stub.calls == 1
    assert port_stub.calls == 1

    # Each transaction has both security AND portfolio hydrated.
    for txn in txns:
        assert txn.proto.security.is_link is False
        assert txn.proto.portfolio.is_link is False
        assert txn.proto.security.issuer_name in {"AAPL", "MSFT"}
        assert txn.proto.portfolio.portfolio_name in {"Strategy X", "Strategy Y"}


def test_search_with_security_and_portfolio_shared_resolver_across_calls():
    """Pass the same LinkResolver to two service calls — overlapping UUIDs
    are fetched once total."""
    sec_a = uuid4()
    port_x = uuid4()
    sec_store = {str(sec_a): _full_security(sec_a, "AAPL")}
    port_store = {str(port_x): _full_portfolio(port_x, "Strategy X")}

    sec_stub = _MockSecurityStub(sec_store)
    port_stub = _MockPortfolioStub(port_store)
    resolver = LinkResolver(security_stub=sec_stub, portfolio_stub=port_stub)

    # First call.
    svc1 = TransactionService(stub=_MockTransactionStub([_link_txn(sec_a, port_x)]))
    from fintekkers.requests.transaction.query_transaction_request_pb2 import (
        QueryTransactionRequestProto,
    )
    request = QueryTransactionRequest(QueryTransactionRequestProto())
    svc1.search_with_security_and_portfolio(request, resolver)
    assert sec_stub.calls == 1
    assert port_stub.calls == 1

    # Second call: same UUIDs, cached → no additional RPCs.
    svc2 = TransactionService(stub=_MockTransactionStub([_link_txn(sec_a, port_x)]))
    svc2.search_with_security_and_portfolio(request, resolver)
    assert sec_stub.calls == 1
    assert port_stub.calls == 1


def test_transaction_is_link_helper():
    txn_link = TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        is_link=True,
    )
    from fintekkers.wrappers.models.transaction import Transaction

    assert Transaction(txn_link).is_link() is True

    txn_full = TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=uuid4().bytes),
        is_link=False,
    )
    assert Transaction(txn_full).is_link() is False
