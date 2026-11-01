// package: fintekkers.requests.valuation
// file: fintekkers/requests/valuation/valuation_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_pb from "../../../fintekkers/models/position/position_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_requests_util_operation_pb from "../../../fintekkers/requests/util/operation_pb";
import * as fintekkers_models_position_measure_pb from "../../../fintekkers/models/position/measure_pb";
import * as fintekkers_requests_valuation_product_inputs_pb from "../../../fintekkers/requests/valuation/product_inputs_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class ValuationRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): ValuationRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): ValuationRequestProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): ValuationRequestProto;
    clearMeasuresList(): void;
    getMeasuresList(): Array<fintekkers_models_position_measure_pb.MeasureProto>;
    setMeasuresList(value: Array<fintekkers_models_position_measure_pb.MeasureProto>): ValuationRequestProto;
    addMeasures(value: fintekkers_models_position_measure_pb.MeasureProto, index?: number): fintekkers_models_position_measure_pb.MeasureProto;

    hasPositionInput(): boolean;
    clearPositionInput(): void;
    getPositionInput(): fintekkers_models_position_position_pb.PositionProto | undefined;
    setPositionInput(value?: fintekkers_models_position_position_pb.PositionProto): ValuationRequestProto;

    hasAsofDatetime(): boolean;
    clearAsofDatetime(): void;
    getAsofDatetime(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsofDatetime(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): ValuationRequestProto;

    hasProductInput(): boolean;
    clearProductInput(): void;
    getProductInput(): fintekkers_requests_valuation_product_inputs_pb.ProductInput | undefined;
    setProductInput(value?: fintekkers_requests_valuation_product_inputs_pb.ProductInput): ValuationRequestProto;

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
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        measuresList: Array<fintekkers_models_position_measure_pb.MeasureProto>,
        positionInput?: fintekkers_models_position_position_pb.PositionProto.AsObject,
        asofDatetime?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        productInput?: fintekkers_requests_valuation_product_inputs_pb.ProductInput.AsObject,
    }
}
