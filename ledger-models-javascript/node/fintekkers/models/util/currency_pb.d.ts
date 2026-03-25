// package: fintekkers.models.util
// file: fintekkers/models/util/currency.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class CurrencyProto extends jspb.Message { 
    getIsoCode(): string;
    setIsoCode(value: string): CurrencyProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CurrencyProto.AsObject;
    static toObject(includeInstance: boolean, msg: CurrencyProto): CurrencyProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CurrencyProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CurrencyProto;
    static deserializeBinaryFromReader(message: CurrencyProto, reader: jspb.BinaryReader): CurrencyProto;
}

export namespace CurrencyProto {
    export type AsObject = {
        isoCode: string,
    }
}
