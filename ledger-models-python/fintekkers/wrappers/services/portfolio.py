from typing import Generator

from google.protobuf.timestamp_pb2 import Timestamp
from google.protobuf.any_pb2 import Any
from google.protobuf import wrappers_pb2 as wrappers

from datetime import datetime
from uuid import uuid4

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.models.position import field_pb2
from fintekkers.models.util.uuid_pb2 import UUIDProto
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
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.services.util.Environment import get_channel


class PortfolioService:
    def __init__(self):
        self.stub = PortfolioStub(get_channel())

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
        except Exception as e:
            print(e)

        # This will send the cancel message to the server to kill the connection
        responses.cancel()

    def create_or_update(
        self, request: CreatePortfolioRequestProto
    ) -> Generator[Portfolio, None, None]:
        response: CreatePortfolioResponseProto = self.stub.CreateOrUpdate(
            request=request
        )
        yield Portfolio(response.portfolio_response)

    def create_portfolio(self, portfolio_name: str):
        uuid_value = uuid4()
        create_portfolio_request = CreatePortfolioRequestProto(
            create_portfolio_input=PortfolioProto(
                as_of=LocalTimestampProto(
                    timestamp=Timestamp(), time_zone="America/New_York"
                ),
                is_link=False,
                object_class="Portfolio",
                portfolio_name=portfolio_name,
                uuid=UUIDProto(raw_uuid=uuid_value.bytes),
                version="0.0.1",
            )
        )

        responses = self.create_or_update(create_portfolio_request)

        response = None
        for _response in responses:
            response = _response

        return response

    def get_or_create_portfolio(self, portfolio_name: str):
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
        portfolios: list[Portfolio] = []

        for portfolio in responses:
            portfolios.append(portfolio)

        number_found = len(portfolios)

        if number_found == 0:
            return self.create_portfolio(portfolio_name=portfolio_name)
        else:
            return portfolios[0]
