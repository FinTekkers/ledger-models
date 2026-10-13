// package: fintekkers.requests.security
// file: fintekkers/requests/security/get_field_values_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_field_pb from "../../../fintekkers/models/position/field_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class GetFieldValuesRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetFieldValuesRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): GetFieldValuesRequestProto;
    getField(): fintekkers_models_position_field_pb.FieldProto;
    setField(value: fintekkers_models_position_field_pb.FieldProto): GetFieldValuesRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFieldValuesRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetFieldValuesRequestProto): GetFieldValuesRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFieldValuesRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFieldValuesRequestProto;
    static deserializeBinaryFromReader(message: GetFieldValuesRequestProto, reader: jspb.BinaryReader): GetFieldValuesRequestProto;
}

export namespace GetFieldValuesRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        field: fintekkers_models_position_field_pb.FieldProto,
    }
}
