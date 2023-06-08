# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from fintekkers.requests.security import create_security_request_pb2 as fintekkers_dot_requests_dot_security_dot_create__security__request__pb2
from fintekkers.requests.security import create_security_response_pb2 as fintekkers_dot_requests_dot_security_dot_create__security__response__pb2
from fintekkers.requests.security import query_security_request_pb2 as fintekkers_dot_requests_dot_security_dot_query__security__request__pb2
from fintekkers.requests.security import query_security_response_pb2 as fintekkers_dot_requests_dot_security_dot_query__security__response__pb2
from fintekkers.requests.util.errors import summary_pb2 as fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2


class SecurityStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.CreateOrUpdate = channel.unary_unary(
                '/fintekkers.services.security_service.Security/CreateOrUpdate',
                request_serializer=fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_security_dot_create__security__response__pb2.CreateSecurityResponseProto.FromString,
                )
        self.GetByIDs = channel.unary_unary(
                '/fintekkers.services.security_service.Security/GetByIDs',
                request_serializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
                )
        self.Search = channel.unary_stream(
                '/fintekkers.services.security_service.Security/Search',
                request_serializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
                )
        self.ListIDs = channel.unary_unary(
                '/fintekkers.services.security_service.Security/ListIDs',
                request_serializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
                )
        self.ValidateCreateOrUpdate = channel.unary_unary(
                '/fintekkers.services.security_service.Security/ValidateCreateOrUpdate',
                request_serializer=fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
                )
        self.ValidateQueryRequest = channel.unary_unary(
                '/fintekkers.services.security_service.Security/ValidateQueryRequest',
                request_serializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
                )


class SecurityServicer(object):
    """Missing associated documentation comment in .proto file."""

    def CreateOrUpdate(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetByIDs(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def Search(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ListIDs(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ValidateCreateOrUpdate(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ValidateQueryRequest(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_SecurityServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'CreateOrUpdate': grpc.unary_unary_rpc_method_handler(
                    servicer.CreateOrUpdate,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_security_dot_create__security__response__pb2.CreateSecurityResponseProto.SerializeToString,
            ),
            'GetByIDs': grpc.unary_unary_rpc_method_handler(
                    servicer.GetByIDs,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.SerializeToString,
            ),
            'Search': grpc.unary_stream_rpc_method_handler(
                    servicer.Search,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.SerializeToString,
            ),
            'ListIDs': grpc.unary_unary_rpc_method_handler(
                    servicer.ListIDs,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.SerializeToString,
            ),
            'ValidateCreateOrUpdate': grpc.unary_unary_rpc_method_handler(
                    servicer.ValidateCreateOrUpdate,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.SerializeToString,
            ),
            'ValidateQueryRequest': grpc.unary_unary_rpc_method_handler(
                    servicer.ValidateQueryRequest,
                    request_deserializer=fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'fintekkers.services.security_service.Security', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class Security(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def CreateOrUpdate(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/fintekkers.services.security_service.Security/CreateOrUpdate',
            fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_security_dot_create__security__response__pb2.CreateSecurityResponseProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def GetByIDs(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/fintekkers.services.security_service.Security/GetByIDs',
            fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def Search(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(request, target, '/fintekkers.services.security_service.Security/Search',
            fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ListIDs(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/fintekkers.services.security_service.Security/ListIDs',
            fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_security_dot_query__security__response__pb2.QuerySecurityResponseProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ValidateCreateOrUpdate(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/fintekkers.services.security_service.Security/ValidateCreateOrUpdate',
            fintekkers_dot_requests_dot_security_dot_create__security__request__pb2.CreateSecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ValidateQueryRequest(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/fintekkers.services.security_service.Security/ValidateQueryRequest',
            fintekkers_dot_requests_dot_security_dot_query__security__request__pb2.QuerySecurityRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)