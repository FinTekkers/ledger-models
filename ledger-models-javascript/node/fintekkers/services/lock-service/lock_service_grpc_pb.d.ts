// package: fintekkers.services.lock_service
// file: fintekkers/services/lock-service/lock_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_lock_service_lock_service_pb from "../../../fintekkers/services/lock-service/lock_service_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../fintekkers/requests/util/lock/lock_request_pb";
import * as fintekkers_requests_util_lock_lock_response_pb from "../../../fintekkers/requests/util/lock/lock_response_pb";
import * as fintekkers_models_util_lock_node_partition_pb from "../../../fintekkers/models/util/lock/node_partition_pb";
import * as fintekkers_models_util_lock_node_state_pb from "../../../fintekkers/models/util/lock/node_state_pb";

interface ILockService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    claimLock: ILockService_IClaimLock;
    subscribeToLockUpdates: ILockService_ISubscribeToLockUpdates;
    createNamespace: ILockService_ICreateNamespace;
    createPartition: ILockService_ICreatePartition;
    listNamespaces: ILockService_IListNamespaces;
    listPartitions: ILockService_IListPartitions;
    getAllPartitionStatus: ILockService_IGetAllPartitionStatus;
    getAllPartitionStatusForNamespaces: ILockService_IGetAllPartitionStatusForNamespaces;
    getPartitionStatus: ILockService_IGetPartitionStatus;
}

interface ILockService_IClaimLock extends grpc.MethodDefinition<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, fintekkers_requests_util_lock_lock_response_pb.LockResponseProto> {
    path: "/fintekkers.services.lock_service.Lock/ClaimLock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
}
interface ILockService_ISubscribeToLockUpdates extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, fintekkers_models_util_lock_node_state_pb.NodeState> {
    path: "/fintekkers.services.lock_service.Lock/SubscribeToLockUpdates";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<fintekkers_models_util_lock_node_state_pb.NodeState>;
    responseDeserialize: grpc.deserialize<fintekkers_models_util_lock_node_state_pb.NodeState>;
}
interface ILockService_ICreateNamespace extends grpc.MethodDefinition<fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, google_protobuf_empty_pb.Empty> {
    path: "/fintekkers.services.lock_service.Lock/CreateNamespace";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest>;
    requestDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface ILockService_ICreatePartition extends grpc.MethodDefinition<fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, google_protobuf_empty_pb.Empty> {
    path: "/fintekkers.services.lock_service.Lock/CreatePartition";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest>;
    requestDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest>;
    responseSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    responseDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
}
interface ILockService_IListNamespaces extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, fintekkers_services_lock_service_lock_service_pb.NamespaceList> {
    path: "/fintekkers.services.lock_service.Lock/ListNamespaces";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    responseDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
}
interface ILockService_IListPartitions extends grpc.MethodDefinition<fintekkers_services_lock_service_lock_service_pb.NamespaceList, fintekkers_services_lock_service_lock_service_pb.PartitionsList> {
    path: "/fintekkers.services.lock_service.Lock/ListPartitions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    requestDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    responseSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.PartitionsList>;
    responseDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.PartitionsList>;
}
interface ILockService_IGetAllPartitionStatus extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, fintekkers_services_lock_service_lock_service_pb.NodeStateList> {
    path: "/fintekkers.services.lock_service.Lock/GetAllPartitionStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
    responseDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
}
interface ILockService_IGetAllPartitionStatusForNamespaces extends grpc.MethodDefinition<fintekkers_services_lock_service_lock_service_pb.NamespaceList, fintekkers_services_lock_service_lock_service_pb.NodeStateList> {
    path: "/fintekkers.services.lock_service.Lock/GetAllPartitionStatusForNamespaces";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    requestDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    responseSerialize: grpc.serialize<fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
    responseDeserialize: grpc.deserialize<fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
}
interface ILockService_IGetPartitionStatus extends grpc.MethodDefinition<fintekkers_models_util_lock_node_partition_pb.NodePartition, fintekkers_models_util_lock_node_state_pb.NodeState> {
    path: "/fintekkers.services.lock_service.Lock/GetPartitionStatus";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_models_util_lock_node_partition_pb.NodePartition>;
    requestDeserialize: grpc.deserialize<fintekkers_models_util_lock_node_partition_pb.NodePartition>;
    responseSerialize: grpc.serialize<fintekkers_models_util_lock_node_state_pb.NodeState>;
    responseDeserialize: grpc.deserialize<fintekkers_models_util_lock_node_state_pb.NodeState>;
}

export const LockService: ILockService;

export interface ILockServer extends grpc.UntypedServiceImplementation {
    claimLock: grpc.handleUnaryCall<fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, fintekkers_requests_util_lock_lock_response_pb.LockResponseProto>;
    subscribeToLockUpdates: grpc.handleServerStreamingCall<google_protobuf_empty_pb.Empty, fintekkers_models_util_lock_node_state_pb.NodeState>;
    createNamespace: grpc.handleUnaryCall<fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, google_protobuf_empty_pb.Empty>;
    createPartition: grpc.handleUnaryCall<fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, google_protobuf_empty_pb.Empty>;
    listNamespaces: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, fintekkers_services_lock_service_lock_service_pb.NamespaceList>;
    listPartitions: grpc.handleUnaryCall<fintekkers_services_lock_service_lock_service_pb.NamespaceList, fintekkers_services_lock_service_lock_service_pb.PartitionsList>;
    getAllPartitionStatus: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
    getAllPartitionStatusForNamespaces: grpc.handleUnaryCall<fintekkers_services_lock_service_lock_service_pb.NamespaceList, fintekkers_services_lock_service_lock_service_pb.NodeStateList>;
    getPartitionStatus: grpc.handleUnaryCall<fintekkers_models_util_lock_node_partition_pb.NodePartition, fintekkers_models_util_lock_node_state_pb.NodeState>;
}

export interface ILockClient {
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    subscribeToLockUpdates(request: google_protobuf_empty_pb.Empty, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;
    subscribeToLockUpdates(request: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;
    createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    listNamespaces(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    listNamespaces(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    listNamespaces(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
    getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
    getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
}

export class LockClient extends grpc.Client implements ILockClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    public claimLock(request: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_lock_lock_response_pb.LockResponseProto) => void): grpc.ClientUnaryCall;
    public subscribeToLockUpdates(request: google_protobuf_empty_pb.Empty, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;
    public subscribeToLockUpdates(request: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_models_util_lock_node_state_pb.NodeState>;
    public createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public createNamespace(request: fintekkers_services_lock_service_lock_service_pb.CreateNamespaceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public createPartition(request: fintekkers_services_lock_service_lock_service_pb.CreatePartitionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: google_protobuf_empty_pb.Empty) => void): grpc.ClientUnaryCall;
    public listNamespaces(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    public listNamespaces(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    public listNamespaces(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NamespaceList) => void): grpc.ClientUnaryCall;
    public listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    public listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    public listPartitions(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.PartitionsList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatus(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getAllPartitionStatusForNamespaces(request: fintekkers_services_lock_service_lock_service_pb.NamespaceList, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_services_lock_service_lock_service_pb.NodeStateList) => void): grpc.ClientUnaryCall;
    public getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
    public getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
    public getPartitionStatus(request: fintekkers_models_util_lock_node_partition_pb.NodePartition, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_models_util_lock_node_state_pb.NodeState) => void): grpc.ClientUnaryCall;
}
