// package: fintekkers.models.security
// file: fintekkers/models/security/security_id.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";

export class SecurityIdProto extends jspb.Message { 

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): SecurityIdProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityIdProto.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityIdProto): SecurityIdProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityIdProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityIdProto;
    static deserializeBinaryFromReader(message: SecurityIdProto, reader: jspb.BinaryReader): SecurityIdProto;
}

export namespace SecurityIdProto {
    export type AsObject = {
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
    }
}
