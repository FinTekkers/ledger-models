// package: fintekkers.models.util
// file: fintekkers/models/util/version.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class VersionProto extends jspb.Message { 
    getMajor(): number;
    setMajor(value: number): VersionProto;
    getMinor(): number;
    setMinor(value: number): VersionProto;
    getPatch(): number;
    setPatch(value: number): VersionProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VersionProto.AsObject;
    static toObject(includeInstance: boolean, msg: VersionProto): VersionProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VersionProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VersionProto;
    static deserializeBinaryFromReader(message: VersionProto, reader: jspb.BinaryReader): VersionProto;
}

export namespace VersionProto {
    export type AsObject = {
        major: number,
        minor: number,
        patch: number,
    }
}
