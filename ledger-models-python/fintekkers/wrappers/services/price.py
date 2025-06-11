from typing import Generator
from uuid import UUID
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.price.query_price_request_pb2 import QueryPriceRequestProto
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto

from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.requests.price import CreatePriceRequest, QueryPriceRequest

from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType

from fintekkers.services.price_service.price_service_pb2_grpc import PriceStub

class PriceService:
    def __init__(self):
        print("PriceService connecting to: " + EnvConfig.api_url(ServiceType.PRICE_SERVICE))
        self.stub = PriceStub(EnvConfig.get_channel(ServiceType.PRICE_SERVICE))

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

    def get_price_by_uuid(self,uuid: UUID) -> Price:
        """
        Parameters:
            A UUID

        Returns:
            request (Price): Returns the Price proto for the UUID, or None if doesn't exist
        """
        uuid_proto = UUIDProto(raw_uuid=uuid.bytes)

        # request: QueryPriceRequest = QueryPriceRequest.create_query_request(
        #     {
        #         FieldProto.ID: uuid_proto,
        #     },
        #     frequency=None,
        #     start_date=None,
        #     end_date=None
        # )

        request:QueryPriceRequestProto = QueryPriceRequestProto(
            uuIds=[uuid_proto]
        )

        prices = self.stub.GetByIds(request).price_response

        for price in prices:
            return Price(price)
        
    def list_ids(self) -> list[UUID]:
        request: QueryPriceRequest = QueryPriceRequest.create_query_request(
            fields={},
            frequency=None,
            start_date=None,
            end_date=None
        )

        response: QueryPriceResponseProto = self.stub.ListIds(request.proto)

        ids: list[UUID] = []

        for price_proto in response.price_response:
            price_proto: PriceProto
            price_id = price_proto.uuid
            uuid: UUID = ProtoSerializationUtil.deserialize(price_id).as_uuid()
            ids.append(uuid)

        return ids
