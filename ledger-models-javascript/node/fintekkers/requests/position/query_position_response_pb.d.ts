// package: fintekkers.requests.position
// file: fintekkers/requests/position/query_position_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_pb from "../../../fintekkers/models/position/position_pb";
import * as fintekkers_requests_position_query_position_request_pb from "../../../fintekkers/requests/position/query_position_request_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class QueryPositionResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPositionResponseProto;
    getVersion(): string;
    setVersion(value: string): QueryPositionResponseProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): QueryPositionResponseProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): QueryPositionResponseProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): QueryPositionResponseProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): QueryPositionResponseProto;

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
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        positionRequest?: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto.AsObject,
        reportingCurrency: string,
        positionsList: Array<fintekkers_models_position_position_pb.PositionProto.AsObject>,
    }
}
