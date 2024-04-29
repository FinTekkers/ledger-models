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
     * @param {*} fieldValueString The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    PositionFilter.prototype.addEqualsStringFilter = function (field, fieldValueString) {
        return this.addFilter(field, position_util_pb_1.PositionFilterOperator.EQUALS, null, fieldValueString);
    };
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    PositionFilter.prototype.addEqualsFilter = function (field, fieldValue) {
        if (typeof fieldValue === 'string') {
            return this.addEqualsStringFilter(field, fieldValue);
        }
        else {
            return this.addFilter(field, position_util_pb_1.PositionFilterOperator.EQUALS, fieldValue, null);
        }
    };
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    PositionFilter.prototype.addFilter = function (field, operator, fieldValue, fieldValueString) {
        var fieldMapEntry = new position_util_pb_1.FieldMapEntry();
        fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
        fieldMapEntry.setOperator(operator);
        if (fieldValueString)
            fieldMapEntry.setStringValue(fieldValueString);
        else if (fieldValue) {
            fieldMapEntry.setFieldValuePacked((0, serialization_util_1.pack)(fieldValue));
        }
        else {
            throw new Error("Need to provide a string, or object");
        }
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