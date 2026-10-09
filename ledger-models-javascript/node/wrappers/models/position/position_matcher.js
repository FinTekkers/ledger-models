"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterRows = exports.matches = void 0;
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const product_hierarchy_1 = require("../security/product_hierarchy");
/**
 * Single-field evaluator (LM-281), mirroring Java's PositionFilter.matches:
 * ASSET_CLASS with EQUALS / NOT_EQUALS uses the shared assetClassMatches
 * rule, so a group code such as FIXED_INCOME matches its members and labels;
 * every other field compares exactly. A null or undefined stored value never
 * throws and drops the row for every operator, except ASSET_CLASS with
 * NOT_EQUALS, which keeps it (LM-281). The null check runs before the
 * ASSET_CLASS branch, so it handles that asset-class exception itself
 * (LM-284). An unknown operator matches nothing. Errors raised by row.getField
 * propagate (a row represents an absent value by returning null).
 */
function matches(field, operator, filterValue, storedValue) {
    if (storedValue === null || storedValue === undefined) {
        return field === field_pb_1.FieldProto.ASSET_CLASS && operator === position_util_pb_1.PositionFilterOperator.NOT_EQUALS;
    }
    if (field === field_pb_1.FieldProto.ASSET_CLASS &&
        (operator === position_util_pb_1.PositionFilterOperator.EQUALS ||
            operator === position_util_pb_1.PositionFilterOperator.NOT_EQUALS)) {
        const equals = (0, product_hierarchy_1.assetClassMatches)(filterValue, storedValue);
        return operator === position_util_pb_1.PositionFilterOperator.EQUALS ? equals : !equals;
    }
    switch (operator) {
        case position_util_pb_1.PositionFilterOperator.EQUALS:
            return storedValue === filterValue;
        case position_util_pb_1.PositionFilterOperator.NOT_EQUALS:
            return storedValue !== filterValue;
        case position_util_pb_1.PositionFilterOperator.LESS_THAN:
            return storedValue < filterValue;
        case position_util_pb_1.PositionFilterOperator.LESS_THAN_OR_EQUALS:
            return storedValue <= filterValue;
        case position_util_pb_1.PositionFilterOperator.MORE_THAN:
            return storedValue > filterValue;
        case position_util_pb_1.PositionFilterOperator.MORE_THAN_OR_EQUALS:
            return storedValue >= filterValue;
        default:
            return false;
    }
}
exports.matches = matches;
/**
 * Keep the rows matching every clause in `filters` (AND semantics, input
 * order preserved).
 */
function filterRows(rows, filters) {
    return rows.filter((row) => {
        return filters.every((spec) => matches(spec.field, spec.operator, spec.value, row.getField(spec.field)));
    });
}
exports.filterRows = filterRows;
