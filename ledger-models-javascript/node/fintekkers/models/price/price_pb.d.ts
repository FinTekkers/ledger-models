// package: fintekkers.models.price
// file: fintekkers/models/price/price.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_price_price_type_pb from "../../../fintekkers/models/price/price_type_pb";

export class PriceProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): PriceProto;
    getVersion(): string;
    setVersion(value: string): PriceProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): PriceProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): PriceProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): PriceProto;

    hasPrice(): boolean;
    clearPrice(): void;
    getPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): PriceProto;

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): PriceProto;
    getPriceType(): fintekkers_models_price_price_type_pb.PriceTypeProto;
    setPriceType(value: fintekkers_models_price_price_type_pb.PriceTypeProto): PriceProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PriceProto.AsObject;
    static toObject(includeInstance: boolean, msg: PriceProto): PriceProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PriceProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PriceProto;
    static deserializeBinaryFromReader(message: PriceProto, reader: jspb.BinaryReader): PriceProto;
}

export namespace PriceProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        price?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        priceType: fintekkers_models_price_price_type_pb.PriceTypeProto,
    }
}
