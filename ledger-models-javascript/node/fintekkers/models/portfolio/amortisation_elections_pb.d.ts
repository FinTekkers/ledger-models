// package: fintekkers.models.portfolio
// file: fintekkers/models/portfolio/amortisation_elections.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class AmortisationElectionsProto extends jspb.Message { 
    getBondPremium(): PremiumAmortisationElectionProto;
    setBondPremium(value: PremiumAmortisationElectionProto): AmortisationElectionsProto;
    getMarketDiscountInclusion(): MarketDiscountInclusionProto;
    setMarketDiscountInclusion(value: MarketDiscountInclusionProto): AmortisationElectionsProto;
    getMarketDiscountAccrual(): MarketDiscountAccrualMethodProto;
    setMarketDiscountAccrual(value: MarketDiscountAccrualMethodProto): AmortisationElectionsProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AmortisationElectionsProto.AsObject;
    static toObject(includeInstance: boolean, msg: AmortisationElectionsProto): AmortisationElectionsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AmortisationElectionsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AmortisationElectionsProto;
    static deserializeBinaryFromReader(message: AmortisationElectionsProto, reader: jspb.BinaryReader): AmortisationElectionsProto;
}

export namespace AmortisationElectionsProto {
    export type AsObject = {
        bondPremium: PremiumAmortisationElectionProto,
        marketDiscountInclusion: MarketDiscountInclusionProto,
        marketDiscountAccrual: MarketDiscountAccrualMethodProto,
    }
}

export enum PremiumAmortisationElectionProto {
    UNSPECIFIED_PREMIUM_ELECTION = 0,
    PREMIUM_ELECTED = 1,
    PREMIUM_NOT_ELECTED = 2,
}

export enum MarketDiscountInclusionProto {
    UNSPECIFIED_MARKET_DISCOUNT_INCLUSION = 0,
    AT_DISPOSITION = 1,
    INCLUDE_CURRENTLY = 2,
}

export enum MarketDiscountAccrualMethodProto {
    UNSPECIFIED_ACCRUAL_METHOD = 0,
    RATABLE = 1,
    CONSTANT_YIELD = 2,
}
