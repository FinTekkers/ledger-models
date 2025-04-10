# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings

from fintekkers.requests.transaction import create_transaction_request_pb2 as fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2
from fintekkers.requests.transaction import create_transaction_response_pb2 as fintekkers_dot_requests_dot_transaction_dot_create__transaction__response__pb2
from fintekkers.requests.transaction import query_transaction_request_pb2 as fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2
from fintekkers.requests.transaction import query_transaction_response_pb2 as fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2
from fintekkers.requests.util.errors import summary_pb2 as fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2

GRPC_GENERATED_VERSION = '1.71.0'
GRPC_VERSION = grpc.__version__
_version_not_supported = False

try:
    from grpc._utilities import first_version_is_lower
    _version_not_supported = first_version_is_lower(GRPC_VERSION, GRPC_GENERATED_VERSION)
except ImportError:
    _version_not_supported = True

if _version_not_supported:
    raise RuntimeError(
        f'The grpc package installed is at version {GRPC_VERSION},'
        + f' but the generated code in fintekkers/services/transaction_service/transaction_service_pb2_grpc.py depends on'
        + f' grpcio>={GRPC_GENERATED_VERSION}.'
        + f' Please upgrade your grpc module to grpcio>={GRPC_GENERATED_VERSION}'
        + f' or downgrade your generated code using grpcio-tools<={GRPC_VERSION}.'
    )


class TransactionStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.CreateOrUpdate = channel.unary_unary(
                '/fintekkers.services.transaction_service.Transaction/CreateOrUpdate',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__response__pb2.CreateTransactionResponseProto.FromString,
                _registered_method=True)
        self.GetByIds = channel.unary_unary(
                '/fintekkers.services.transaction_service.Transaction/GetByIds',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
                _registered_method=True)
        self.Search = channel.unary_stream(
                '/fintekkers.services.transaction_service.Transaction/Search',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
                _registered_method=True)
        self.ListIds = channel.unary_unary(
                '/fintekkers.services.transaction_service.Transaction/ListIds',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
                _registered_method=True)
        self.ValidateCreateOrUpdate = channel.unary_unary(
                '/fintekkers.services.transaction_service.Transaction/ValidateCreateOrUpdate',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
                _registered_method=True)
        self.ValidateQueryRequest = channel.unary_unary(
                '/fintekkers.services.transaction_service.Transaction/ValidateQueryRequest',
                request_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
                _registered_method=True)


class TransactionServicer(object):
    """Missing associated documentation comment in .proto file."""

    def CreateOrUpdate(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetByIds(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def Search(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ListIds(self, request, context):
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


def add_TransactionServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'CreateOrUpdate': grpc.unary_unary_rpc_method_handler(
                    servicer.CreateOrUpdate,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__response__pb2.CreateTransactionResponseProto.SerializeToString,
            ),
            'GetByIds': grpc.unary_unary_rpc_method_handler(
                    servicer.GetByIds,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.SerializeToString,
            ),
            'Search': grpc.unary_stream_rpc_method_handler(
                    servicer.Search,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.SerializeToString,
            ),
            'ListIds': grpc.unary_unary_rpc_method_handler(
                    servicer.ListIds,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.SerializeToString,
            ),
            'ValidateCreateOrUpdate': grpc.unary_unary_rpc_method_handler(
                    servicer.ValidateCreateOrUpdate,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.SerializeToString,
            ),
            'ValidateQueryRequest': grpc.unary_unary_rpc_method_handler(
                    servicer.ValidateQueryRequest,
                    request_deserializer=fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'fintekkers.services.transaction_service.Transaction', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('fintekkers.services.transaction_service.Transaction', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class Transaction(object):
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
        return grpc.experimental.unary_unary(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/CreateOrUpdate',
            fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_transaction_dot_create__transaction__response__pb2.CreateTransactionResponseProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def GetByIds(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/GetByIds',
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

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
        return grpc.experimental.unary_stream(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/Search',
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def ListIds(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/ListIds',
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__response__pb2.QueryTransactionResponseProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

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
        return grpc.experimental.unary_unary(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/ValidateCreateOrUpdate',
            fintekkers_dot_requests_dot_transaction_dot_create__transaction__request__pb2.CreateTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

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
        return grpc.experimental.unary_unary(
            request,
            target,
            '/fintekkers.services.transaction_service.Transaction/ValidateQueryRequest',
            fintekkers_dot_requests_dot_transaction_dot_query__transaction__request__pb2.QueryTransactionRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_util_dot_errors_dot_summary__pb2.SummaryProto.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
