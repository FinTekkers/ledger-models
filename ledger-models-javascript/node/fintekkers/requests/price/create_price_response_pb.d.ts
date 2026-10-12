// package: fintekkers.requests.price
// file: fintekkers/requests/price/create_price_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_requests_price_create_price_request_pb from "../../../fintekkers/requests/price/create_price_request_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class CreatePriceResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreatePriceResponseProto;
    getVersion(): string;
    setVersion(value: string): CreatePriceResponseProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreatePriceResponseProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): CreatePriceResponseProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): CreatePriceResponseProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): CreatePriceResponseProto;

    hasCreatePriceRequest(): boolean;
    clearCreatePriceRequest(): void;
    getCreatePriceRequest(): fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto | undefined;
    setCreatePriceRequest(value?: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto): CreatePriceResponseProto;
    clearPriceResponseList(): void;
    getPriceResponseList(): Array<fintekkers_models_price_price_pb.PriceProto>;
    setPriceResponseList(value: Array<fintekkers_models_price_price_pb.PriceProto>): CreatePriceResponseProto;
    addPriceResponse(value?: fintekkers_models_price_price_pb.PriceProto, index?: number): fintekkers_models_price_price_pb.PriceProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePriceResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePriceResponseProto): CreatePriceResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePriceResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePriceResponseProto;
    static deserializeBinaryFromReader(message: CreatePriceResponseProto, reader: jspb.BinaryReader): CreatePriceResponseProto;
}

export namespace CreatePriceResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        createPriceRequest?: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto.AsObject,
        priceResponseList: Array<fintekkers_models_price_price_pb.PriceProto.AsObject>,
    }
}
