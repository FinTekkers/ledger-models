// package: fintekkers.requests.price
// file: fintekkers/requests/price/query_price_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_requests_price_query_price_request_pb from "../../../fintekkers/requests/price/query_price_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

export class QueryPriceResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPriceResponseProto;
    getVersion(): string;
    setVersion(value: string): QueryPriceResponseProto;

    hasQueryPriceRequest(): boolean;
    clearQueryPriceRequest(): void;
    getQueryPriceRequest(): fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto | undefined;
    setQueryPriceRequest(value?: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto): QueryPriceResponseProto;
    clearPriceResponseList(): void;
    getPriceResponseList(): Array<fintekkers_models_price_price_pb.PriceProto>;
    setPriceResponseList(value: Array<fintekkers_models_price_price_pb.PriceProto>): QueryPriceResponseProto;
    addPriceResponse(value?: fintekkers_models_price_price_pb.PriceProto, index?: number): fintekkers_models_price_price_pb.PriceProto;

    hasErrorsOrWarnings(): boolean;
    clearErrorsOrWarnings(): void;
    getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
    setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): QueryPriceResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPriceResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPriceResponseProto): QueryPriceResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPriceResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPriceResponseProto;
    static deserializeBinaryFromReader(message: QueryPriceResponseProto, reader: jspb.BinaryReader): QueryPriceResponseProto;
}

export namespace QueryPriceResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        queryPriceRequest?: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto.AsObject,
        priceResponseList: Array<fintekkers_models_price_price_pb.PriceProto.AsObject>,
        errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
    }
}
