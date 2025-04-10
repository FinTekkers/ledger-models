# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings

from fintekkers.models.util.lock import node_partition_pb2 as fintekkers_dot_models_dot_util_dot_lock_dot_node__partition__pb2
from fintekkers.models.util.lock import node_state_pb2 as fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2
from fintekkers.requests.util.lock import lock_request_pb2 as fintekkers_dot_requests_dot_util_dot_lock_dot_lock__request__pb2
from fintekkers.requests.util.lock import lock_response_pb2 as fintekkers_dot_requests_dot_util_dot_lock_dot_lock__response__pb2
from fintekkers.services.lock_service import lock_service_pb2 as fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2
from google.protobuf import empty_pb2 as google_dot_protobuf_dot_empty__pb2

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
        + f' but the generated code in fintekkers/services/lock_service/lock_service_pb2_grpc.py depends on'
        + f' grpcio>={GRPC_GENERATED_VERSION}.'
        + f' Please upgrade your grpc module to grpcio>={GRPC_GENERATED_VERSION}'
        + f' or downgrade your generated code using grpcio-tools<={GRPC_VERSION}.'
    )


class LockStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.ClaimLock = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/ClaimLock',
                request_serializer=fintekkers_dot_requests_dot_util_dot_lock_dot_lock__request__pb2.LockRequestProto.SerializeToString,
                response_deserializer=fintekkers_dot_requests_dot_util_dot_lock_dot_lock__response__pb2.LockResponseProto.FromString,
                _registered_method=True)
        self.SubscribeToLockUpdates = channel.unary_stream(
                '/fintekkers.services.lock_service.Lock/SubscribeToLockUpdates',
                request_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
                response_deserializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.FromString,
                _registered_method=True)
        self.CreateNamespace = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/CreateNamespace',
                request_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreateNamespaceRequest.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                _registered_method=True)
        self.CreatePartition = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/CreatePartition',
                request_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreatePartitionRequest.SerializeToString,
                response_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                _registered_method=True)
        self.ListNamespaces = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/ListNamespaces',
                request_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
                response_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.FromString,
                _registered_method=True)
        self.ListPartitions = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/ListPartitions',
                request_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.SerializeToString,
                response_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.PartitionsList.FromString,
                _registered_method=True)
        self.GetAllPartitionStatus = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/GetAllPartitionStatus',
                request_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
                response_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.FromString,
                _registered_method=True)
        self.GetAllPartitionStatusForNamespaces = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/GetAllPartitionStatusForNamespaces',
                request_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.SerializeToString,
                response_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.FromString,
                _registered_method=True)
        self.GetPartitionStatus = channel.unary_unary(
                '/fintekkers.services.lock_service.Lock/GetPartitionStatus',
                request_serializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__partition__pb2.NodePartition.SerializeToString,
                response_deserializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.FromString,
                _registered_method=True)


class LockServicer(object):
    """Missing associated documentation comment in .proto file."""

    def ClaimLock(self, request, context):
        """Allows a Fintekkers service to claim the lock for a partition. 
        See {fintekkers.request.util.lock.LockRequestProto} for details
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def SubscribeToLockUpdates(self, request, context):
        """Streams any change in lock owner for any namespace/partition to the subscriber. 
        Heartbeat updates are not streamed to subscribers. If a subsciber wants to build an in-memory cache of parition state
        they should first subscribe to lock updates, then query the G
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def CreateNamespace(self, request, context):
        """Create a namespace
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def CreatePartition(self, request, context):
        """Create a partition
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ListNamespaces(self, request, context):
        """Lists the possible namespaces
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ListPartitions(self, request, context):
        """Lists all partitions for the given list of namespaces
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetAllPartitionStatus(self, request, context):
        """Returns the current status of all nodes, across all namespaces and partitions.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetAllPartitionStatusForNamespaces(self, request, context):
        """Returns the current status of all nodes, across all namespaces and partitions.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetPartitionStatus(self, request, context):
        """In namespace / parition
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_LockServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'ClaimLock': grpc.unary_unary_rpc_method_handler(
                    servicer.ClaimLock,
                    request_deserializer=fintekkers_dot_requests_dot_util_dot_lock_dot_lock__request__pb2.LockRequestProto.FromString,
                    response_serializer=fintekkers_dot_requests_dot_util_dot_lock_dot_lock__response__pb2.LockResponseProto.SerializeToString,
            ),
            'SubscribeToLockUpdates': grpc.unary_stream_rpc_method_handler(
                    servicer.SubscribeToLockUpdates,
                    request_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                    response_serializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.SerializeToString,
            ),
            'CreateNamespace': grpc.unary_unary_rpc_method_handler(
                    servicer.CreateNamespace,
                    request_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreateNamespaceRequest.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
            'CreatePartition': grpc.unary_unary_rpc_method_handler(
                    servicer.CreatePartition,
                    request_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreatePartitionRequest.FromString,
                    response_serializer=google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            ),
            'ListNamespaces': grpc.unary_unary_rpc_method_handler(
                    servicer.ListNamespaces,
                    request_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                    response_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.SerializeToString,
            ),
            'ListPartitions': grpc.unary_unary_rpc_method_handler(
                    servicer.ListPartitions,
                    request_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.FromString,
                    response_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.PartitionsList.SerializeToString,
            ),
            'GetAllPartitionStatus': grpc.unary_unary_rpc_method_handler(
                    servicer.GetAllPartitionStatus,
                    request_deserializer=google_dot_protobuf_dot_empty__pb2.Empty.FromString,
                    response_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.SerializeToString,
            ),
            'GetAllPartitionStatusForNamespaces': grpc.unary_unary_rpc_method_handler(
                    servicer.GetAllPartitionStatusForNamespaces,
                    request_deserializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.FromString,
                    response_serializer=fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.SerializeToString,
            ),
            'GetPartitionStatus': grpc.unary_unary_rpc_method_handler(
                    servicer.GetPartitionStatus,
                    request_deserializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__partition__pb2.NodePartition.FromString,
                    response_serializer=fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'fintekkers.services.lock_service.Lock', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('fintekkers.services.lock_service.Lock', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class Lock(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def ClaimLock(request,
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
            '/fintekkers.services.lock_service.Lock/ClaimLock',
            fintekkers_dot_requests_dot_util_dot_lock_dot_lock__request__pb2.LockRequestProto.SerializeToString,
            fintekkers_dot_requests_dot_util_dot_lock_dot_lock__response__pb2.LockResponseProto.FromString,
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
    def SubscribeToLockUpdates(request,
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
            '/fintekkers.services.lock_service.Lock/SubscribeToLockUpdates',
            google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.FromString,
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
    def CreateNamespace(request,
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
            '/fintekkers.services.lock_service.Lock/CreateNamespace',
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreateNamespaceRequest.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
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
    def CreatePartition(request,
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
            '/fintekkers.services.lock_service.Lock/CreatePartition',
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.CreatePartitionRequest.SerializeToString,
            google_dot_protobuf_dot_empty__pb2.Empty.FromString,
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
    def ListNamespaces(request,
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
            '/fintekkers.services.lock_service.Lock/ListNamespaces',
            google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.FromString,
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
    def ListPartitions(request,
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
            '/fintekkers.services.lock_service.Lock/ListPartitions',
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.SerializeToString,
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.PartitionsList.FromString,
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
    def GetAllPartitionStatus(request,
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
            '/fintekkers.services.lock_service.Lock/GetAllPartitionStatus',
            google_dot_protobuf_dot_empty__pb2.Empty.SerializeToString,
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.FromString,
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
    def GetAllPartitionStatusForNamespaces(request,
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
            '/fintekkers.services.lock_service.Lock/GetAllPartitionStatusForNamespaces',
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NamespaceList.SerializeToString,
            fintekkers_dot_services_dot_lock__service_dot_lock__service__pb2.NodeStateList.FromString,
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
    def GetPartitionStatus(request,
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
            '/fintekkers.services.lock_service.Lock/GetPartitionStatus',
            fintekkers_dot_models_dot_util_dot_lock_dot_node__partition__pb2.NodePartition.SerializeToString,
            fintekkers_dot_models_dot_util_dot_lock_dot_node__state__pb2.NodeState.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
