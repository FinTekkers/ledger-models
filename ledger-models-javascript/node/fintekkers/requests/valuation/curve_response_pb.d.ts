// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/curve_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_position_measure_pb from "../../../fintekkers/models/position/measure_pb";
import * as fintekkers_requests_valuation_curve_request_pb from "../../../fintekkers/requests/valuation/curve_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

export class CurvePointProto extends jspb.Message { 

    hasTenor(): boolean;
    clearTenor(): void;
    getTenor(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setTenor(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CurvePointProto;

    hasYield(): boolean;
    clearYield(): void;
    getYield(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setYield(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): CurvePointProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurvePointProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurvePointProto): CurvePointProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurvePointProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurvePointProto;
    static deserializeBinaryFromReader(message: CurvePointProto, reader: jspb.BinaryReader): CurvePointProto;
}

export namespace CurvePointProto {
    export type AsObject = {
        tenor?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        yield?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}

export class CurveResultProto extends jspb.Message { 
    getCurveType(): fintekkers_models_position_measure_pb.MeasureProto;
    setCurveType(value: fintekkers_models_position_measure_pb.MeasureProto): CurveResultProto;
    clearPointsList(): void;
    getPointsList(): Array<CurvePointProto>;
    setPointsList(value: Array<CurvePointProto>): CurveResultProto;
    addPoints(value?: CurvePointProto, index?: number): CurvePointProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurveResultProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurveResultProto): CurveResultProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurveResultProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurveResultProto;
    static deserializeBinaryFromReader(message: CurveResultProto, reader: jspb.BinaryReader): CurveResultProto;
}

export namespace CurveResultProto {
    export type AsObject = {
        curveType: fintekkers_models_position_measure_pb.MeasureProto,
        pointsList: Array<CurvePointProto.AsObject>,
    }
}

export class CurveResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CurveResponseProto;
    getVersion(): string;
    setVersion(value: string): CurveResponseProto;

    hasCurveRequest(): boolean;
    clearCurveRequest(): void;
    getCurveRequest(): fintekkers_requests_valuation_curve_request_pb.CurveRequestProto | undefined;
    setCurveRequest(value?: fintekkers_requests_valuation_curve_request_pb.CurveRequestProto): CurveResponseProto;
    clearCurveResultsList(): void;
    getCurveResultsList(): Array<CurveResultProto>;
    setCurveResultsList(value: Array<CurveResultProto>): CurveResponseProto;
    addCurveResults(value?: CurveResultProto, index?: number): CurveResultProto;

    hasSummary(): boolean;
    clearSummary(): void;
    getSummary(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
    setSummary(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): CurveResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurveResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurveResponseProto): CurveResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurveResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurveResponseProto;
    static deserializeBinaryFromReader(message: CurveResponseProto, reader: jspb.BinaryReader): CurveResponseProto;
}

export namespace CurveResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        curveRequest?: fintekkers_requests_valuation_curve_request_pb.CurveRequestProto.AsObject,
        curveResultsList: Array<CurveResultProto.AsObject>,
        summary?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
    }
}
