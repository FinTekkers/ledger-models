from typing import Generator, Optional
from uuid import UUID

import grpc
from grpc import RpcError

from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import (
    QueryTransactionRequestProto,
)
from fintekkers.requests.transaction.query_transaction_response_pb2 import (
    QueryTransactionResponseProto,
)
from fintekkers.services.transaction_service.transaction_service_pb2_grpc import (
    TransactionStub,
)

from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.requests.transaction import (
    CreateTransactionRequest,
    QueryTransactionRequest,
)
from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType
from fintekkers.wrappers.util.link_resolver import LinkResolver


class TransactionService:
    """Thin wrapper over the generated TransactionStub. Mirrors the JS
    TransactionService surface (search, get-by-uuid, create_or_update).

    Adds `search_with_security_and_portfolio` which composes the search
    with a LinkResolver to hydrate both embedded security and embedded
    portfolio in parallel-ish (one batched RPC per entity type)."""

    def __init__(self, stub: Optional[TransactionStub] = None):
        if stub is None:
            print(
                "TransactionService connecting to: "
                + EnvConfig.api_url(ServiceType.TRANSACTION_SERVICE)
            )
            stub = TransactionStub(
                EnvConfig.get_channel(ServiceType.TRANSACTION_SERVICE)
            )
        self.stub = stub

    def search(
        self, request: QueryTransactionRequest
    ) -> Generator[Transaction, None, None]:
        responses = self.stub.Search(request=request.proto)
        try:
            while not responses._is_complete():
                response: QueryTransactionResponseProto = responses.next()
                for txn_proto in response.transaction_response:
                    yield Transaction(txn_proto)
        except RpcError as e:
            if e.code() == grpc.StatusCode.CANCELLED:
                print(
                    f"Network call cancelled, likely due to a service error trying to "
                    f"contact {EnvConfig.api_url()} ({e.details()})"
                )
            else:
                print(
                    f"Service unavailable trying to contact {EnvConfig.api_url()} "
                    f"({e.details()})"
                )
            raise e
        finally:
            try:
                responses.cancel()
            except RpcError:
                pass

    def create_or_update(self, request: CreateTransactionRequest):
        try:
            return self.stub.CreateOrUpdate(request.proto)
        except RpcError as e:
            print(
                f"Service unavailable trying to contact {EnvConfig.api_url()} "
                f"({e.details()})"
            )
            raise e

    def get_transaction_by_uuid(self, uuid: UUID) -> Optional[Transaction]:
        """Single-UUID GetByIds convenience. Returns None if not found."""
        request = QueryTransactionRequestProto(
            uuIds=[UUIDProto(raw_uuid=uuid.bytes)],
        )
        response: QueryTransactionResponseProto = self.stub.GetByIds(request)
        for txn_proto in response.transaction_response:
            return Transaction(txn_proto)
        return None

    def search_with_security_and_portfolio(
        self,
        request: QueryTransactionRequest,
        link_resolver: Optional[LinkResolver] = None,
    ) -> list[Transaction]:
        """Search transactions and hydrate each Transaction's embedded
        Security AND Portfolio from link to full entity, with both fetches
        batched. Equivalent to:

            txns = list(transaction_service.search(request))
            resolver = LinkResolver()
            resolver.resolve_securities(txns)
            resolver.resolve_portfolios(txns)

        Pass a shared `link_resolver` to share caching across multiple
        service-wrapper calls in the same request scope.

        Returns list[Transaction] (not a generator) because the resolve
        step needs the full set before it can batch GetByIds.
        """
        txns: list[Transaction] = list(self.search(request))
        resolver = link_resolver if link_resolver is not None else LinkResolver()
        # Sequential here (Python sync gRPC). The two services are
        # independent so this could be parallelized via threads if
        # profiling shows benefit; not worth the complexity yet.
        resolver.resolve_securities(txns)
        resolver.resolve_portfolios(txns)
        return txns
