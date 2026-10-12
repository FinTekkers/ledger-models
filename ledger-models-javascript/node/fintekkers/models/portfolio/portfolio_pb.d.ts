// package: fintekkers.models.portfolio
// file: fintekkers/models/portfolio/portfolio.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class PortfolioProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): PortfolioProto;
    getVersion(): string;
    setVersion(value: string): PortfolioProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): PortfolioProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): PortfolioProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): PortfolioProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): PortfolioProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): PortfolioProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): PortfolioProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PortfolioProto;
    getPortfolioName(): string;
    setPortfolioName(value: string): PortfolioProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PortfolioProto.AsObject;
    static toObject(includeInstance: boolean, msg: PortfolioProto): PortfolioProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PortfolioProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PortfolioProto;
    static deserializeBinaryFromReader(message: PortfolioProto, reader: jspb.BinaryReader): PortfolioProto;
}

export namespace PortfolioProto {
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
        portfolioName: string,
    }
}
