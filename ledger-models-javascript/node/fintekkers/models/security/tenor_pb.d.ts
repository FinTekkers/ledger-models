// package: fintekkers.models.security
// file: fintekkers/models/security/tenor.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_tenor_type_pb from "../../../fintekkers/models/security/tenor_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class TenorProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): TenorProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): TenorProto;
    getTermValue(): string;
    setTermValue(value: string): TenorProto;
    getTenorType(): fintekkers_models_security_tenor_type_pb.TenorTypeProto;
    setTenorType(value: fintekkers_models_security_tenor_type_pb.TenorTypeProto): TenorProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TenorProto.AsObject;
    static toObject(includeInstance: boolean, msg: TenorProto): TenorProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TenorProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TenorProto;
    static deserializeBinaryFromReader(message: TenorProto, reader: jspb.BinaryReader): TenorProto;
}

export namespace TenorProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        termValue: string,
        tenorType: fintekkers_models_security_tenor_type_pb.TenorTypeProto,
    }
}
