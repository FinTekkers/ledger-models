from typing import Generator, List, Any
from uuid import UUID
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.security.security_pb2 import SecurityProto
from google.protobuf import wrappers_pb2

from fintekkers.requests.security.query_security_request_pb2 import (
    QuerySecurityRequestProto,
)
from fintekkers.requests.security.query_security_response_pb2 import (
    QuerySecurityResponseProto,
)
from fintekkers.services.security_service.security_service_pb2_grpc import SecurityStub

from fintekkers.wrappers.models.security import Security
from fintekkers.wrappers.requests.security import (
    QuerySecurityRequest,
    CreateSecurityRequest,
)
from fintekkers.wrappers.services.util.Environment import EnvConfig
from fintekkers.wrappers.models.position.field_wrapper import wrap_fields
from fintekkers.wrappers.services.base_service import BaseService

from google.protobuf.empty_pb2 import Empty

from fintekkers.requests.security.get_fields_response_pb2 import GetFieldsResponseProto
from fintekkers.requests.security.get_field_values_request_pb2 import GetFieldValuesRequestProto
from fintekkers.requests.security.get_field_values_response_pb2 import GetFieldValuesResponseProto

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from datetime import date
from decimal import Decimal

from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.models.security.tenor_pb2 import TenorProto

from fintekkers.wrappers.models.util.proto_serialization_utils import ProtoSerializationUtils


class SecurityService(BaseService):
    def __init__(self):
        super().__init__("SecurityService")

    def _create_stub(self) -> SecurityStub:
        return SecurityStub(EnvConfig.get_channel())

    def search(self, request: QuerySecurityRequest) -> Generator[Security, None, None]:
        for response in self._execute_streaming_operation("search", self.stub.Search, request=request.proto):
            for security_proto in response.security_response:
                yield Security(security_proto)

    def create_or_update(self, request: CreateSecurityRequest):
        return self._execute_operation("create_or_update", self.stub.CreateOrUpdate, request.proto)

    def get_security_by_uuid(uuid: UUID) -> Security:
        """
        Parameters:
            A UUID

        Returns:
            request (SecurityProto): Returns the Security proto for the UUID, or None if doesn't exist
        """
        try:
            uuid_proto = UUIDProto(raw_uuid=uuid.bytes)

            request: QuerySecurityRequest = QuerySecurityRequest.create_query_request(
                {
                    FieldProto.ID: uuid_proto,
                }
            )

            securities = SecurityService().search(request)

            for security in securities:
                return security
        except Exception as e:
            print(f"\nERROR: Could not communicate with SecurityService at {EnvConfig.api_url()}")
            print("Please ensure the service is running and accessible.")
            print(f"Error details: {str(e)}")
            raise

    def get_fields(self):
        """
        Get all available fields for securities.
        
        Returns:
            FieldList: A wrapper around the list of available fields
        """
        response: GetFieldsResponseProto = self._execute_operation("get_fields", self.stub.GetFields, Empty())
        return wrap_fields(list(response.fields))

    def get_field_values(self, field: FieldProto) -> List[Any]:
        """
        Get all possible values for a specific field.
        
        Args:
            field (FieldProto): The field to get values for
            
        Returns:
            List[Any]: List of possible values for the field
        """
        request = GetFieldValuesRequestProto()
        request.field = field
        
        response: GetFieldValuesResponseProto = self._execute_operation(
            "get_field_values", 
            self.stub.GetFieldValues, 
            request
        )
        
        return [ProtoSerializationUtils.unpack_value(value) for value in response.values]
