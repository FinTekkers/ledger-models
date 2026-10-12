// package: fintekkers.requests.index_composition
// file: fintekkers/requests/index_composition/get_index_composition_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_security_index_composition_pb from "../../../fintekkers/models/security/index_composition_pb";
import * as fintekkers_requests_util_operation_pb from "../../../fintekkers/requests/util/operation_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class GetIndexCompositionRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): GetIndexCompositionRequestProto;
    getVersion(): string;
    setVersion(value: string): GetIndexCompositionRequestProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetIndexCompositionRequestProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): GetIndexCompositionRequestProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): GetIndexCompositionRequestProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): GetIndexCompositionRequestProto;

    hasIndexUuid(): boolean;
    clearIndexUuid(): void;
    getIndexUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setIndexUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): GetIndexCompositionRequestProto;

    hasAsOfDate(): boolean;
    clearAsOfDate(): void;
    getAsOfDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setAsOfDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): GetIndexCompositionRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetIndexCompositionRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetIndexCompositionRequestProto): GetIndexCompositionRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetIndexCompositionRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetIndexCompositionRequestProto;
    static deserializeBinaryFromReader(message: GetIndexCompositionRequestProto, reader: jspb.BinaryReader): GetIndexCompositionRequestProto;
}

export namespace GetIndexCompositionRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        indexUuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOfDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    }
}

export class GetIndexCompositionResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): GetIndexCompositionResponseProto;
    getVersion(): string;
    setVersion(value: string): GetIndexCompositionResponseProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetIndexCompositionResponseProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): GetIndexCompositionResponseProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): GetIndexCompositionResponseProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): GetIndexCompositionResponseProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): GetIndexCompositionResponseProto;

    hasComposition(): boolean;
    clearComposition(): void;
    getComposition(): fintekkers_models_security_index_composition_pb.IndexCompositionProto | undefined;
    setComposition(value?: fintekkers_models_security_index_composition_pb.IndexCompositionProto): GetIndexCompositionResponseProto;

    hasResolvedEffectiveDate(): boolean;
    clearResolvedEffectiveDate(): void;
    getResolvedEffectiveDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setResolvedEffectiveDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): GetIndexCompositionResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetIndexCompositionResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetIndexCompositionResponseProto): GetIndexCompositionResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetIndexCompositionResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetIndexCompositionResponseProto;
    static deserializeBinaryFromReader(message: GetIndexCompositionResponseProto, reader: jspb.BinaryReader): GetIndexCompositionResponseProto;
}

export namespace GetIndexCompositionResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        composition?: fintekkers_models_security_index_composition_pb.IndexCompositionProto.AsObject,
        resolvedEffectiveDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    }
}
