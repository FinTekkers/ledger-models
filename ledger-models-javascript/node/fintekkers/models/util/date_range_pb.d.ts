// package: fintekkers.models.util
// file: fintekkers/models/util/date_range.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";

export class DateRangeProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): DateRangeProto;
    getVersion(): string;
    setVersion(value: string): DateRangeProto;

    hasStart(): boolean;
    clearStart(): void;
    getStart(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setStart(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): DateRangeProto;

    hasEnd(): boolean;
    clearEnd(): void;
    getEnd(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setEnd(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): DateRangeProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DateRangeProto.AsObject;
    static toObject(includeInstance: boolean, msg: DateRangeProto): DateRangeProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DateRangeProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DateRangeProto;
    static deserializeBinaryFromReader(message: DateRangeProto, reader: jspb.BinaryReader): DateRangeProto;
}

export namespace DateRangeProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        start?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        end?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    }
}
