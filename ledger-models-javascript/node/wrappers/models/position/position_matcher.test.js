"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-281: the JS filter helper matches Java's PositionFilter row for row.
 *
 * ASSET_CLASS EQUALS / NOT_EQUALS use the shared assetClassMatches rule;
 * every other field compares exactly. A null stored value never throws.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_1 = __importDefault(require("../security/security"));
const position_matcher_1 = require("./position_matcher");
const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
const nullCases = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/position_filter_null_cases.json'), 'utf-8')).cases;
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
        expect((0, position_matcher_1.matches)(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'a', null)).toBe(false);
    });
    // LM-284: NOT_EQUALS drops a null on every field but ASSET_CLASS. Cases
    // come from ledger-models-protos/fixtures/position_filter_null_cases.json,
    // shared with the Java, Python and Rust tests.
    test('the shared null-cases fixture has its cases', () => {
        expect(nullCases.length).toBeGreaterThanOrEqual(7);
    });
    test.each(nullCases)('$field $operator $filter on null -> $expected', (c) => {
        const field = field_pb_1.FieldProto[c.field];
        const operator = position_util_pb_1.PositionFilterOperator[c.operator];
        expect(field).toBeDefined();
        expect(operator).toBeDefined();
        expect((0, position_matcher_1.matches)(field, operator, c.filter, null)).toBe(c.expected);
    });
    test('filterRows NOT_EQUALS drops a row with a null on another field', () => {
        const filters = [
            { field: field_pb_1.FieldProto.PORTFOLIO_NAME, operator: position_util_pb_1.PositionFilterOperator.NOT_EQUALS, value: 'a' },
        ];
        expect((0, position_matcher_1.filterRows)([stubRow(null)], filters)).toEqual([]);
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
    test('has the LM-284 null rule', () => {
        expect(compiled.matches(field_pb_1.FieldProto.PORTFOLIO_NAME, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'a', null)).toBe(false);
        expect(compiled.matches(field_pb_1.FieldProto.ASSET_CLASS, position_util_pb_1.PositionFilterOperator.NOT_EQUALS, 'FIXED_INCOME', null)).toBe(true);
    });
});
