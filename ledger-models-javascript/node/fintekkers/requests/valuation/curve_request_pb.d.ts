// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/curve_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_position_measure_pb from "../../../fintekkers/models/position/measure_pb";

export class CurveInputProto extends jspb.Message { 

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): CurveInputProto;

    hasPrice(): boolean;
    clearPrice(): void;
    getPrice(): fintekkers_models_price_price_pb.PriceProto | undefined;
    setPrice(value?: fintekkers_models_price_price_pb.PriceProto): CurveInputProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurveInputProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurveInputProto): CurveInputProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurveInputProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurveInputProto;
    static deserializeBinaryFromReader(message: CurveInputProto, reader: jspb.BinaryReader): CurveInputProto;
}

export namespace CurveInputProto {
    export type AsObject = {
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        price?: fintekkers_models_price_price_pb.PriceProto.AsObject,
    }
}

export class CurveRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CurveRequestProto;
    getVersion(): string;
    setVersion(value: string): CurveRequestProto;

    hasAsofDatetime(): boolean;
    clearAsofDatetime(): void;
    getAsofDatetime(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsofDatetime(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): CurveRequestProto;
    clearCurveTypesList(): void;
    getCurveTypesList(): Array<fintekkers_models_position_measure_pb.MeasureProto>;
    setCurveTypesList(value: Array<fintekkers_models_position_measure_pb.MeasureProto>): CurveRequestProto;
    addCurveTypes(value: fintekkers_models_position_measure_pb.MeasureProto, index?: number): fintekkers_models_position_measure_pb.MeasureProto;
    clearCurveInputsList(): void;
    getCurveInputsList(): Array<CurveInputProto>;
    setCurveInputsList(value: Array<CurveInputProto>): CurveRequestProto;
    addCurveInputs(value?: CurveInputProto, index?: number): CurveInputProto;
    clearTenorPointsList(): void;
    getTenorPointsList(): Array<fintekkers_models_util_decimal_value_pb.DecimalValueProto>;
    setTenorPointsList(value: Array<fintekkers_models_util_decimal_value_pb.DecimalValueProto>): CurveRequestProto;
    addTenorPoints(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto, index?: number): fintekkers_models_util_decimal_value_pb.DecimalValueProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurveRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurveRequestProto): CurveRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurveRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurveRequestProto;
    static deserializeBinaryFromReader(message: CurveRequestProto, reader: jspb.BinaryReader): CurveRequestProto;
}

export namespace CurveRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        asofDatetime?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        curveTypesList: Array<fintekkers_models_position_measure_pb.MeasureProto>,
        curveInputsList: Array<CurveInputProto.AsObject>,
        tenorPointsList: Array<fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject>,
    }
}
