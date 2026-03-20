// package: fintekkers.models.security
// file: fintekkers/models/security/security.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_security_identifier_identifier_pb from "../../../fintekkers/models/security/identifier/identifier_pb";
import * as fintekkers_models_security_bond_issuance_pb from "../../../fintekkers/models/security/bond/issuance_pb";
import * as fintekkers_models_security_security_type_pb from "../../../fintekkers/models/security/security_type_pb";
import * as fintekkers_models_security_security_quantity_type_pb from "../../../fintekkers/models/security/security_quantity_type_pb";
import * as fintekkers_models_security_coupon_frequency_pb from "../../../fintekkers/models/security/coupon_frequency_pb";
import * as fintekkers_models_security_coupon_type_pb from "../../../fintekkers/models/security/coupon_type_pb";
import * as fintekkers_models_security_index_index_type_pb from "../../../fintekkers/models/security/index/index_type_pb";

export class SecurityProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): SecurityProto;
    getVersion(): string;
    setVersion(value: string): SecurityProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): SecurityProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): SecurityProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityProto;
    getSecurityType(): fintekkers_models_security_security_type_pb.SecurityTypeProto;
    setSecurityType(value: fintekkers_models_security_security_type_pb.SecurityTypeProto): SecurityProto;
    getAssetClass(): string;
    setAssetClass(value: string): SecurityProto;
    getIssuerName(): string;
    setIssuerName(value: string): SecurityProto;

    hasSettlementCurrency(): boolean;
    clearSettlementCurrency(): void;
    getSettlementCurrency(): SecurityProto | undefined;
    setSettlementCurrency(value?: SecurityProto): SecurityProto;
    getQuantityType(): fintekkers_models_security_security_quantity_type_pb.SecurityQuantityTypeProto;
    setQuantityType(value: fintekkers_models_security_security_quantity_type_pb.SecurityQuantityTypeProto): SecurityProto;

    hasIdentifier(): boolean;
    clearIdentifier(): void;
    getIdentifier(): fintekkers_models_security_identifier_identifier_pb.IdentifierProto | undefined;
    setIdentifier(value?: fintekkers_models_security_identifier_identifier_pb.IdentifierProto): SecurityProto;
    getDescription(): string;
    setDescription(value: string): SecurityProto;
    getCashId(): string;
    setCashId(value: string): SecurityProto;

    hasCouponRate(): boolean;
    clearCouponRate(): void;
    getCouponRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCouponRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityProto;
    getCouponType(): fintekkers_models_security_coupon_type_pb.CouponTypeProto;
    setCouponType(value: fintekkers_models_security_coupon_type_pb.CouponTypeProto): SecurityProto;
    getCouponFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setCouponFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): SecurityProto;

    hasDatedDate(): boolean;
    clearDatedDate(): void;
    getDatedDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setDatedDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityProto;

    hasFaceValue(): boolean;
    clearFaceValue(): void;
    getFaceValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setFaceValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityProto;

    hasIssueDate(): boolean;
    clearIssueDate(): void;
    getIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityProto;

    hasMaturityDate(): boolean;
    clearMaturityDate(): void;
    getMaturityDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setMaturityDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityProto;
    clearIssuanceInfoList(): void;
    getIssuanceInfoList(): Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>;
    setIssuanceInfoList(value: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>): SecurityProto;
    addIssuanceInfo(value?: fintekkers_models_security_bond_issuance_pb.IssuanceProto, index?: number): fintekkers_models_security_bond_issuance_pb.IssuanceProto;

    hasBaseCpi(): boolean;
    clearBaseCpi(): void;
    getBaseCpi(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setBaseCpi(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityProto;

    hasIndexDate(): boolean;
    clearIndexDate(): void;
    getIndexDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIndexDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityProto;
    getInflationIndexType(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setInflationIndexType(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): SecurityProto;

    hasSpread(): boolean;
    clearSpread(): void;
    getSpread(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setSpread(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityProto;
    getReferenceRateIndex(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setReferenceRateIndex(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): SecurityProto;
    getResetFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setResetFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): SecurityProto;
    getIndexType(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setIndexType(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): SecurityProto;

    hasBondDetails(): boolean;
    clearBondDetails(): void;
    getBondDetails(): BondDetailsProto | undefined;
    setBondDetails(value?: BondDetailsProto): SecurityProto;

    hasTipsDetails(): boolean;
    clearTipsDetails(): void;
    getTipsDetails(): TipsDetailsProto | undefined;
    setTipsDetails(value?: TipsDetailsProto): SecurityProto;

    hasFrnDetails(): boolean;
    clearFrnDetails(): void;
    getFrnDetails(): FrnDetailsProto | undefined;
    setFrnDetails(value?: FrnDetailsProto): SecurityProto;

    hasIndexDetails(): boolean;
    clearIndexDetails(): void;
    getIndexDetails(): IndexDetailsProto | undefined;
    setIndexDetails(value?: IndexDetailsProto): SecurityProto;

    hasEquityDetails(): boolean;
    clearEquityDetails(): void;
    getEquityDetails(): EquityDetailsProto | undefined;
    setEquityDetails(value?: EquityDetailsProto): SecurityProto;

    hasCashDetails(): boolean;
    clearCashDetails(): void;
    getCashDetails(): CashDetailsProto | undefined;
    setCashDetails(value?: CashDetailsProto): SecurityProto;

    getProductDetailsCase(): SecurityProto.ProductDetailsCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityProto.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityProto): SecurityProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityProto;
    static deserializeBinaryFromReader(message: SecurityProto, reader: jspb.BinaryReader): SecurityProto;
}

export namespace SecurityProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        securityType: fintekkers_models_security_security_type_pb.SecurityTypeProto,
        assetClass: string,
        issuerName: string,
        settlementCurrency?: SecurityProto.AsObject,
        quantityType: fintekkers_models_security_security_quantity_type_pb.SecurityQuantityTypeProto,
        identifier?: fintekkers_models_security_identifier_identifier_pb.IdentifierProto.AsObject,
        description: string,
        cashId: string,
        couponRate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        couponType: fintekkers_models_security_coupon_type_pb.CouponTypeProto,
        couponFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
        datedDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        faceValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        issueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        maturityDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        issuanceInfoList: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto.AsObject>,
        baseCpi?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        indexDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        inflationIndexType: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        spread?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        referenceRateIndex: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        resetFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
        indexType: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        bondDetails?: BondDetailsProto.AsObject,
        tipsDetails?: TipsDetailsProto.AsObject,
        frnDetails?: FrnDetailsProto.AsObject,
        indexDetails?: IndexDetailsProto.AsObject,
        equityDetails?: EquityDetailsProto.AsObject,
        cashDetails?: CashDetailsProto.AsObject,
    }

    export enum ProductDetailsCase {
        PRODUCT_DETAILS_NOT_SET = 0,
        BOND_DETAILS = 200,
        TIPS_DETAILS = 201,
        FRN_DETAILS = 202,
        INDEX_DETAILS = 203,
        EQUITY_DETAILS = 204,
        CASH_DETAILS = 205,
    }

}

export class BondDetailsProto extends jspb.Message { 

    hasCouponRate(): boolean;
    clearCouponRate(): void;
    getCouponRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCouponRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): BondDetailsProto;
    getCouponType(): fintekkers_models_security_coupon_type_pb.CouponTypeProto;
    setCouponType(value: fintekkers_models_security_coupon_type_pb.CouponTypeProto): BondDetailsProto;
    getCouponFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setCouponFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): BondDetailsProto;

    hasDatedDate(): boolean;
    clearDatedDate(): void;
    getDatedDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setDatedDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): BondDetailsProto;

    hasFaceValue(): boolean;
    clearFaceValue(): void;
    getFaceValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setFaceValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): BondDetailsProto;

    hasIssueDate(): boolean;
    clearIssueDate(): void;
    getIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): BondDetailsProto;

    hasMaturityDate(): boolean;
    clearMaturityDate(): void;
    getMaturityDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setMaturityDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): BondDetailsProto;
    clearIssuanceInfoList(): void;
    getIssuanceInfoList(): Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>;
    setIssuanceInfoList(value: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>): BondDetailsProto;
    addIssuanceInfo(value?: fintekkers_models_security_bond_issuance_pb.IssuanceProto, index?: number): fintekkers_models_security_bond_issuance_pb.IssuanceProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BondDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: BondDetailsProto): BondDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BondDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BondDetailsProto;
    static deserializeBinaryFromReader(message: BondDetailsProto, reader: jspb.BinaryReader): BondDetailsProto;
}

export namespace BondDetailsProto {
    export type AsObject = {
        couponRate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        couponType: fintekkers_models_security_coupon_type_pb.CouponTypeProto,
        couponFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
        datedDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        faceValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        issueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        maturityDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        issuanceInfoList: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto.AsObject>,
    }
}

export class TipsDetailsProto extends jspb.Message { 

    hasCouponRate(): boolean;
    clearCouponRate(): void;
    getCouponRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCouponRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TipsDetailsProto;
    getCouponType(): fintekkers_models_security_coupon_type_pb.CouponTypeProto;
    setCouponType(value: fintekkers_models_security_coupon_type_pb.CouponTypeProto): TipsDetailsProto;
    getCouponFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setCouponFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): TipsDetailsProto;

    hasDatedDate(): boolean;
    clearDatedDate(): void;
    getDatedDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setDatedDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TipsDetailsProto;

    hasFaceValue(): boolean;
    clearFaceValue(): void;
    getFaceValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setFaceValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TipsDetailsProto;

    hasIssueDate(): boolean;
    clearIssueDate(): void;
    getIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TipsDetailsProto;

    hasMaturityDate(): boolean;
    clearMaturityDate(): void;
    getMaturityDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setMaturityDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TipsDetailsProto;
    clearIssuanceInfoList(): void;
    getIssuanceInfoList(): Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>;
    setIssuanceInfoList(value: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>): TipsDetailsProto;
    addIssuanceInfo(value?: fintekkers_models_security_bond_issuance_pb.IssuanceProto, index?: number): fintekkers_models_security_bond_issuance_pb.IssuanceProto;

    hasBaseCpi(): boolean;
    clearBaseCpi(): void;
    getBaseCpi(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setBaseCpi(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TipsDetailsProto;

    hasIndexDate(): boolean;
    clearIndexDate(): void;
    getIndexDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIndexDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TipsDetailsProto;
    getInflationIndexType(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setInflationIndexType(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): TipsDetailsProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TipsDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: TipsDetailsProto): TipsDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TipsDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TipsDetailsProto;
    static deserializeBinaryFromReader(message: TipsDetailsProto, reader: jspb.BinaryReader): TipsDetailsProto;
}

export namespace TipsDetailsProto {
    export type AsObject = {
        couponRate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        couponType: fintekkers_models_security_coupon_type_pb.CouponTypeProto,
        couponFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
        datedDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        faceValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        issueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        maturityDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        issuanceInfoList: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto.AsObject>,
        baseCpi?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        indexDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        inflationIndexType: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
    }
}

export class FrnDetailsProto extends jspb.Message { 

    hasCouponRate(): boolean;
    clearCouponRate(): void;
    getCouponRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCouponRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): FrnDetailsProto;
    getCouponType(): fintekkers_models_security_coupon_type_pb.CouponTypeProto;
    setCouponType(value: fintekkers_models_security_coupon_type_pb.CouponTypeProto): FrnDetailsProto;
    getCouponFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setCouponFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): FrnDetailsProto;

    hasDatedDate(): boolean;
    clearDatedDate(): void;
    getDatedDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setDatedDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): FrnDetailsProto;

    hasFaceValue(): boolean;
    clearFaceValue(): void;
    getFaceValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setFaceValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): FrnDetailsProto;

    hasIssueDate(): boolean;
    clearIssueDate(): void;
    getIssueDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setIssueDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): FrnDetailsProto;

    hasMaturityDate(): boolean;
    clearMaturityDate(): void;
    getMaturityDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setMaturityDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): FrnDetailsProto;
    clearIssuanceInfoList(): void;
    getIssuanceInfoList(): Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>;
    setIssuanceInfoList(value: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto>): FrnDetailsProto;
    addIssuanceInfo(value?: fintekkers_models_security_bond_issuance_pb.IssuanceProto, index?: number): fintekkers_models_security_bond_issuance_pb.IssuanceProto;

    hasSpread(): boolean;
    clearSpread(): void;
    getSpread(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setSpread(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): FrnDetailsProto;
    getReferenceRateIndex(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setReferenceRateIndex(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): FrnDetailsProto;
    getResetFrequency(): fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto;
    setResetFrequency(value: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto): FrnDetailsProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FrnDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: FrnDetailsProto): FrnDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FrnDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FrnDetailsProto;
    static deserializeBinaryFromReader(message: FrnDetailsProto, reader: jspb.BinaryReader): FrnDetailsProto;
}

export namespace FrnDetailsProto {
    export type AsObject = {
        couponRate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        couponType: fintekkers_models_security_coupon_type_pb.CouponTypeProto,
        couponFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
        datedDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        faceValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        issueDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        maturityDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        issuanceInfoList: Array<fintekkers_models_security_bond_issuance_pb.IssuanceProto.AsObject>,
        spread?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        referenceRateIndex: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
        resetFrequency: fintekkers_models_security_coupon_frequency_pb.CouponFrequencyProto,
    }
}

export class IndexDetailsProto extends jspb.Message { 
    getIndexType(): fintekkers_models_security_index_index_type_pb.IndexTypeProto;
    setIndexType(value: fintekkers_models_security_index_index_type_pb.IndexTypeProto): IndexDetailsProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IndexDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: IndexDetailsProto): IndexDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IndexDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IndexDetailsProto;
    static deserializeBinaryFromReader(message: IndexDetailsProto, reader: jspb.BinaryReader): IndexDetailsProto;
}

export namespace IndexDetailsProto {
    export type AsObject = {
        indexType: fintekkers_models_security_index_index_type_pb.IndexTypeProto,
    }
}

export class EquityDetailsProto extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EquityDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: EquityDetailsProto): EquityDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EquityDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EquityDetailsProto;
    static deserializeBinaryFromReader(message: EquityDetailsProto, reader: jspb.BinaryReader): EquityDetailsProto;
}

export namespace EquityDetailsProto {
    export type AsObject = {
    }
}

export class CashDetailsProto extends jspb.Message { 
    getCashId(): string;
    setCashId(value: string): CashDetailsProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CashDetailsProto.AsObject;
    static toObject(includeInstance: boolean, msg: CashDetailsProto): CashDetailsProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CashDetailsProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CashDetailsProto;
    static deserializeBinaryFromReader(message: CashDetailsProto, reader: jspb.BinaryReader): CashDetailsProto;
}

export namespace CashDetailsProto {
    export type AsObject = {
        cashId: string,
    }
}
