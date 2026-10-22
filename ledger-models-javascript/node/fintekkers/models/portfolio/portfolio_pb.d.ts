// package: fintekkers.models.portfolio
// file: fintekkers/models/portfolio/portfolio.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_portfolio_amortisation_elections_pb from "../../../fintekkers/models/portfolio/amortisation_elections_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class PortfolioProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): PortfolioProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): PortfolioProto;

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

    hasAmortisationElections(): boolean;
    clearAmortisationElections(): void;
    getAmortisationElections(): fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto | undefined;
    setAmortisationElections(value?: fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto): PortfolioProto;

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
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        portfolioName: string,
        amortisationElections?: fintekkers_models_portfolio_amortisation_elections_pb.AmortisationElectionsProto.AsObject,
    }
}
