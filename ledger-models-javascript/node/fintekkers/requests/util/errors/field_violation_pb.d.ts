// package: fintekkers.requests.util.errors
// file: fintekkers/requests/util/errors/field_violation.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../../fintekkers/models/util/uuid_pb";

export class FieldViolationProto extends jspb.Message { 
    getField(): string;
    setField(value: string): FieldViolationProto;

    hasObjectId(): boolean;
    clearObjectId(): void;
    getObjectId(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setObjectId(value?: fintekkers_models_util_uuid_pb.UUIDProto): FieldViolationProto;
    getMessage(): string;
    setMessage(value: string): FieldViolationProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FieldViolationProto.AsObject;
    static toObject(includeInstance: boolean, msg: FieldViolationProto): FieldViolationProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FieldViolationProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FieldViolationProto;
    static deserializeBinaryFromReader(message: FieldViolationProto, reader: jspb.BinaryReader): FieldViolationProto;
}

export namespace FieldViolationProto {
    export type AsObject = {
        field: string,
        objectId?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        message: string,
    }
}
