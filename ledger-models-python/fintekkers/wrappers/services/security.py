from typing import Generator

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.requests.security.query_security_response_pb2 import QuerySecurityResponseProto
from fintekkers.services.security_service.security_service_pb2_grpc import SecurityStub

from fintekkers.wrappers.models.security import Security
from fintekkers.wrappers.requests.security import QuerySecurityRequest
from fintekkers.wrappers.services.util.Environment import get_channel

class SecurityService():
    def __init__(self):
        self.stub = SecurityStub(get_channel())

    def search(self, request:QuerySecurityRequest) -> Generator[Security, None, None]:
        responses = self.stub.Search(request=request.proto)

        try:
            while not responses._is_complete():
                response:QuerySecurityResponseProto = responses.next()
                
                for security_proto in response.security_response:
                    yield Security(security_proto)
        except StopIteration:
            pass
        except Exception as e:
            print(e)
        
        #This will send the cancel message to the server to kill the connection
        responses.cancel()
