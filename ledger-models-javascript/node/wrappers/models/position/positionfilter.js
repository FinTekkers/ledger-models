"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionFilter = void 0;
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const serialization_util_1 = require("../utils/serialization.util");
const position_filter_pb_1 = require("../../../fintekkers/models/position/position_filter_pb");
class PositionFilter {
    constructor() {
        this.filters = [];
    }
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValueString The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsStringFilter(field, fieldValueString) {
        return this.addFilter(field, position_util_pb_1.PositionFilterOperator.EQUALS, null, fieldValueString);
    }
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsFilter(field, fieldValue) {
        if (typeof fieldValue === 'string') {
            return this.addEqualsStringFilter(field, fieldValue);
        }
        else {
            return this.addFilter(field, position_util_pb_1.PositionFilterOperator.EQUALS, fieldValue, undefined);
        }
    }
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addFilter(field, operator, fieldValue, fieldValueString) {
        const fieldMapEntry = new position_util_pb_1.FieldMapEntry();
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
    }
    getFilters() {
        return this.filters;
    }
    toProto() {
        const positionFilterProto = new position_filter_pb_1.PositionFilterProto();
        positionFilterProto.setObjectClass('PositionFilter');
        positionFilterProto.setVersion('0.0.1');
        positionFilterProto.setFiltersList(this.filters);
        return positionFilterProto;
    }
}
exports.PositionFilter = PositionFilter;
//# sourceMappingURL=positionfilter.js.map