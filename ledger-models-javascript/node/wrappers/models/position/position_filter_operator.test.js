"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const position_filter_operator_1 = require("./position_filter_operator");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
describe('PositionFilterOperator.fromName', () => {
    test.each(position_filter_operator_1.PositionFilterOperator.getAllTypeNames())('fromName("%s") returns the matching numeric enum value', (name) => {
        const value = position_filter_operator_1.PositionFilterOperator.fromName(name);
        const expected = position_util_pb_1.PositionFilterOperator[name];
        expect(value).toBe(expected);
    });
    test('throws on unknown name and lists valid names in the error', () => {
        let err;
        try {
            position_filter_operator_1.PositionFilterOperator.fromName('NOT_A_REAL_OPERATOR');
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.message).toContain('NOT_A_REAL_OPERATOR');
        expect(err.message).toContain('EQUALS');
        expect(err.message).toContain('MORE_THAN');
    });
    test('throws on lowercase URL-style input (fromName takes proto enum names)', () => {
        // ledger-models is the source-of-truth vocabulary; consumers
        // (including URL conventions in UI) standardize on proto names.
        // Pin the strict behavior so this contract is loudly tested.
        expect(() => position_filter_operator_1.PositionFilterOperator.fromName('greater_than')).toThrow();
        expect(() => position_filter_operator_1.PositionFilterOperator.fromName('more_than')).toThrow();
    });
    test('accepts UNKNOWN_OPERATOR — sentinel is a valid enum key', () => {
        // Excluded from getAllTypeNames (no dropdown surface) but still a
        // valid proto enum value. Mirrors Identifier / SecurityType /
        // AssetClass behavior.
        expect(position_filter_operator_1.PositionFilterOperator.fromName('UNKNOWN_OPERATOR')).toBe(position_util_pb_1.PositionFilterOperator.UNKNOWN_OPERATOR);
    });
});
describe('PositionFilterOperator.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN_OPERATOR', () => {
        // Proto-declared order in position_util.proto:
        //   UNKNOWN_OPERATOR = 0;        (excluded)
        //   EQUALS = 1;
        //   NOT_EQUALS = 2;
        //   LESS_THAN = 3;
        //   LESS_THAN_OR_EQUALS = 4;
        //   MORE_THAN = 5;
        //   MORE_THAN_OR_EQUALS = 6;
        expect(position_filter_operator_1.PositionFilterOperator.getAllTypeNames()).toEqual([
            'EQUALS',
            'NOT_EQUALS',
            'LESS_THAN',
            'LESS_THAN_OR_EQUALS',
            'MORE_THAN',
            'MORE_THAN_OR_EQUALS',
        ]);
    });
    test('excludes the UNKNOWN_OPERATOR sentinel', () => {
        expect(position_filter_operator_1.PositionFilterOperator.getAllTypeNames()).not.toContain('UNKNOWN_OPERATOR');
    });
});
//# sourceMappingURL=position_filter_operator.test.js.map