// package: fintekkers.requests.util.lock
// file: fintekkers/requests/util/lock/lock_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_lock_node_partition_pb from "../../../../fintekkers/models/util/lock/node_partition_pb";
import * as fintekkers_models_util_endpoint_pb from "../../../../fintekkers/models/util/endpoint_pb";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../../fintekkers/models/util/version_pb";

export class LockRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): LockRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): LockRequestProto;

    hasNodePartition(): boolean;
    clearNodePartition(): void;
    getNodePartition(): fintekkers_models_util_lock_node_partition_pb.NodePartition | undefined;
    setNodePartition(value?: fintekkers_models_util_lock_node_partition_pb.NodePartition): LockRequestProto;

    hasEndpoint(): boolean;
    clearEndpoint(): void;
    getEndpoint(): fintekkers_models_util_endpoint_pb.Endpoint | undefined;
    setEndpoint(value?: fintekkers_models_util_endpoint_pb.Endpoint): LockRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: LockRequestProto): LockRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockRequestProto;
    static deserializeBinaryFromReader(message: LockRequestProto, reader: jspb.BinaryReader): LockRequestProto;
}

export namespace LockRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        nodePartition?: fintekkers_models_util_lock_node_partition_pb.NodePartition.AsObject,
        endpoint?: fintekkers_models_util_endpoint_pb.Endpoint.AsObject,
    }
}
