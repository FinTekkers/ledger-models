// package: fintekkers.requests.security
// file: fintekkers/requests/security/create_security_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class CreateSecurityRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreateSecurityRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): CreateSecurityRequestProto;

    hasSecurityInput(): boolean;
    clearSecurityInput(): void;
    getSecurityInput(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurityInput(value?: fintekkers_models_security_security_pb.SecurityProto): CreateSecurityRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSecurityRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSecurityRequestProto): CreateSecurityRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSecurityRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSecurityRequestProto;
    static deserializeBinaryFromReader(message: CreateSecurityRequestProto, reader: jspb.BinaryReader): CreateSecurityRequestProto;
}

export namespace CreateSecurityRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        securityInput?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
    }
}
