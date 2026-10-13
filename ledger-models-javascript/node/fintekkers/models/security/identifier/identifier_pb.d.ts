// package: fintekkers.models.security
// file: fintekkers/models/security/identifier/identifier.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_identifier_identifier_type_pb from "../../../../fintekkers/models/security/identifier/identifier_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../../fintekkers/models/util/version_pb";

export class IdentifierProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): IdentifierProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): IdentifierProto;
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
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        identifierValue: string,
        identifierType: fintekkers_models_security_identifier_identifier_type_pb.IdentifierTypeProto,
    }
}
