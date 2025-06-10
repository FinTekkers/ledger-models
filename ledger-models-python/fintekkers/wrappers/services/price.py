from typing import Generator
from uuid import UUID
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto

from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.requests.price import CreatePriceRequest, QueryPriceRequest

from fintekkers.wrappers.services.util.Environment import EnvConfig

from fintekkers.services.price_service.price_service_pb2 import Price_Stub

class PriceService:
    def __init__(self):
        print("PriceService connecting to: " + EnvConfig.api_url())
        self.stub = Price_Stub(EnvConfig.get_channel())

    def search(self, request: QueryPriceRequest) -> Generator[Price, None, None]:
        responses = self.stub.Search(request=request.proto)

        try:
            while not responses._is_complete():
                response: QueryPriceResponseProto = responses.next()

                for price_proto in response.price_response:
                    yield Price(price_proto)
        except StopIteration:
            pass
        except Exception as e:
            print(e)

        # This will send the cancel message to the server to kill the connection
        responses.cancel()

    def create_or_update(self, request: CreatePriceRequest):
        return self.stub.CreateOrUpdate(request.proto)

    def get_price_by_uuid(uuid: UUID) -> Price:
        """
        Parameters:
            A UUID

        Returns:
            request (Price): Returns the Price proto for the UUID, or None if doesn't exist
        """
        uuid_proto = UUIDProto(raw_uuid=uuid.bytes)

        request: QueryPriceRequest = QueryPriceRequest.create_query_request(
            {
                FieldProto.ID: uuid_proto,
            }
        )

        prices = PriceService().search(request)

        for price in prices:
            return price
        
    def list_ids(self) -> list[UUID]:
        request: QueryPriceRequest = QueryPriceRequest.create_query_request(
            fields={},
            frequency=None,
            start_date=None,
            end_date=None
        )

        response: QueryPriceResponseProto = self.stub.ListIds(request)
        return response.price_response
