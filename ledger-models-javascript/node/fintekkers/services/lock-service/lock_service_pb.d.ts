// package: fintekkers.services.lock_service
// file: fintekkers/services/lock-service/lock_service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../fintekkers/requests/util/lock/lock_request_pb";
import * as fintekkers_requests_util_lock_lock_response_pb from "../../../fintekkers/requests/util/lock/lock_response_pb";
import * as fintekkers_models_util_lock_node_partition_pb from "../../../fintekkers/models/util/lock/node_partition_pb";
import * as fintekkers_models_util_lock_node_state_pb from "../../../fintekkers/models/util/lock/node_state_pb";

export class NamespaceList extends jspb.Message { 
    clearNamespacesList(): void;
    getNamespacesList(): Array<string>;
    setNamespacesList(value: Array<string>): NamespaceList;
    addNamespaces(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NamespaceList.AsObject;
    static toObject(includeInstance: boolean, msg: NamespaceList): NamespaceList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NamespaceList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NamespaceList;
    static deserializeBinaryFromReader(message: NamespaceList, reader: jspb.BinaryReader): NamespaceList;
}

export namespace NamespaceList {
    export type AsObject = {
        namespacesList: Array<string>,
    }
}

export class PartitionsList extends jspb.Message { 
    clearPartitionsList(): void;
    getPartitionsList(): Array<fintekkers_models_util_lock_node_partition_pb.NodePartition>;
    setPartitionsList(value: Array<fintekkers_models_util_lock_node_partition_pb.NodePartition>): PartitionsList;
    addPartitions(value?: fintekkers_models_util_lock_node_partition_pb.NodePartition, index?: number): fintekkers_models_util_lock_node_partition_pb.NodePartition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PartitionsList.AsObject;
    static toObject(includeInstance: boolean, msg: PartitionsList): PartitionsList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PartitionsList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PartitionsList;
    static deserializeBinaryFromReader(message: PartitionsList, reader: jspb.BinaryReader): PartitionsList;
}

export namespace PartitionsList {
    export type AsObject = {
        partitionsList: Array<fintekkers_models_util_lock_node_partition_pb.NodePartition.AsObject>,
    }
}

export class NodeStateList extends jspb.Message { 
    clearNodesList(): void;
    getNodesList(): Array<fintekkers_models_util_lock_node_state_pb.NodeState>;
    setNodesList(value: Array<fintekkers_models_util_lock_node_state_pb.NodeState>): NodeStateList;
    addNodes(value?: fintekkers_models_util_lock_node_state_pb.NodeState, index?: number): fintekkers_models_util_lock_node_state_pb.NodeState;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodeStateList.AsObject;
    static toObject(includeInstance: boolean, msg: NodeStateList): NodeStateList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodeStateList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodeStateList;
    static deserializeBinaryFromReader(message: NodeStateList, reader: jspb.BinaryReader): NodeStateList;
}

export namespace NodeStateList {
    export type AsObject = {
        nodesList: Array<fintekkers_models_util_lock_node_state_pb.NodeState.AsObject>,
    }
}

export class CreateNamespaceRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateNamespaceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateNamespaceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateNamespaceRequest): CreateNamespaceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateNamespaceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateNamespaceRequest;
    static deserializeBinaryFromReader(message: CreateNamespaceRequest, reader: jspb.BinaryReader): CreateNamespaceRequest;
}

export namespace CreateNamespaceRequest {
    export type AsObject = {
        name: string,
    }
}

export class CreatePartitionRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreatePartitionRequest;
    getPartition(): number;
    setPartition(value: number): CreatePartitionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePartitionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePartitionRequest): CreatePartitionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePartitionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePartitionRequest;
    static deserializeBinaryFromReader(message: CreatePartitionRequest, reader: jspb.BinaryReader): CreatePartitionRequest;
}

export namespace CreatePartitionRequest {
    export type AsObject = {
        name: string,
        partition: number,
    }
}
