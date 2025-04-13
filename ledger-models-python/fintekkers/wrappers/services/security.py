from typing import Generator
from uuid import UUID
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.requests.security.query_security_response_pb2 import (
    QuerySecurityResponseProto,
)
from fintekkers.services.security_service.security_service_pb2_grpc import SecurityStub

from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.requests.security import (
    QuerySecurityRequest,
    CreateSecurityRequest,
)
from fintekkers.wrappers.services.util.Environment import EnvConfig

from fintekkers.requests.security.get_fields_response_pb2 import GetFieldsResponseProto
from fintekkers.requests.security.get_field_values_response_pb2 import GetFieldValuesResponseProto
from google.protobuf.empty_pb2 import Empty
from google.protobuf.any_pb2 import Any
from fintekkers.requests.security.get_field_values_request_pb2 import GetFieldValuesRequestProto
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

class SecurityService:
    def __init__(self):
        print("SecurityService connecting to: " + EnvConfig.api_url())
        self.stub = SecurityStub(EnvConfig.get_channel())

    def search(self, request: QuerySecurityRequest) -> Generator[Security, None, None]:
        responses = self.stub.Search(request=request.proto)

        try:
            while not responses._is_complete():
                response: QuerySecurityResponseProto = responses.next()

                for security_proto in response.security_response:
                    yield Security(security_proto)
        except StopIteration:
            pass
        except Exception as e:
            print(e)

        # This will send the cancel message to the server to kill the connection
        responses.cancel()

    def create_or_update(self, request: CreateSecurityRequest):
        return self.stub.CreateOrUpdate(request.proto)

    def get_security_by_uuid(uuid: UUID) -> Security:
        """
        Parameters:
            A UUID

        Returns:
            request (SecurityProto): Returns the Security proto for the UUID, or None if doesn't exist
        """
        uuid_proto = UUIDProto(raw_uuid=uuid.bytes)

        request: QuerySecurityRequest = QuerySecurityRequest.create_query_request(
            {
                FieldProto.ID: uuid_proto,
            }
        )

        securities = SecurityService().search(request)

        for security in securities:
            return security

    def get_fields(self) -> list[FieldProto]:
        response:GetFieldsResponseProto = self.stub.GetFields(Empty())
        return response.fields

    def get_field_values(self, field:FieldProto) -> list[object]:
        request = GetFieldValuesRequestProto(field=field)
        response:GetFieldValuesResponseProto = self.stub.GetFieldValues(request)

        values = []
        for value in response.values:
            value:Any
            
            a: FieldMapEntry = FieldMapEntry(field=field, field_value_packed=value)
            b = Position.unpack_field(a)
            c = ProtoSerializationUtil.deserialize(b)
            values.append(c)

        return values
