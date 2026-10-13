// package: fintekkers.requests.security
// file: fintekkers/requests/security/get_fields_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_field_pb from "../../../fintekkers/models/position/field_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class GetFieldsResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetFieldsResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): GetFieldsResponseProto;
    clearFieldsList(): void;
    getFieldsList(): Array<fintekkers_models_position_field_pb.FieldProto>;
    setFieldsList(value: Array<fintekkers_models_position_field_pb.FieldProto>): GetFieldsResponseProto;
    addFields(value: fintekkers_models_position_field_pb.FieldProto, index?: number): fintekkers_models_position_field_pb.FieldProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetFieldsResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetFieldsResponseProto): GetFieldsResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetFieldsResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetFieldsResponseProto;
    static deserializeBinaryFromReader(message: GetFieldsResponseProto, reader: jspb.BinaryReader): GetFieldsResponseProto;
}

export namespace GetFieldsResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        fieldsList: Array<fintekkers_models_position_field_pb.FieldProto>,
    }
}
