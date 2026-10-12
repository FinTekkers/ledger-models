"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPositionRequest = void 0;
const position_pb_1 = require("../../../fintekkers/models/position/position_pb");
const datetime_1 = require("../../models/utils/datetime");
const positionfilter_1 = require("../../models/position/positionfilter");
const operation_pb_1 = require("../../../fintekkers/requests/util/operation_pb");
//Requests
const query_position_request_pb_1 = require("../../../fintekkers/requests/position/query_position_request_pb");
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const object_types_1 = require("../../util/object-types");
class QueryPositionRequest {
    static fromAsOf(fields, measures, asOf) {
        return new QueryPositionRequest(new positionfilter_1.PositionFilter(), position_pb_1.PositionTypeProto.TRANSACTION, position_pb_1.PositionViewProto.DEFAULT_VIEW, fields, measures, asOf);
    }
    static from(fields, measures) {
        return QueryPositionRequest.fromAsOf(fields, measures, datetime_1.ZonedDateTime.now());
    }
    constructor(filter, positionType, positionView, fields, measures, asOf) {
        this.filter = filter;
        this.positionType = positionType;
        this.positionView = positionView;
        this.fields = fields;
        this.measures = measures;
        this.asOf = asOf;
    }
    toProto() {
        const proto = (0, object_types_1.stamp)(new query_position_request_pb_1.QueryPositionRequestProto(), object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST, '', '1.0.0')
            .setAsOf(this.asOf.toProto())
            .setPositionType(this.positionType)
            .setPositionView(this.positionView)
            .setFieldsList(this.fields)
            .setMeasuresList(this.measures)
            .setOperationType(operation_pb_1.RequestOperationTypeProto.SEARCH);
        if (this.filter && this.filter.getFilters().length > 0)
            proto.setFilterFields(this.filter.toProto());
        return proto;
    }
    getFilter() {
        return this.filter;
    }
}
exports.QueryPositionRequest = QueryPositionRequest;
//# sourceMappingURL=QueryPositionRequest.js.map