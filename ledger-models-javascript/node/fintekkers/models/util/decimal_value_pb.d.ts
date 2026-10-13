// package: fintekkers.models.util
// file: fintekkers/models/util/decimal_value.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class DecimalValueProto extends jspb.Message { 
    getUnscaledValue(): Uint8Array | string;
    getUnscaledValue_asU8(): Uint8Array;
    getUnscaledValue_asB64(): string;
    setUnscaledValue(value: Uint8Array | string): DecimalValueProto;
    getScale(): number;
    setScale(value: number): DecimalValueProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DecimalValueProto.AsObject;
    static toObject(includeInstance: boolean, msg: DecimalValueProto): DecimalValueProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DecimalValueProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DecimalValueProto;
    static deserializeBinaryFromReader(message: DecimalValueProto, reader: jspb.BinaryReader): DecimalValueProto;
}

export namespace DecimalValueProto {
    export type AsObject = {
        unscaledValue: Uint8Array | string,
        scale: number,
    }
}
