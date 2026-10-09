"use strict";
/**
 * LM-281: the JS filter helper matches Java's PositionFilter row for row.
 *
 * ASSET_CLASS EQUALS / NOT_EQUALS use the shared assetClassMatches rule;
 * every other field compares exactly. A null stored value never throws.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_1 = __importDefault(require("../security/security"));
const position_matcher_1 = require("./position_matcher");
function securityRow(assetClass) {
    const proto = new security_pb_1.SecurityProto();
    proto.setAssetClass(assetClass);
    return new security_1.default(proto);
}
function stubRow(assetClass) {
    return {
        getField: (_field) => assetClass,
    };
}
function assetClasses(rows) {
    return rows.map((row) => row.getField(field_pb_1.FieldProto.ASSET_CLASS));
}
function assetClassFilter(operator) {
    return [{ field: field_pb_1.FieldProto.ASSET_CLASS, operator, value: 'FIXED_INCOME' }];
}
describe('position_matcher', () => {
    test('ASSET_CLASS EQUALS FIXED_INCOME matches group members', () => {
        const rows = ['RATES', 'CREDIT', 'Fixed Income', 'EQUITY'].map(securityRow);
        const result = (0, position_matcher_1.filterRows)(rows, assetClassFilter(position_util_pb_1.PositionFilterOperator.EQUALS));
        expect(assetClasses(result)).toEqual(['RATES', 'CREDIT', 'Fixed Income']);
    });
    test('ASSET_CLASS NOT_EQUALS FIXED_INCOME keeps only non-members', () => {
        const rows = ['RATES', 'CREDIT', 'Fixed Income', 'EQUITY'].map(securityRow);
        const result = (0, position_matcher_1.filterRows)(rows, assetClassFilter(position_util_pb_1.PositionFilterOperator.NOT_EQUALS));
        expect(assetClasses(result)).toEqual(['EQUITY']);
    });
    test('null, empty and unknown stored values never throw', () => {
        const rows = [stubRow(null), securityRow(''), securityRow('NOT_A_CLASS')];
        const equals = assetClassFilter(position_util_pb_1.PositionFilterOperator.EQUALS);
        const notEquals = assetClassFilter(position_util_pb_1.PositionFilterOperator.NOT_EQUALS);
        expect(() => (0, position_matcher_1.filterRows)(rows, equals)).not.toThrow();
        expect((0, position_matcher_1.filterRows)(rows, equals)).toEqual([]);
        expect(() => (0, position_matcher_1.filterRows)(rows, notEquals)).not.toThrow();
        expect(assetClasses((0, position_matcher_1.filterRows)(rows, notEquals))).toEqual([null, '', 'NOT_A_CLASS']);
    });
    test('other fields compare exactly', () => {
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.EQUALS, 'a', 'a')).toBe(true);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.EQUALS, 'a', 'b')).toBe(false);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'a', 'b')).toBe(true);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'a', 'a')).toBe(false);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.MATURITY_DATE, position_util_pb_1.PositionFilterOperator.MORE_THAN, 1, 2)).toBe(true);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.MATURITY_DATE, position_util_pb_1.PositionFilterOperator.MORE_THAN, 2, 1)).toBe(false);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.EQUALS, 'a', null)).toBe(false);
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'a', null)).toBe(true);
    });
});
describe('the published (compiled) position_matcher.js', () => {
    // npm publish runs no tsc: the tracked .js is what consumers get.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compiled = require('./position_matcher.js');
    test('exports working matches and filterRows', () => {
        expect(typeof compiled.matches).toBe('function');
        expect(typeof compiled.filterRows).toBe('function');
        expect(compiled.matches(field_pb_1.FieldProto.ASSET_CLASS, position_util_pb_1.PositionFilterOperator.EQUALS, 'FIXED_INCOME', 'RATES')).toBe(true);
        expect(compiled.matches(field_pb_1.FieldProto.ASSET_CLASS, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'FIXED_INCOME', 'EQUITY')).toBe(true);
        const rows = ['RATES', 'EQUITY'].map(securityRow);
        const kept = compiled.filterRows(rows, assetClassFilter(position_util_pb_1.PositionFilterOperator.EQUALS));
        expect(assetClasses(kept)).toEqual(['RATES']);
    });
});
