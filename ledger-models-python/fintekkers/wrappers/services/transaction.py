from typing import Generator, Optional
from uuid import UUID

import grpc
from grpc import RpcError

from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
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
from fintekkers.wrappers.util import link_cache as _link_cache
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


class TransactionService:
    """Thin wrapper over the generated TransactionStub. Mirrors the JS
    TransactionService surface (search, get-by-uuid, create_or_update).

    Adds `search_with_security_and_portfolio` which composes the search
    with a LinkResolver to hydrate both embedded security and embedded
    portfolio in parallel-ish (one batched RPC per entity type).

    Singleton: see FinTekkers/ledger-models#223. The gRPC channel is
    constructed once and reused across all `TransactionService()` calls
    in the process. Explicit `stub=` injection (used by unit tests)
    bypasses the cache and returns a fresh non-cached instance — that
    keeps the existing test isolation pattern working.
    """

    _instance: "Optional[TransactionService]" = None

    def __new__(cls, stub: Optional[TransactionStub] = None):
        # Explicit stub injection (test path): build a fresh, non-cached
        # instance bound to that stub. Two `TransactionService(stub=m1)` /
        # `TransactionService(stub=m2)` calls in a test must remain
        # independent — they're not the singleton.
        if stub is not None:
            instance = super().__new__(cls)
            instance.stub = stub
            return instance
        if cls._instance is None:
            instance = super().__new__(cls)
            print(
                "TransactionService connecting to: "
                + EnvConfig.api_url(ServiceType.TRANSACTION_SERVICE)
            )
            instance.stub = TransactionStub(
                EnvConfig.get_channel(ServiceType.TRANSACTION_SERVICE)
            )
            cls._instance = instance
        return cls._instance

    def __init__(self, stub: Optional[TransactionStub] = None):
        # All init lives in __new__ so the cached singleton is not
        # re-initialized on subsequent `TransactionService()` calls. The
        # parameter is preserved so test call sites compile unchanged.
        pass

    @classmethod
    def _reset_for_tests(cls) -> None:
        """Drop the cached singleton so the next `TransactionService()`
        call reconstructs the channel. For test fixtures only."""
        cls._instance = None

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
            response = self.stub.CreateOrUpdate(request.proto)
        except RpcError as e:
            print(
                f"Service unavailable trying to contact {EnvConfig.api_url()} "
                f"({e.details()})"
            )
            raise e
        # Write-through to LinkCache. transaction_response is a singular
        # TransactionProto on CreateTransactionResponseProto.
        if response is not None and response.HasField("transaction_response"):
            persisted = response.transaction_response
            if persisted.HasField("uuid") and persisted.HasField("as_of"):
                uuid_obj = ProtoSerializationUtil.deserialize(persisted.uuid).uuid
                as_of_dt = ProtoSerializationUtil.deserialize(persisted.as_of)
                _link_cache.TRANSACTION.put(uuid_obj, persisted, as_of_dt)
        return response

    def get_transaction_by_uuid(
        self, uuid: UUID, as_of: Optional[LocalTimestampProto] = None
    ) -> Optional[Transaction]:
        """Single-UUID GetByIds convenience. Returns None if not found.

        Parameters:
            uuid: the transaction UUID
            as_of: optional LocalTimestampProto; if set, returns the version
                of the record at that timestamp. None means latest. Matches
                the surface of `SecurityService.get_security_by_uuid` /
                `PortfolioService.get_portfolio_by_uuid` so the default
                transaction fetcher delegates here.
        """
        request = QueryTransactionRequestProto(
            uuIds=[UUIDProto(raw_uuid=uuid.bytes)],
        )
        if as_of is not None:
            request.as_of.CopyFrom(as_of)
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
