// package: fintekkers.models.strategy
// file: fintekkers/models/strategy/strategy.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class StrategyProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): StrategyProto;
    getVersion(): string;
    setVersion(value: string): StrategyProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): StrategyProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): StrategyProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): StrategyProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): StrategyProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): StrategyProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): StrategyProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyProto;
    getStrategyName(): string;
    setStrategyName(value: string): StrategyProto;

    hasParent(): boolean;
    clearParent(): void;
    getParent(): StrategyProto | undefined;
    setParent(value?: StrategyProto): StrategyProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StrategyProto.AsObject;
    static toObject(includeInstance: boolean, msg: StrategyProto): StrategyProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StrategyProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StrategyProto;
    static deserializeBinaryFromReader(message: StrategyProto, reader: jspb.BinaryReader): StrategyProto;
}

export namespace StrategyProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        strategyName: string,
        parent?: StrategyProto.AsObject,
    }
}
