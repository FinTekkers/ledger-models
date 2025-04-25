// package: fintekkers.requests.price
// file: fintekkers/requests/price/query_price_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_position_position_filter_pb from "../../../fintekkers/models/position/position_filter_pb";
import * as fintekkers_models_util_date_range_pb from "../../../fintekkers/models/util/date_range_pb";

export class QueryPriceRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPriceRequestProto;
    getVersion(): string;
    setVersion(value: string): QueryPriceRequestProto;
    clearUuidsList(): void;
    getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
    setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QueryPriceRequestProto;
    addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

    hasSearchPriceInput(): boolean;
    clearSearchPriceInput(): void;
    getSearchPriceInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
    setSearchPriceInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QueryPriceRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QueryPriceRequestProto;
    getFrequency(): PriceFrequencyProto;
    setFrequency(value: PriceFrequencyProto): QueryPriceRequestProto;

    hasHorizon(): boolean;
    clearHorizon(): void;
    getHorizon(): PriceHorizonProto;
    setHorizon(value: PriceHorizonProto): QueryPriceRequestProto;

    hasDateRange(): boolean;
    clearDateRange(): void;
    getDateRange(): fintekkers_models_util_date_range_pb.DateRangeProto | undefined;
    setDateRange(value?: fintekkers_models_util_date_range_pb.DateRangeProto): QueryPriceRequestProto;

    getTimeRangeCase(): QueryPriceRequestProto.TimeRangeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPriceRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPriceRequestProto): QueryPriceRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPriceRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPriceRequestProto;
    static deserializeBinaryFromReader(message: QueryPriceRequestProto, reader: jspb.BinaryReader): QueryPriceRequestProto;
}

export namespace QueryPriceRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
        searchPriceInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        frequency: PriceFrequencyProto,
        horizon: PriceHorizonProto,
        dateRange?: fintekkers_models_util_date_range_pb.DateRangeProto.AsObject,
    }

    export enum TimeRangeCase {
        TIME_RANGE_NOT_SET = 0,
        HORIZON = 25,
        DATE_RANGE = 26,
    }

}

export enum PriceFrequencyProto {
    PRICE_FREQUENCY_UNSPECIFIED = 0,
    PRICE_FREQUENCY_WEEKLY = 10,
    PRICE_FREQUENCY_DAILY = 20,
    PRICE_FREQUENCY_HOURLY = 30,
    PRICE_FREQUENCY_MINUTE = 40,
    PRICE_FREQUENCY_EVERY_TICK = 90,
}

export enum PriceHorizonProto {
    PRICE_HORIZON_UNSPECIFIED = 0,
    PRICE_HORIZON_1_DAY = 1,
    PRICE_HORIZON_5_DAYS = 2,
    PRICE_HORIZON_1_WEEK = 3,
    PRICE_HORIZON_1_MONTH = 4,
    PRICE_HORIZON_6_MONTHS = 5,
    PRICE_HORIZON_1_YEAR = 6,
    PRICE_HORIZON_5_YEAR = 7,
    PRICE_HORIZON_MAX = 8,
    PRICE_HORIZON_YEAR_TO_DATE = 9,
}
