// package: fintekkers.models.security
// file: fintekkers/models/security/identifier/identifier.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_identifier_identifier_type_pb from "../../../../fintekkers/models/security/identifier/identifier_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";

export class IdentifierProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): IdentifierProto;
    getVersion(): string;
    setVersion(value: string): IdentifierProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): IdentifierProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): IdentifierProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): IdentifierProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): IdentifierProto;
    getIdentifierValue(): string;
    setIdentifierValue(value: string): IdentifierProto;
    getIdentifierType(): fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto;
    setIdentifierType(value: fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto): IdentifierProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentifierProto.AsObject;
    static toObject(includeInstance: boolean, msg: IdentifierProto): IdentifierProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentifierProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentifierProto;
    static deserializeBinaryFromReader(message: IdentifierProto, reader: jspb.BinaryReader): IdentifierProto;
}

export namespace IdentifierProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        identifierValue: string,
        identifierType: fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto,
    }
}
