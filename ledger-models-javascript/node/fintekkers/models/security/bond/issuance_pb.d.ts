// package: fintekkers.models.security.bond
// file: fintekkers/models/security/bond/issuance.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_bond_auction_type_pb from "../../../../fintekkers/models/security/bond/auction_type_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../../fintekkers/models/util/local_timestamp_pb";

export class IssuanceProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): IssuanceProto;
    getVersion(): string;
    setVersion(value: string): IssuanceProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IssuanceProto;

    hasAuctionAnnouncementDate(): boolean;
    clearAuctionAnnouncementDate(): void;
    getAuctionAnnouncementDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setAuctionAnnouncementDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): IssuanceProto;

    hasAuctionIssueDate(): boolean;
    clearAuctionIssueDate(): void;
    getAuctionIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setAuctionIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): IssuanceProto;

    hasPreauctionOutstandingQuantity(): boolean;
    clearPreauctionOutstandingQuantity(): void;
    getPreauctionOutstandingQuantity(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setPreauctionOutstandingQuantity(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;

    hasAuctionOfferingAmount(): boolean;
    clearAuctionOfferingAmount(): void;
    getAuctionOfferingAmount(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setAuctionOfferingAmount(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;
    getAuctionType(): fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto;
    setAuctionType(value: fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto): IssuanceProto;

    hasPriceForSinglePriceAuction(): boolean;
    clearPriceForSinglePriceAuction(): void;
    getPriceForSinglePriceAuction(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setPriceForSinglePriceAuction(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IssuanceProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IssuanceProto.AsObject;
    static toObject(includeInstance: boolean, msg: IssuanceProto): IssuanceProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IssuanceProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IssuanceProto;
    static deserializeBinaryFromReader(message: IssuanceProto, reader: jspb.BinaryReader): IssuanceProto;
}

export namespace IssuanceProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        auctionAnnouncementDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        auctionIssueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        preauctionOutstandingQuantity?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        auctionOfferingAmount?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        auctionType: fintekkers_models_security_bond_auction_type_pb.AuctionTypeProto,
        priceForSinglePriceAuction?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
