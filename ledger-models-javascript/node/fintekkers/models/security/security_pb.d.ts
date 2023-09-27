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
    }
}
