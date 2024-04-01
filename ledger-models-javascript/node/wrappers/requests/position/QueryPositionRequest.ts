//Models
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionTypeProto, PositionViewProto } from "../../../fintekkers/models/position/position_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import { ZonedDateTime } from "../../models/utils/datetime";
import { PositionFilter } from "../../models/position/positionfilter";
import { RequestOperationTypeProto } from "../../../fintekkers/requests/util/operation_pb";

//Requests
import { QueryPositionRequestProto } from "../../../fintekkers/requests/position/query_position_request_pb";

export class QueryPositionRequest {
    private filter: PositionFilter;
    private positionType: PositionTypeProto;
    private positionView: PositionViewProto;
    private fields: Array<FieldProto>;
    private measures: Array<MeasureProto>;
    private asOf: ZonedDateTime;

    static fromAsOf(fields: Array<FieldProto>, measures: Array<MeasureProto>, asOf: ZonedDateTime): QueryPositionRequest {
        return new QueryPositionRequest(
            new PositionFilter(),
            PositionTypeProto.TRANSACTION,
            PositionViewProto.DEFAULT_VIEW,
            fields,
            measures,
            asOf);
    }

    static from(fields: Array<FieldProto>, measures: Array<MeasureProto>): QueryPositionRequest {
        return QueryPositionRequest.fromAsOf(fields, measures, ZonedDateTime.now());
    }

    constructor(filter: PositionFilter, positionType: PositionTypeProto, positionView: PositionViewProto,
        fields: Array<FieldProto>, measures: Array<MeasureProto>, asOf: ZonedDateTime) {
        this.filter = filter;

        this.positionType = positionType;
        this.positionView = positionView;
        this.fields = fields;
        this.measures = measures;
        this.asOf = asOf;
    }

    public toProto(): QueryPositionRequestProto {
        const proto = new QueryPositionRequestProto()
            .setAsOf(this.asOf.toProto())
            .setVersion("1.0.0")
            .setPositionType(this.positionType)
            .setPositionView(this.positionView)
            .setFieldsList(this.fields)
            .setMeasuresList(this.measures)
            .setOperationType(RequestOperationTypeProto.SEARCH);

        if (this.filter && this.filter.getFilters().length > 0)
            proto.setFilterFields(this.filter.toProto())

        return proto;
    }

    public getFilter(): PositionFilter {
        return this.filter;
    }
}
