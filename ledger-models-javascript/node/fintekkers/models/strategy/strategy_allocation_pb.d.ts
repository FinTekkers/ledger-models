// package: fintekkers.models.strategy
// file: fintekkers/models/strategy/strategy_allocation.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_strategy_strategy_pb from "../../../fintekkers/models/strategy/strategy_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class MapFieldEntry extends jspb.Message { 

    hasKey(): boolean;
    clearKey(): void;
    getKey(): fintekkers_models_strategy_strategy_pb.StrategyProto | undefined;
    setKey(value?: fintekkers_models_strategy_strategy_pb.StrategyProto): MapFieldEntry;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): MapFieldEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MapFieldEntry.AsObject;
    static toObject(includeInstance: boolean, msg: MapFieldEntry): MapFieldEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MapFieldEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MapFieldEntry;
    static deserializeBinaryFromReader(message: MapFieldEntry, reader: jspb.BinaryReader): MapFieldEntry;
}

export namespace MapFieldEntry {
    export type AsObject = {
        key?: fintekkers_models_strategy_strategy_pb.StrategyProto.AsObject,
        value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}

export class StrategyAllocationProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): StrategyAllocationProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): StrategyAllocationProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): StrategyAllocationProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): StrategyAllocationProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): StrategyAllocationProto;
    clearAllocationsList(): void;
    getAllocationsList(): Array<MapFieldEntry>;
    setAllocationsList(value: Array<MapFieldEntry>): StrategyAllocationProto;
    addAllocations(value?: MapFieldEntry, index?: number): MapFieldEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StrategyAllocationProto.AsObject;
    static toObject(includeInstance: boolean, msg: StrategyAllocationProto): StrategyAllocationProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StrategyAllocationProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StrategyAllocationProto;
    static deserializeBinaryFromReader(message: StrategyAllocationProto, reader: jspb.BinaryReader): StrategyAllocationProto;
}

export namespace StrategyAllocationProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        allocationsList: Array<MapFieldEntry.AsObject>,
    }
}
