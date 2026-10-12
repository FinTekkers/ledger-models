// package: fintekkers.requests.price
// file: fintekkers/requests/price/create_price_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class CreatePriceRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreatePriceRequestProto;
    getVersion(): string;
    setVersion(value: string): CreatePriceRequestProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreatePriceRequestProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): CreatePriceRequestProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): CreatePriceRequestProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): CreatePriceRequestProto;

    hasCreatePriceInput(): boolean;
    clearCreatePriceInput(): void;
    getCreatePriceInput(): fintekkers_models_price_price_pb.PriceProto | undefined;
    setCreatePriceInput(value?: fintekkers_models_price_price_pb.PriceProto): CreatePriceRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePriceRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePriceRequestProto): CreatePriceRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePriceRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePriceRequestProto;
    static deserializeBinaryFromReader(message: CreatePriceRequestProto, reader: jspb.BinaryReader): CreatePriceRequestProto;
}

export namespace CreatePriceRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        createPriceInput?: fintekkers_models_price_price_pb.PriceProto.AsObject,
    }
}
