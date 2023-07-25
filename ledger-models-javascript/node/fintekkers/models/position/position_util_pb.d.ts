// package: fintekkers.models.position
// file: fintekkers/models/position/position_util.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";
import * as fintekkers_models_position_field_pb from "../../../fintekkers/models/position/field_pb";
import * as fintekkers_models_position_measure_pb from "../../../fintekkers/models/position/measure_pb";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";

export class MeasureMapEntry extends jspb.Message { 
    getMeasure(): fintekkers_models_position_measure_pb.MeasureProto;
    setMeasure(value: fintekkers_models_position_measure_pb.MeasureProto): MeasureMapEntry;

    hasMeasureDecimalValue(): boolean;
    clearMeasureDecimalValue(): void;
    getMeasureDecimalValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setMeasureDecimalValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): MeasureMapEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MeasureMapEntry.AsObject;
    static toObject(includeInstance: boolean, msg: MeasureMapEntry): MeasureMapEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MeasureMapEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MeasureMapEntry;
    static deserializeBinaryFromReader(message: MeasureMapEntry, reader: jspb.BinaryReader): MeasureMapEntry;
}

export namespace MeasureMapEntry {
    export type AsObject = {
        measure: fintekkers_models_position_measure_pb.MeasureProto,
        measureDecimalValue?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}

export class FieldMapEntry extends jspb.Message { 
    getField(): fintekkers_models_position_field_pb.FieldProto;
    setField(value: fintekkers_models_position_field_pb.FieldProto): FieldMapEntry;

    hasFieldValuePacked(): boolean;
    clearFieldValuePacked(): void;
    getFieldValuePacked(): google_protobuf_any_pb.Any | undefined;
    setFieldValuePacked(value?: google_protobuf_any_pb.Any): FieldMapEntry;

    hasEnumValue(): boolean;
    clearEnumValue(): void;
    getEnumValue(): number;
    setEnumValue(value: number): FieldMapEntry;

    hasStringValue(): boolean;
    clearStringValue(): void;
    getStringValue(): string;
    setStringValue(value: string): FieldMapEntry;
    getOperator(): PositionFilterOperator;
    setOperator(value: PositionFilterOperator): FieldMapEntry;

    getFieldmapvalueoneofCase(): FieldMapEntry.FieldmapvalueoneofCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FieldMapEntry.AsObject;
    static toObject(includeInstance: boolean, msg: FieldMapEntry): FieldMapEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FieldMapEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FieldMapEntry;
    static deserializeBinaryFromReader(message: FieldMapEntry, reader: jspb.BinaryReader): FieldMapEntry;
}

export namespace FieldMapEntry {
    export type AsObject = {
        field: fintekkers_models_position_field_pb.FieldProto,
        fieldValuePacked?: google_protobuf_any_pb.Any.AsObject,
        enumValue: number,
        stringValue: string,
        operator: PositionFilterOperator,
    }

    export enum FieldmapvalueoneofCase {
        FIELDMAPVALUEONEOF_NOT_SET = 0,
        FIELD_VALUE_PACKED = 4,
        ENUM_VALUE = 5,
        STRING_VALUE = 6,
    }

}

export enum PositionFilterOperator {
    UNKNOWN_OPERATOR = 0,
    EQUALS = 1,
    NOT_EQUALS = 2,
    LESS_THAN = 3,
    LESS_THAN_OR_EQUALS = 4,
    MORE_THAN = 5,
    MORE_THAN_OR_EQUALS = 6,
}
