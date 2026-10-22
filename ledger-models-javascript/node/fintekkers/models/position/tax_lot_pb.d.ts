// package: fintekkers.models.position
// file: fintekkers/models/position/tax_lot.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";

export class TaxLotProto extends jspb.Message { 

    hasOpenDate(): boolean;
    clearOpenDate(): void;
    getOpenDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setOpenDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TaxLotProto;

    hasOpenQuantity(): boolean;
    clearOpenQuantity(): void;
    getOpenQuantity(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setOpenQuantity(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TaxLotProto;

    hasPrice(): boolean;
    clearPrice(): void;
    getPrice(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setPrice(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TaxLotProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TaxLotProto.AsObject;
    static toObject(includeInstance: boolean, msg: TaxLotProto): TaxLotProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TaxLotProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TaxLotProto;
    static deserializeBinaryFromReader(message: TaxLotProto, reader: jspb.BinaryReader): TaxLotProto;
}

export namespace TaxLotProto {
    export type AsObject = {
        openDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        openQuantity?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        price?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
