// package: fintekkers.requests.portfolio
// file: fintekkers/requests/portfolio/query_portfolio_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_portfolio_portfolio_pb from "../../../fintekkers/models/portfolio/portfolio_pb";
import * as fintekkers_requests_portfolio_query_portfolio_request_pb from "../../../fintekkers/requests/portfolio/query_portfolio_request_pb";

export class QueryPortfolioResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryPortfolioResponseProto;
    getVersion(): string;
    setVersion(value: string): QueryPortfolioResponseProto;

    hasQueryPortfolioRequest(): boolean;
    clearQueryPortfolioRequest(): void;
    getQueryPortfolioRequest(): fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto | undefined;
    setQueryPortfolioRequest(value?: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto): QueryPortfolioResponseProto;
    clearPortfolioResponseList(): void;
    getPortfolioResponseList(): Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>;
    setPortfolioResponseList(value: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>): QueryPortfolioResponseProto;
    addPortfolioResponse(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto, index?: number): fintekkers_models_portfolio_portfolio_pb.PortfolioProto;
    getNextPageToken(): string;
    setNextPageToken(value: string): QueryPortfolioResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryPortfolioResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryPortfolioResponseProto): QueryPortfolioResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryPortfolioResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryPortfolioResponseProto;
    static deserializeBinaryFromReader(message: QueryPortfolioResponseProto, reader: jspb.BinaryReader): QueryPortfolioResponseProto;
}

export namespace QueryPortfolioResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        queryPortfolioRequest?: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto.AsObject,
        portfolioResponseList: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject>,
        nextPageToken: string,
    }
}
