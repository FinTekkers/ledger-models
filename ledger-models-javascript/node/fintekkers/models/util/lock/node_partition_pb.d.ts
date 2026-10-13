// package: fintekkers.models.util.lock
// file: fintekkers/models/util/lock/node_partition.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../../fintekkers/models/util/version_pb";

export class NodePartition extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): NodePartition;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): NodePartition;
    getPartition(): number;
    setPartition(value: number): NodePartition;
    getNamespace(): string;
    setNamespace(value: string): NodePartition;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodePartition.AsObject;
    static toObject(includeInstance: boolean, msg: NodePartition): NodePartition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodePartition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodePartition;
    static deserializeBinaryFromReader(message: NodePartition, reader: jspb.BinaryReader): NodePartition;
}

export namespace NodePartition {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        partition: number,
        namespace: string,
    }
}
