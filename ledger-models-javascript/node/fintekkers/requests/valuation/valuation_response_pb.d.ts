// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/valuation_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_util_pb from "../../../fintekkers/models/position/position_util_pb";
import * as fintekkers_requests_valuation_valuation_request_pb from "../../../fintekkers/requests/valuation/valuation_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

export class ValuationResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): ValuationResponseProto;
    getVersion(): string;
    setVersion(value: string): ValuationResponseProto;

    hasValuationRequest(): boolean;
    clearValuationRequest(): void;
    getValuationRequest(): fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto | undefined;
    setValuationRequest(value?: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto): ValuationResponseProto;
    clearMeasureResultsList(): void;
    getMeasureResultsList(): Array<fintekkers_models_position_position_util_pb.MeasureMapEntry>;
    setMeasureResultsList(value: Array<fintekkers_models_position_position_util_pb.MeasureMapEntry>): ValuationResponseProto;
    addMeasureResults(value?: fintekkers_models_position_position_util_pb.MeasureMapEntry, index?: number): fintekkers_models_position_position_util_pb.MeasureMapEntry;

    hasSummary(): boolean;
    clearSummary(): void;
    getSummary(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
    setSummary(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): ValuationResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValuationResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: ValuationResponseProto): ValuationResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValuationResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValuationResponseProto;
    static deserializeBinaryFromReader(message: ValuationResponseProto, reader: jspb.BinaryReader): ValuationResponseProto;
}

export namespace ValuationResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        valuationRequest?: fintekkers_requests_valuation_valuation_request_pb.ValuationRequestProto.AsObject,
        measureResultsList: Array<fintekkers_models_position_position_util_pb.MeasureMapEntry.AsObject>,
        summary?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
    }
}
