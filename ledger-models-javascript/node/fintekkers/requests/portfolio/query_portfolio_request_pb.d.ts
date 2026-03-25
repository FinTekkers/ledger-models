// package: fintekkers.requests.portfolio
// file: fintekkers/requests/portfolio/query_portfolio_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_position_position_filter_pb from "../../../fintekkers/models/position/position_filter_pb";

export class QueryPortfolioRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPortfolioRequestProto;
    getVersion(): string;
    setVersion(value: string): QueryPortfolioRequestProto;
    clearUuidsList(): void;
    getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
    setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QueryPortfolioRequestProto;
    addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

    hasSearchPortfolioInput(): boolean;
    clearSearchPortfolioInput(): void;
    getSearchPortfolioInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
    setSearchPortfolioInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryPortfolioRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QueryPortfolioRequestProto;
    getNameFilter(): string;
    setNameFilter(value: string): QueryPortfolioRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPortfolioRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPortfolioRequestProto): QueryPortfolioRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPortfolioRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPortfolioRequestProto;
    static deserializeBinaryFromReader(message: QueryPortfolioRequestProto, reader: jspb.BinaryReader): QueryPortfolioRequestProto;
}

export namespace QueryPortfolioRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
        searchPortfolioInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        nameFilter: string,
    }
}
