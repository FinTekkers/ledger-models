import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionTypeProto, PositionViewProto } from "../../../fintekkers/models/position/position_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import { ZonedDateTime } from "../../models/utils/datetime";
import { PositionFilter } from "../../models/position/positionfilter";
import { QueryPositionRequestProto } from "../../../fintekkers/requests/position/query_position_request_pb";
export declare class QueryPositionRequest {
    private filter;
    private positionType;
    private positionView;
    private fields;
    private measures;
    private asOf;
    static fromAsOf(fields: Array<FieldProto>, measures: Array<MeasureProto>, asOf: ZonedDateTime): QueryPositionRequest;
    static from(fields: Array<FieldProto>, measures: Array<MeasureProto>): QueryPositionRequest;
    constructor(filter: PositionFilter, positionType: PositionTypeProto, positionView: PositionViewProto, fields: Array<FieldProto>, measures: Array<MeasureProto>, asOf: ZonedDateTime);
    toProto(): QueryPositionRequestProto;
    getFilter(): PositionFilter;
}
