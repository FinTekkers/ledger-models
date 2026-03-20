// package: fintekkers.models.valuation
// file: fintekkers/models/valuation/cashflow.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";

export class CashflowProto extends jspb.Message { 

    hasCashflowDate(): boolean;
    clearCashflowDate(): void;
    getCashflowDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setCashflowDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): CashflowProto;

    hasPvAmount(): boolean;
    clearPvAmount(): void;
    getPvAmount(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setPvAmount(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CashflowProto;

    hasFvAmount(): boolean;
    clearFvAmount(): void;
    getFvAmount(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setFvAmount(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CashflowProto;

    hasCouponRate(): boolean;
    clearCouponRate(): void;
    getCouponRate(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setCouponRate(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CashflowProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CashflowProto.AsObject;
    static toObject(includeInstance: boolean, msg: CashflowProto): CashflowProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CashflowProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CashflowProto;
    static deserializeBinaryFromReader(message: CashflowProto, reader: jspb.BinaryReader): CashflowProto;
}

export namespace CashflowProto {
    export type AsObject = {
        cashflowDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        pvAmount?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        fvAmount?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        couponRate?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
