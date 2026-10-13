// package: fintekkers.requests.portfolio
// file: fintekkers/requests/portfolio/create_portfolio_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_portfolio_portfolio_pb from "../../../fintekkers/models/portfolio/portfolio_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class CreatePortfolioRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreatePortfolioRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): CreatePortfolioRequestProto;

    hasCreatePortfolioInput(): boolean;
    clearCreatePortfolioInput(): void;
    getCreatePortfolioInput(): fintekkers_models_portfolio_portfolio_pb.PortfolioProto | undefined;
    setCreatePortfolioInput(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto): CreatePortfolioRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePortfolioRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePortfolioRequestProto): CreatePortfolioRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePortfolioRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePortfolioRequestProto;
    static deserializeBinaryFromReader(message: CreatePortfolioRequestProto, reader: jspb.BinaryReader): CreatePortfolioRequestProto;
}

export namespace CreatePortfolioRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        createPortfolioInput?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject,
    }
}
