// package: fintekkers.requests.util
// file: fintekkers/requests/util/delete_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";

export class AffectedEntityProto extends jspb.Message { 
    getEntityType(): EntityTypeProto;
    setEntityType(value: EntityTypeProto): AffectedEntityProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): AffectedEntityProto;
    getDescription(): string;
    setDescription(value: string): AffectedEntityProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AffectedEntityProto.AsObject;
    static toObject(includeInstance: boolean, msg: AffectedEntityProto): AffectedEntityProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AffectedEntityProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AffectedEntityProto;
    static deserializeBinaryFromReader(message: AffectedEntityProto, reader: jspb.BinaryReader): AffectedEntityProto;
}

export namespace AffectedEntityProto {
    export type AsObject = {
        entityType: EntityTypeProto,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        description: string,
    }
}

export class DeleteRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): DeleteRequestProto;
    getVersion(): string;
    setVersion(value: string): DeleteRequestProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): DeleteRequestProto;
    getEntityType(): EntityTypeProto;
    setEntityType(value: EntityTypeProto): DeleteRequestProto;
    getDryRun(): boolean;
    setDryRun(value: boolean): DeleteRequestProto;
    getCascade(): boolean;
    setCascade(value: boolean): DeleteRequestProto;
    getForce(): boolean;
    setForce(value: boolean): DeleteRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRequestProto): DeleteRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRequestProto;
    static deserializeBinaryFromReader(message: DeleteRequestProto, reader: jspb.BinaryReader): DeleteRequestProto;
}

export namespace DeleteRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        entityType: EntityTypeProto,
        dryRun: boolean,
        cascade: boolean,
        force: boolean,
    }
}

export class DeleteResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): DeleteResponseProto;
    getVersion(): string;
    setVersion(value: string): DeleteResponseProto;

    hasDeleteRequest(): boolean;
    clearDeleteRequest(): void;
    getDeleteRequest(): DeleteRequestProto | undefined;
    setDeleteRequest(value?: DeleteRequestProto): DeleteResponseProto;
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteResponseProto;
    getWasDryRun(): boolean;
    setWasDryRun(value: boolean): DeleteResponseProto;
    getTotalCount(): number;
    setTotalCount(value: number): DeleteResponseProto;
    clearAffectedEntitiesList(): void;
    getAffectedEntitiesList(): Array<AffectedEntityProto>;
    setAffectedEntitiesList(value: Array<AffectedEntityProto>): DeleteResponseProto;
    addAffectedEntities(value?: AffectedEntityProto, index?: number): AffectedEntityProto;
    clearWarningsList(): void;
    getWarningsList(): Array<string>;
    setWarningsList(value: Array<string>): DeleteResponseProto;
    addWarnings(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteResponseProto): DeleteResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteResponseProto;
    static deserializeBinaryFromReader(message: DeleteResponseProto, reader: jspb.BinaryReader): DeleteResponseProto;
}

export namespace DeleteResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        deleteRequest?: DeleteRequestProto.AsObject,
        success: boolean,
        wasDryRun: boolean,
        totalCount: number,
        affectedEntitiesList: Array<AffectedEntityProto.AsObject>,
        warningsList: Array<string>,
    }
}

export enum EntityTypeProto {
    UNKNOWN_ENTITY = 0,
    SECURITY = 1,
    PORTFOLIO = 2,
    TRANSACTION = 3,
    PRICE = 4,
    POSITION = 5,
}
