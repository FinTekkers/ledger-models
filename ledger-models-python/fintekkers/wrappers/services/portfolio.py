from typing import Generator

from grpc import RpcError
from google.protobuf.any_pb2 import Any
from google.protobuf import wrappers_pb2 as wrappers

from datetime import datetime

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.models.position import field_pb2
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.requests.portfolio.create_portfolio_request_pb2 import (
    CreatePortfolioRequestProto,
)
from fintekkers.requests.portfolio.create_portfolio_response_pb2 import (
    CreatePortfolioResponseProto,
)

from fintekkers.requests.portfolio.query_portfolio_request_pb2 import (
    QueryPortfolioRequestProto,
)
from fintekkers.requests.portfolio.query_portfolio_response_pb2 import (
    QueryPortfolioResponseProto,
)

from fintekkers.services.portfolio_service.portfolio_service_pb2_grpc import (
    PortfolioStub,
)

from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache as _link_cache
from fintekkers.wrappers.requests.portfolio import (
    CreatePortfolioRequest,
    QueryPortfolioRequest,
)
from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType


class PortfolioService:
    # Singleton: see FinTekkers/ledger-models#223. The gRPC channel is
    # constructed once and reused across all `PortfolioService()` calls
    # in the process. Tests that need isolation should call
    # `PortfolioService._reset_for_tests()` between cases.
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            instance = super().__new__(cls)
            print(
                "PortfolioService connecting to: "
                + EnvConfig.api_url(ServiceType.PORTFOLIO_SERVICE)
            )
            instance.stub = PortfolioStub(
                EnvConfig.get_channel(ServiceType.PORTFOLIO_SERVICE)
            )
            cls._instance = instance
        return cls._instance

    def __init__(self):
        pass

    @classmethod
    def _reset_for_tests(cls) -> None:
        cls._instance = None

    def _reconnect(self) -> None:
        """Replace the cached stub with a fresh channel. Called from the
        search() error path on RpcError. Mutates the singleton in place
        so existing references continue to work."""
        self.stub = PortfolioStub(
            EnvConfig.get_channel(ServiceType.PORTFOLIO_SERVICE)
        )

    def search(
        self, request: QueryPortfolioRequest
    ) -> Generator[Portfolio, None, None]:
        responses = self.stub.Search(request=request.proto)

        try:
            while not responses._is_complete():
                response: QueryPortfolioResponseProto = responses.next()

                for portfolio_proto in response.portfolio_response:
                    yield Portfolio(portfolio_proto)
        except StopIteration:
            pass
        except RpcError as e:
            print(e)
            self._reconnect()  # Replace the cached stub with a fresh channel

    def create_or_update(
        self, request: CreatePortfolioRequestProto
    ) -> Generator[Portfolio, None, None]:
        response = self.stub.CreateOrUpdate(request)
        # Write-through to the process-wide LinkCache. portfolio_response is
        # a repeated field on CreatePortfolioResponseProto, so populate each
        # entry that carries the bitemporal anchor LinkCache needs.
        if response is not None:
            for persisted in response.portfolio_response:
                if persisted.HasField("uuid") and persisted.HasField("as_of"):
                    uuid_obj = ProtoSerializationUtil.deserialize(persisted.uuid).uuid
                    as_of_dt = ProtoSerializationUtil.deserialize(persisted.as_of)
                    _link_cache.PORTFOLIO.put(uuid_obj, persisted, as_of_dt)
        return response

    def create_portfolio_by_name(self, portfolio_name: str) -> Portfolio:
        """
        Creates a new portfolio with the given portfolio name. Uniqueness
        is defined by the UUID so if you call this multiple times with
        the same value you will have multiple portfolios with the same
        name but different UUIDs.
        """
        create_portfolio_request: CreatePortfolioRequestProto = (
            CreatePortfolioRequest.create_portfolio_request_from_name(portfolio_name)
        )

        responses = self.create_or_update(create_portfolio_request)

        if len(responses.portfolio_response) > 0:
            for portfolio in responses.portfolio_response:
                return Portfolio(portfolio)

        else:
            print("Could not create portfolio. You should call the validate API to check its a valid request")
            return None

    def get_or_create_portfolio_by_name(self, portfolio_name: str) -> Portfolio:
        """
        Returns a single portfolio if it exists, and if it doesn't exist then it is
        created. This does not guarantee that there is only one portfolio with that
        name in the system, but is a helper function that assumes that is the case.
        """
        def wrap_string_to_any(my_string: str):
            my_any = Any()
            my_any.Pack(wrappers.StringValue(value=my_string))
            return my_any

        as_of_proto: LocalTimestampProto = ProtoSerializationUtil.serialize(
            datetime.now()
        )

        portfolio_query = QueryPortfolioRequestProto(
            search_portfolio_input=PositionFilterProto(
                filters=[
                    FieldMapEntry(
                        field=field_pb2.FieldProto.PORTFOLIO_NAME,
                        field_value_packed=wrap_string_to_any(portfolio_name),
                    )
                ]
            ),
            as_of=as_of_proto,
        )

        responses = self.search(QueryPortfolioRequest(portfolio_query))
        # search() yields Portfolio wrappers (not raw protos), so list() is correct here
        portfolios: list[Portfolio] = list(responses)

        if len(portfolios) == 0:
            return self.create_portfolio_by_name(portfolio_name=portfolio_name)
        else:
            return portfolios[0]
