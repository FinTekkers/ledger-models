// package: fintekkers.models.util.lock
// file: fintekkers/models/util/lock/node_state.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_timestamp_pb from "../../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_endpoint_pb from "../../../../fintekkers/models/util/endpoint_pb";
import * as fintekkers_models_util_lock_node_partition_pb from "../../../../fintekkers/models/util/lock/node_partition_pb";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../../fintekkers/models/util/version_pb";

export class NodeState extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): NodeState;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): NodeState;

    hasPartition(): boolean;
    clearPartition(): void;
    getPartition(): fintekkers_models_util_lock_node_partition_pb.NodePartition | undefined;
    setPartition(value?: fintekkers_models_util_lock_node_partition_pb.NodePartition): NodeState;

    hasEndPoint(): boolean;
    clearEndPoint(): void;
    getEndPoint(): fintekkers_models_util_endpoint_pb.Endpoint | undefined;
    setEndPoint(value?: fintekkers_models_util_endpoint_pb.Endpoint): NodeState;

    hasLastSeen(): boolean;
    clearLastSeen(): void;
    getLastSeen(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setLastSeen(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): NodeState;
    getIsExpired(): boolean;
    setIsExpired(value: boolean): NodeState;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodeState.AsObject;
    static toObject(includeInstance: boolean, msg: NodeState): NodeState.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodeState, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodeState;
    static deserializeBinaryFromReader(message: NodeState, reader: jspb.BinaryReader): NodeState;
}

export namespace NodeState {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        partition?: fintekkers_models_util_lock_node_partition_pb.NodePartition.AsObject,
        endPoint?: fintekkers_models_util_endpoint_pb.Endpoint.AsObject,
        lastSeen?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isExpired: boolean,
    }
}
