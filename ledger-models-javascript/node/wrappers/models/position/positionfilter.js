"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionFilter = void 0;
var position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
var serialization_util_1 = require("../utils/serialization.util");
var position_filter_pb_1 = require("../../../fintekkers/models/position/position_filter_pb");
var PositionFilter = /** @class */ (function () {
    function PositionFilter() {
        this.filters = [];
    }
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    PositionFilter.prototype.addEqualsFilter = function (field, fieldValue) {
        return this.addFilter(field, fieldValue, position_util_pb_1.PositionFilterOperator.EQUALS);
    };
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    PositionFilter.prototype.addFilter = function (field, fieldValue, operator) {
        var fieldMapEntry = new position_util_pb_1.FieldMapEntry();
        fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
        fieldMapEntry.setFieldValuePacked((0, serialization_util_1.pack)(fieldValue));
        fieldMapEntry.setOperator(operator);
        this.filters.push(fieldMapEntry);
        return this;
    };
    PositionFilter.prototype.getFilters = function () {
        return this.filters;
    };
    PositionFilter.prototype.toProto = function () {
        var positionFilterProto = new position_filter_pb_1.PositionFilterProto();
        positionFilterProto.setObjectClass('PositionFilter');
        positionFilterProto.setVersion('0.0.1');
        positionFilterProto.setFiltersList(this.filters);
        return positionFilterProto;
    };
    return PositionFilter;
}());
exports.PositionFilter = PositionFilter;
//# sourceMappingURL=positionfilter.js.map