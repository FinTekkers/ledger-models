// package: fintekkers.models.position
// file: fintekkers/models/position/position_filter.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_position_position_util_pb from "../../../fintekkers/models/position/position_util_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class PositionFilterProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): PositionFilterProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): PositionFilterProto;
    clearFiltersList(): void;
    getFiltersList(): Array<fintekkers_models_position_position_util_pb.FieldMapEntry>;
    setFiltersList(value: Array<fintekkers_models_position_position_util_pb.FieldMapEntry>): PositionFilterProto;
    addFilters(value?: fintekkers_models_position_position_util_pb.FieldMapEntry, index?: number): fintekkers_models_position_position_util_pb.FieldMapEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PositionFilterProto.AsObject;
    static toObject(includeInstance: boolean, msg: PositionFilterProto): PositionFilterProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PositionFilterProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PositionFilterProto;
    static deserializeBinaryFromReader(message: PositionFilterProto, reader: jspb.BinaryReader): PositionFilterProto;
}

export namespace PositionFilterProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        filtersList: Array<fintekkers_models_position_position_util_pb.FieldMapEntry.AsObject>,
    }
}
