"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPositionRequest = void 0;
var position_pb_1 = require("../../../fintekkers/models/position/position_pb");
var datetime_1 = require("../../models/utils/datetime");
var positionfilter_1 = require("../../models/position/positionfilter");
var operation_pb_1 = require("../../../fintekkers/requests/util/operation_pb");
//Requests
var query_position_request_pb_1 = require("../../../fintekkers/requests/position/query_position_request_pb");
var QueryPositionRequest = /** @class */ (function () {
    function QueryPositionRequest(filter, positionType, positionView, fields, measures, asOf) {
        this.filter = filter;
        this.positionType = positionType;
        this.positionView = positionView;
        this.fields = fields;
        this.measures = measures;
        this.asOf = asOf;
    }
    QueryPositionRequest.fromAsOf = function (fields, measures, asOf) {
        return new QueryPositionRequest(new positionfilter_1.PositionFilter(), position_pb_1.PositionTypeProto.TRANSACTION, position_pb_1.PositionViewProto.DEFAULT_VIEW, fields, measures, asOf);
    };
    QueryPositionRequest.from = function (fields, measures) {
        return QueryPositionRequest.fromAsOf(fields, measures, datetime_1.ZonedDateTime.now());
    };
    QueryPositionRequest.prototype.toProto = function () {
        var proto = new query_position_request_pb_1.QueryPositionRequestProto()
            .setAsOf(this.asOf.toProto())
            .setVersion("1.0.0")
            .setPositionType(this.positionType)
            .setPositionView(this.positionView)
            .setFieldsList(this.fields)
            .setMeasuresList(this.measures)
            .setOperationType(operation_pb_1.RequestOperationTypeProto.SEARCH);
        if (this.filter && this.filter.getFilters().length > 0)
            proto.setFilterFields(this.filter.toProto());
        return proto;
    };
    QueryPositionRequest.prototype.getFilter = function () {
        return this.filter;
    };
    return QueryPositionRequest;
}());
exports.QueryPositionRequest = QueryPositionRequest;
//# sourceMappingURL=QueryPositionRequest.js.map