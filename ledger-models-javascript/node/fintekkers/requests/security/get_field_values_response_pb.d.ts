// package: fintekkers.requests.security
// file: fintekkers/requests/security/get_field_values_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class GetFieldValuesResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetFieldValuesResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): GetFieldValuesResponseProto;
    clearValuesList(): void;
    getValuesList(): Array<google_protobuf_any_pb.Any>;
    setValuesList(value: Array<google_protobuf_any_pb.Any>): GetFieldValuesResponseProto;
    addValues(value?: google_protobuf_any_pb.Any, index?: number): google_protobuf_any_pb.Any;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFieldValuesResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetFieldValuesResponseProto): GetFieldValuesResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFieldValuesResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFieldValuesResponseProto;
    static deserializeBinaryFromReader(message: GetFieldValuesResponseProto, reader: jspb.BinaryReader): GetFieldValuesResponseProto;
}

export namespace GetFieldValuesResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        valuesList: Array<google_protobuf_any_pb.Any.AsObject>,
    }
}
