// package: fintekkers.requests.portfolio
// file: fintekkers/requests/portfolio/create_portfolio_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_portfolio_portfolio_pb from "../../../fintekkers/models/portfolio/portfolio_pb";
import * as fintekkers_requests_portfolio_create_portfolio_request_pb from "../../../fintekkers/requests/portfolio/create_portfolio_request_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class CreatePortfolioResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreatePortfolioResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): CreatePortfolioResponseProto;

    hasCreatePortfolioRequest(): boolean;
    clearCreatePortfolioRequest(): void;
    getCreatePortfolioRequest(): fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto | undefined;
    setCreatePortfolioRequest(value?: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto): CreatePortfolioResponseProto;
    clearPortfolioResponseList(): void;
    getPortfolioResponseList(): Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>;
    setPortfolioResponseList(value: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto>): CreatePortfolioResponseProto;
    addPortfolioResponse(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto, index?: number): fintekkers_models_portfolio_portfolio_pb.PortfolioProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePortfolioResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePortfolioResponseProto): CreatePortfolioResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePortfolioResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePortfolioResponseProto;
    static deserializeBinaryFromReader(message: CreatePortfolioResponseProto, reader: jspb.BinaryReader): CreatePortfolioResponseProto;
}

export namespace CreatePortfolioResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        createPortfolioRequest?: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto.AsObject,
        portfolioResponseList: Array<fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject>,
    }
}
