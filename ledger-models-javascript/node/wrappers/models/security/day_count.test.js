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
 * LM-498: bond day-count convention. DayCountConventionProto, optional
 * BondDetailsProto.day_count, hierarchy.json default_day_count, the
 * Security.getDayCount getter and the date helpers. Parity with Python
 * test_day_count.py, Java DayCountsTest and Rust day_count_test.rs.
 *
 * Shared cases live in ledger-models-protos/fixtures/default_day_count_cases.json
 * and test-fixtures/day-count/cases.json; expected values come from those files
 * only, never from the code under test.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const luxon_1 = require("luxon");
const day_count_1 = require("./day_count");
const security_1 = __importDefault(require("./security"));
const errors_1 = require("../errors");
const day_count_convention_pb_1 = require("../../../fintekkers/models/security/day_count_convention_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const ROOT = path.resolve(__dirname, '../../../../..');
const PROTOS = path.join(ROOT, 'ledger-models-protos');
function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
const PRODUCT_CASES = readJson(path.join(PROTOS, 'fixtures/default_day_count_cases.json')).cases;
const DATE_CASES = readJson(path.join(ROOT, 'test-fixtures/day-count/cases.json')).cases;
const PRODUCT_TYPES = product_type_pb_1.ProductTypeProto;
const CONVENTIONS = day_count_convention_pb_1.DayCountConventionProto;
function bond(productType, dayCountValue) {
    const bd = new security_pb_1.BondDetailsProto();
    if (dayCountValue !== undefined)
        bd.setDayCount(dayCountValue);
    return new security_pb_1.SecurityProto().setProductType(productType).setBondDetails(bd);
}
function d(iso) {
    return luxon_1.DateTime.fromISO(iso);
}
// ---------- metric 1: enum numbers and presence ----------
test('DayCountConventionProto numbers', () => {
    expect(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT).toBe(0);
    expect(day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA).toBe(1);
    expect(day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US).toBe(2);
    expect(day_count_convention_pb_1.DayCountConventionProto.ACT_360).toBe(3);
    expect(day_count_convention_pb_1.DayCountConventionProto.ACT_365_FIXED).toBe(4);
    expect(Object.keys(day_count_convention_pb_1.DayCountConventionProto)).toHaveLength(5);
});
test('day_count presence is false when unset', () => {
    expect(new security_pb_1.BondDetailsProto().hasDayCount()).toBe(false);
    expect(new security_pb_1.BondDetailsProto().setDayCount(day_count_convention_pb_1.DayCountConventionProto.ACT_360).hasDayCount()).toBe(true);
});
// ---------- metric 2: hierarchy.json default_day_count ----------
test('the shipped section has the six leaf mappings', () => {
    const section = readJson(path.join(PROTOS, 'hierarchy.json')).default_day_count;
    expect(section).toEqual({
        TREASURY_NOTE: 'ACT_ACT_ICMA',
        TREASURY_BOND: 'ACT_ACT_ICMA',
        TIPS: 'ACT_ACT_ICMA',
        STRIPS: 'ACT_ACT_ICMA',
        TBILL: 'ACT_360',
        CORP_BOND: 'THIRTY_360_US',
    });
    expect([...(0, day_count_1.parseDefaultDayCount)(section).entries]).toEqual([...(0, day_count_1.shippedDefaultDayCounts)().entries]);
});
test('the fixture lists every ProductTypeProto enum value', () => {
    expect(Object.keys(PRODUCT_CASES).sort()).toEqual(Object.keys(product_type_pb_1.ProductTypeProto).sort());
});
test.each(Object.entries(PRODUCT_CASES))('%s resolves as the fixture says (%s)', (productType, expected) => {
    expect((0, day_count_1.resolveDayCount)(bond(PRODUCT_TYPES[productType]))).toBe(CONVENTIONS[expected]);
});
test('the shipped entries are read-only', () => {
    const entries = (0, day_count_1.shippedDefaultDayCounts)().entries;
    expect(() => entries.set('BOND', day_count_convention_pb_1.DayCountConventionProto.ACT_360)).toThrow(TypeError);
    expect((0, day_count_1.shippedDefaultDayCounts)().defaultFor('BOND')).toBe(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT);
});
test.each([
    ['an unknown node', { NOT_A_NODE: 'ACT_360' }, 'NOT_A_NODE'],
    ['an unknown convention name', { CORP_BOND: 'THIRTY_360' }, 'THIRTY_360'],
    ['an UNKNOWN_DAY_COUNT value', { CORP_BOND: 'UNKNOWN_DAY_COUNT' }, 'UNKNOWN_DAY_COUNT'],
    ['an inherited key as a convention name', { CORP_BOND: 'toString' }, 'toString'],
    ['a non-string value', { CORP_BOND: 2 }, 'CORP_BOND'],
    ['a missing section', undefined, 'missing'],
    ['a section that is not an object', ['CORP_BOND', 'ACT_360'], 'object'],
])('%s throws', (_name, section, match) => {
    expect(() => (0, day_count_1.parseDefaultDayCount)(section)).toThrow(/default_day_count/);
    expect(() => (0, day_count_1.parseDefaultDayCount)(section)).toThrow(match);
});
// ---------- metric 3: the getter ----------
test.each([
    ['Treasury note', product_type_pb_1.ProductTypeProto.TREASURY_NOTE, day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA],
    ['corporate bond', product_type_pb_1.ProductTypeProto.CORP_BOND, day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US],
    ['bill', product_type_pb_1.ProductTypeProto.TBILL, day_count_convention_pb_1.DayCountConventionProto.ACT_360],
])('getDayCount: an unset %s returns the product default', (_name, productType, expected) => {
    expect(new security_1.default(bond(productType)).getDayCount()).toBe(expected);
});
test('getDayCount: an explicit value wins', () => {
    const security = new security_1.default(bond(product_type_pb_1.ProductTypeProto.TREASURY_NOTE, day_count_convention_pb_1.DayCountConventionProto.ACT_360));
    expect(security.getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.ACT_360);
});
test('serialize-then-parse keeps an explicit value and keeps unset unset', () => {
    const explicit = security_pb_1.SecurityProto.deserializeBinary(bond(product_type_pb_1.ProductTypeProto.TREASURY_NOTE, day_count_convention_pb_1.DayCountConventionProto.ACT_360).serializeBinary());
    expect(explicit.getBondDetails().hasDayCount()).toBe(true);
    expect(new security_1.default(explicit).getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.ACT_360);
    const unset = security_pb_1.SecurityProto.deserializeBinary(bond(product_type_pb_1.ProductTypeProto.TREASURY_NOTE).serializeBinary());
    expect(unset.getBondDetails().hasDayCount()).toBe(false);
    expect(new security_1.default(unset).getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA);
});
test('serialize-then-parse: an explicit UNKNOWN_DAY_COUNT is present and resolves like unset', () => {
    const parsed = security_pb_1.SecurityProto.deserializeBinary(bond(product_type_pb_1.ProductTypeProto.CORP_BOND, day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT).serializeBinary());
    expect(parsed.getBondDetails().hasDayCount()).toBe(true);
    expect(new security_1.default(parsed).getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US);
});
// ---------- guardrail 3: no entry is UNKNOWN_DAY_COUNT, never a guess ----------
test.each([
    ['TREASURY_FRN', product_type_pb_1.ProductTypeProto.TREASURY_FRN],
    ['PRODUCT_TYPE_UNKNOWN', product_type_pb_1.ProductTypeProto.PRODUCT_TYPE_UNKNOWN],
])('getDayCount: an unset %s bond returns UNKNOWN_DAY_COUNT', (_name, productType) => {
    expect(new security_1.default(bond(productType)).getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT);
});
test('getDayCount: an unrecognised explicit value returns UNKNOWN_DAY_COUNT', () => {
    expect(new security_1.default(bond(product_type_pb_1.ProductTypeProto.CORP_BOND, 99)).getDayCount())
        .toBe(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT);
});
test('getDayCount: an equity returns UNKNOWN_DAY_COUNT', () => {
    const equity = new security_pb_1.SecurityProto().setProductType(product_type_pb_1.ProductTypeProto.COMMON_STOCK)
        .setEquityDetails(new security_pb_1.EquityDetailsProto());
    expect(new security_1.default(equity).getDayCount()).toBe(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT);
});
// ---------- metric 4: the date helpers ----------
test.each(DATE_CASES.map(c => [`${c.convention}:${c.case}`, c]))('helpers match fixture row %s', (_id, c) => {
    const conv = CONVENTIONS[c.convention];
    const start = d(c.start);
    const end = d(c.end);
    expect((0, day_count_1.dayCount)(conv, start, end)).toBe(c.day_count);
    if (conv === day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA) {
        const ps = d(c.period_start);
        const pe = d(c.period_end);
        expect(Math.abs((0, day_count_1.icmaPeriodFraction)(start, end, ps, pe) - c.period_fraction)).toBeLessThanOrEqual(1e-12);
        expect(Math.abs((0, day_count_1.icmaYearFraction)(start, end, ps, pe, c.frequency) - c.year_fraction)).toBeLessThanOrEqual(1e-12);
    }
    else {
        expect(Math.abs((0, day_count_1.yearFraction)(conv, start, end) - c.year_fraction)).toBeLessThanOrEqual(1e-12);
    }
});
test('helpers use the calendar date only, not the time or zone', () => {
    const start = luxon_1.DateTime.fromISO('2026-12-01T23:30:00', { zone: 'America/New_York' });
    const end = luxon_1.DateTime.fromISO('2027-03-01T00:15:00', { zone: 'Asia/Tokyo' });
    expect((0, day_count_1.dayCount)(day_count_convention_pb_1.DayCountConventionProto.ACT_360, start, end)).toBe(90);
});
test.each([
    ['start > end', () => (0, day_count_1.dayCount)(day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US, d('2027-03-01'), d('2027-02-01'))],
    ['UNKNOWN_DAY_COUNT', () => (0, day_count_1.dayCount)(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT, d('2027-01-01'), d('2027-02-01'))],
    ['yearFraction UNKNOWN_DAY_COUNT',
        () => (0, day_count_1.yearFraction)(day_count_convention_pb_1.DayCountConventionProto.UNKNOWN_DAY_COUNT, d('2027-01-01'), d('2027-02-01'))],
    ['yearFraction ACT_ACT_ICMA',
        () => (0, day_count_1.yearFraction)(day_count_convention_pb_1.DayCountConventionProto.ACT_ACT_ICMA, d('2027-01-01'), d('2027-02-01'))],
    ['ICMA start > end', () => (0, day_count_1.icmaYearFraction)(d('2027-03-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 2)],
    ['ICMA outside period',
        () => (0, day_count_1.icmaYearFraction)(d('2026-11-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 2)],
    ['ICMA frequency 0', () => (0, day_count_1.icmaYearFraction)(d('2027-01-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 0)],
    ['an invalid date', () => (0, day_count_1.dayCount)(day_count_convention_pb_1.DayCountConventionProto.ACT_360, d('not-a-date'), d('2027-02-01'))],
])('%s throws ModelValidationError', (_name, call) => {
    expect(call).toThrow(errors_1.ModelValidationError);
});
// ---------- guardrail 1: a bad day-count section breaks nothing else ----------
test('a bad default_day_count section leaves price types and the helpers working', () => {
    const real = readJson(path.join(PROTOS, 'hierarchy.json'));
    const broken = Object.assign(Object.assign({}, real), { default_day_count: { NOT_A_NODE: 'ACT_360' } });
    jest.isolateModules(() => {
        jest.doMock('../../../../hierarchy.json', () => broken);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const dc = require('./day_count');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const dpt = require('./default_price_types');
        expect(() => dc.resolveDayCount(bond(product_type_pb_1.ProductTypeProto.CORP_BOND))).toThrow(/default_day_count/);
        expect(dpt.resolveTradePriceType(new security_pb_1.SecurityProto().setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)))
            .toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
        expect(dc.dayCount(day_count_convention_pb_1.DayCountConventionProto.THIRTY_360_US, d('2026-12-01'), d('2027-03-01'))).toBe(90);
    });
    jest.dontMock('../../../../hierarchy.json');
});
//# sourceMappingURL=day_count.test.js.map