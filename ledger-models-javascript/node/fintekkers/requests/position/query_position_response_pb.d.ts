// package: fintekkers.requests.position
// file: fintekkers/requests/position/query_position_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_pb from "../../../fintekkers/models/position/position_pb";
import * as fintekkers_requests_position_query_position_request_pb from "../../../fintekkers/requests/position/query_position_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class QueryPositionResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): QueryPositionResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): QueryPositionResponseProto;

    hasPositionRequest(): boolean;
    clearPositionRequest(): void;
    getPositionRequest(): fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto | undefined;
    setPositionRequest(value?: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto): QueryPositionResponseProto;
    getReportingCurrency(): string;
    setReportingCurrency(value: string): QueryPositionResponseProto;
    clearPositionsList(): void;
    getPositionsList(): Array<fintekkers_models_position_position_pb.PositionProto>;
    setPositionsList(value: Array<fintekkers_models_position_position_pb.PositionProto>): QueryPositionResponseProto;
    addPositions(value?: fintekkers_models_position_position_pb.PositionProto, index?: number): fintekkers_models_position_position_pb.PositionProto;

    hasErrorsOrWarnings(): boolean;
    clearErrorsOrWarnings(): void;
    getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
    setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): QueryPositionResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPositionResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPositionResponseProto): QueryPositionResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPositionResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPositionResponseProto;
    static deserializeBinaryFromReader(message: QueryPositionResponseProto, reader: jspb.BinaryReader): QueryPositionResponseProto;
}

export namespace QueryPositionResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        positionRequest?: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto.AsObject,
        reportingCurrency: string,
        positionsList: Array<fintekkers_models_position_position_pb.PositionProto.AsObject>,
        errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
    }
}
