import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import Portfolio from "../portfolio/portfolio";
import Security from "../security/security";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { ProtoEnum } from "../utils/protoEnum";
import { UUID } from "../utils/uuid";
import { ZonedDateTime } from "../utils/datetime";
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { Tenor } from "../security/term";
import { Identifier } from "../security/identifier";
export declare class Position {
    proto: PositionProto;
    constructor(positionProto: PositionProto);
    /*** */
    toJSON(): any;
    /**
     * Experimental impelementaiton
     * @param binary An array which is the raw binary of the proto object
     * @returns A Position object with the deserialized binary inside it
     */
    static fromJSON(json: any): Position;
    getFieldValue(field: FieldProto): any;
    getField(fieldToGet: FieldMapEntry): string | ProtoEnum | Security | Identifier | Portfolio | UUID | Date | ZonedDateTime | number | PriceProto | Tenor;
    getMeasureValue(measure: MeasureProto): Decimal;
    private getMeasure;
    getFieldDisplay(fieldToGet: FieldMapEntry): string;
    getMeasures(): MeasureMapEntry[];
    getFields(): FieldMapEntry[];
    toString(): string;
    static unpackField(fieldToUnpack: FieldMapEntry): any;
}
