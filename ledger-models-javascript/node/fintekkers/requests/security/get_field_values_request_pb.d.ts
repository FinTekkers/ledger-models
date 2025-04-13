// package: fintekkers.requests.security
// file: fintekkers/requests/security/get_field_values_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_field_pb from "../../../fintekkers/models/position/field_pb";

export class GetFieldValuesRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): GetFieldValuesRequestProto;
    getVersion(): string;
    setVersion(value: string): GetFieldValuesRequestProto;
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
        objectClass: string,
        version: string,
        field: fintekkers_models_position_field_pb.FieldProto,
    }
}
