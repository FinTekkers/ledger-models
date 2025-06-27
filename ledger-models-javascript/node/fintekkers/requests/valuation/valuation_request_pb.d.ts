// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/valuation_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_position_position_pb from "../../../fintekkers/models/position/position_pb";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_requests_util_operation_pb from "../../../fintekkers/requests/util/operation_pb";
import * as fintekkers_models_position_measure_pb from "../../../fintekkers/models/position/measure_pb";

export class ValuationRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): ValuationRequestProto;
    getVersion(): string;
    setVersion(value: string): ValuationRequestProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): ValuationRequestProto;
    clearMeasuresList(): void;
    getMeasuresList(): Array<fintekkers_models_position_measure_pb.MeasureProto>;
    setMeasuresList(value: Array<fintekkers_models_position_measure_pb.MeasureProto>): ValuationRequestProto;
    addMeasures(value: fintekkers_models_position_measure_pb.MeasureProto, index?: number): fintekkers_models_position_measure_pb.MeasureProto;

    hasSecurityInput(): boolean;
    clearSecurityInput(): void;
    getSecurityInput(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurityInput(value?: fintekkers_models_security_security_pb.SecurityProto): ValuationRequestProto;

    hasPositionInput(): boolean;
    clearPositionInput(): void;
    getPositionInput(): fintekkers_models_position_position_pb.PositionProto | undefined;
    setPositionInput(value?: fintekkers_models_position_position_pb.PositionProto): ValuationRequestProto;

    hasPriceInput(): boolean;
    clearPriceInput(): void;
    getPriceInput(): fintekkers_models_price_price_pb.PriceProto | undefined;
    setPriceInput(value?: fintekkers_models_price_price_pb.PriceProto): ValuationRequestProto;

    hasAsofDatetime(): boolean;
    clearAsofDatetime(): void;
    getAsofDatetime(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsofDatetime(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): ValuationRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValuationRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: ValuationRequestProto): ValuationRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValuationRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValuationRequestProto;
    static deserializeBinaryFromReader(message: ValuationRequestProto, reader: jspb.BinaryReader): ValuationRequestProto;
}

export namespace ValuationRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        measuresList: Array<fintekkers_models_position_measure_pb.MeasureProto>,
        securityInput?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        positionInput?: fintekkers_models_position_position_pb.PositionProto.AsObject,
        priceInput?: fintekkers_models_price_price_pb.PriceProto.AsObject,
        asofDatetime?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    }
}
