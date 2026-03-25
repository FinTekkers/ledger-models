// package: fintekkers.models.security
// file: fintekkers/models/security/index_composition.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";

export class IndexCompositionProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): IndexCompositionProto;
    getVersion(): string;
    setVersion(value: string): IndexCompositionProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): IndexCompositionProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IndexCompositionProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): IndexCompositionProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IndexCompositionProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): IndexCompositionProto;

    hasIndexSecurity(): boolean;
    clearIndexSecurity(): void;
    getIndexSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setIndexSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): IndexCompositionProto;

    hasEffectiveDate(): boolean;
    clearEffectiveDate(): void;
    getEffectiveDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setEffectiveDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): IndexCompositionProto;
    clearConstituentsList(): void;
    getConstituentsList(): Array<IndexConstituentProto>;
    setConstituentsList(value: Array<IndexConstituentProto>): IndexCompositionProto;
    addConstituents(value?: IndexConstituentProto, index?: number): IndexConstituentProto;

    hasIndexDivisor(): boolean;
    clearIndexDivisor(): void;
    getIndexDivisor(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setIndexDivisor(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IndexCompositionProto;
    getNotes(): string;
    setNotes(value: string): IndexCompositionProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IndexCompositionProto.AsObject;
    static toObject(includeInstance: boolean, msg: IndexCompositionProto): IndexCompositionProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IndexCompositionProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IndexCompositionProto;
    static deserializeBinaryFromReader(message: IndexCompositionProto, reader: jspb.BinaryReader): IndexCompositionProto;
}

export namespace IndexCompositionProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        indexSecurity?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        effectiveDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        constituentsList: Array<IndexConstituentProto.AsObject>,
        indexDivisor?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        notes: string,
    }
}

export class IndexConstituentProto extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): IndexConstituentProto;

    hasWeight(): boolean;
    clearWeight(): void;
    getWeight(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setWeight(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IndexConstituentProto;

    hasSharesInIndex(): boolean;
    clearSharesInIndex(): void;
    getSharesInIndex(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setSharesInIndex(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): IndexConstituentProto;
    getCurrency(): string;
    setCurrency(value: string): IndexConstituentProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IndexConstituentProto.AsObject;
    static toObject(includeInstance: boolean, msg: IndexConstituentProto): IndexConstituentProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IndexConstituentProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IndexConstituentProto;
    static deserializeBinaryFromReader(message: IndexConstituentProto, reader: jspb.BinaryReader): IndexConstituentProto;
}

export namespace IndexConstituentProto {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        weight?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        sharesInIndex?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        currency: string,
    }
}
