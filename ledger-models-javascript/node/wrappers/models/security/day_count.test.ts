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
import * as fs from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon';
import {
  dayCount,
  icmaPeriodFraction,
  icmaYearFraction,
  parseDefaultDayCount,
  resolveDayCount,
  shippedDefaultDayCounts,
  yearFraction,
} from './day_count';
import Security from './security';
import { ModelValidationError } from '../errors';
import { DayCountConventionProto } from '../../../fintekkers/models/security/day_count_convention_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { BondDetailsProto, EquityDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';

const ROOT = path.resolve(__dirname, '../../../../..');
const PROTOS = path.join(ROOT, 'ledger-models-protos');

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const PRODUCT_CASES: Record<string, string> = readJson(path.join(PROTOS, 'fixtures/default_day_count_cases.json')).cases;
const DATE_CASES: Array<Record<string, any>> = readJson(path.join(ROOT, 'test-fixtures/day-count/cases.json')).cases;

const PRODUCT_TYPES = ProductTypeProto as unknown as Record<string, ProductTypeProto>;
const CONVENTIONS = DayCountConventionProto as unknown as Record<string, DayCountConventionProto>;

function bond(productType: ProductTypeProto, dayCountValue?: number): SecurityProto {
  const bd = new BondDetailsProto();
  if (dayCountValue !== undefined) bd.setDayCount(dayCountValue as DayCountConventionProto);
  return new SecurityProto().setProductType(productType).setBondDetails(bd);
}

function d(iso: string): DateTime {
  return DateTime.fromISO(iso);
}

// ---------- metric 1: enum numbers and presence ----------

test('DayCountConventionProto numbers', () => {
  expect(DayCountConventionProto.UNKNOWN_DAY_COUNT).toBe(0);
  expect(DayCountConventionProto.ACT_ACT_ICMA).toBe(1);
  expect(DayCountConventionProto.THIRTY_360_US).toBe(2);
  expect(DayCountConventionProto.ACT_360).toBe(3);
  expect(DayCountConventionProto.ACT_365_FIXED).toBe(4);
  expect(Object.keys(DayCountConventionProto)).toHaveLength(5);
});

test('day_count presence is false when unset', () => {
  expect(new BondDetailsProto().hasDayCount()).toBe(false);
  expect(new BondDetailsProto().setDayCount(DayCountConventionProto.ACT_360).hasDayCount()).toBe(true);
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
  expect([...parseDefaultDayCount(section).entries]).toEqual([...shippedDefaultDayCounts().entries]);
});

test('the fixture lists every ProductTypeProto enum value', () => {
  expect(Object.keys(PRODUCT_CASES).sort()).toEqual(Object.keys(ProductTypeProto).sort());
});

test.each(Object.entries(PRODUCT_CASES))('%s resolves as the fixture says (%s)', (productType, expected) => {
  expect(resolveDayCount(bond(PRODUCT_TYPES[productType]))).toBe(CONVENTIONS[expected]);
});

test('the shipped entries are read-only', () => {
  const entries = shippedDefaultDayCounts().entries as Map<string, DayCountConventionProto>;
  expect(() => entries.set('BOND', DayCountConventionProto.ACT_360)).toThrow(TypeError);
  expect(shippedDefaultDayCounts().defaultFor('BOND')).toBe(DayCountConventionProto.UNKNOWN_DAY_COUNT);
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
  expect(() => parseDefaultDayCount(section)).toThrow(/default_day_count/);
  expect(() => parseDefaultDayCount(section)).toThrow(match);
});

// ---------- metric 3: the getter ----------

test.each([
  ['Treasury note', ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_ACT_ICMA],
  ['corporate bond', ProductTypeProto.CORP_BOND, DayCountConventionProto.THIRTY_360_US],
  ['bill', ProductTypeProto.TBILL, DayCountConventionProto.ACT_360],
])('getDayCount: an unset %s returns the product default', (_name, productType, expected) => {
  expect(new Security(bond(productType)).getDayCount()).toBe(expected);
});

test('getDayCount: an explicit value wins', () => {
  const security = new Security(bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360));
  expect(security.getDayCount()).toBe(DayCountConventionProto.ACT_360);
});

test('serialize-then-parse keeps an explicit value and keeps unset unset', () => {
  const explicit = SecurityProto.deserializeBinary(
    bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360).serializeBinary());
  expect(explicit.getBondDetails()!.hasDayCount()).toBe(true);
  expect(new Security(explicit).getDayCount()).toBe(DayCountConventionProto.ACT_360);

  const unset = SecurityProto.deserializeBinary(bond(ProductTypeProto.TREASURY_NOTE).serializeBinary());
  expect(unset.getBondDetails()!.hasDayCount()).toBe(false);
  expect(new Security(unset).getDayCount()).toBe(DayCountConventionProto.ACT_ACT_ICMA);
});

test('serialize-then-parse: an explicit UNKNOWN_DAY_COUNT is present and resolves like unset', () => {
  const parsed = SecurityProto.deserializeBinary(
    bond(ProductTypeProto.CORP_BOND, DayCountConventionProto.UNKNOWN_DAY_COUNT).serializeBinary());
  expect(parsed.getBondDetails()!.hasDayCount()).toBe(true);
  expect(new Security(parsed).getDayCount()).toBe(DayCountConventionProto.THIRTY_360_US);
});

// ---------- guardrail 3: no entry is UNKNOWN_DAY_COUNT, never a guess ----------

test.each([
  ['TREASURY_FRN', ProductTypeProto.TREASURY_FRN],
  ['PRODUCT_TYPE_UNKNOWN', ProductTypeProto.PRODUCT_TYPE_UNKNOWN],
])('getDayCount: an unset %s bond returns UNKNOWN_DAY_COUNT', (_name, productType) => {
  expect(new Security(bond(productType)).getDayCount()).toBe(DayCountConventionProto.UNKNOWN_DAY_COUNT);
});

test('getDayCount: an unrecognised explicit value returns UNKNOWN_DAY_COUNT', () => {
  expect(new Security(bond(ProductTypeProto.CORP_BOND, 99)).getDayCount())
    .toBe(DayCountConventionProto.UNKNOWN_DAY_COUNT);
});

test('getDayCount: an equity returns UNKNOWN_DAY_COUNT', () => {
  const equity = new SecurityProto().setProductType(ProductTypeProto.COMMON_STOCK)
    .setEquityDetails(new EquityDetailsProto());
  expect(new Security(equity).getDayCount()).toBe(DayCountConventionProto.UNKNOWN_DAY_COUNT);
});

// ---------- metric 4: the date helpers ----------

test.each(DATE_CASES.map(c => [`${c.convention}:${c.case}`, c] as [string, Record<string, any>]))(
  'helpers match fixture row %s', (_id, c) => {
    const conv = CONVENTIONS[c.convention];
    const start = d(c.start);
    const end = d(c.end);
    expect(dayCount(conv, start, end)).toBe(c.day_count);
    if (conv === DayCountConventionProto.ACT_ACT_ICMA) {
      const ps = d(c.period_start);
      const pe = d(c.period_end);
      expect(Math.abs(icmaPeriodFraction(start, end, ps, pe) - c.period_fraction)).toBeLessThanOrEqual(1e-12);
      expect(Math.abs(icmaYearFraction(start, end, ps, pe, c.frequency) - c.year_fraction)).toBeLessThanOrEqual(1e-12);
    } else {
      expect(Math.abs(yearFraction(conv, start, end) - c.year_fraction)).toBeLessThanOrEqual(1e-12);
    }
  });

test('helpers use the calendar date only, not the time or zone', () => {
  const start = DateTime.fromISO('2026-12-01T23:30:00', { zone: 'America/New_York' });
  const end = DateTime.fromISO('2027-03-01T00:15:00', { zone: 'Asia/Tokyo' });
  expect(dayCount(DayCountConventionProto.ACT_360, start, end)).toBe(90);
});

test.each([
  ['start > end', () => dayCount(DayCountConventionProto.THIRTY_360_US, d('2027-03-01'), d('2027-02-01'))],
  ['UNKNOWN_DAY_COUNT', () => dayCount(DayCountConventionProto.UNKNOWN_DAY_COUNT, d('2027-01-01'), d('2027-02-01'))],
  ['yearFraction UNKNOWN_DAY_COUNT',
    () => yearFraction(DayCountConventionProto.UNKNOWN_DAY_COUNT, d('2027-01-01'), d('2027-02-01'))],
  ['yearFraction ACT_ACT_ICMA',
    () => yearFraction(DayCountConventionProto.ACT_ACT_ICMA, d('2027-01-01'), d('2027-02-01'))],
  ['ICMA start > end', () => icmaYearFraction(d('2027-03-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 2)],
  ['ICMA outside period',
    () => icmaYearFraction(d('2026-11-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 2)],
  ['ICMA frequency 0', () => icmaYearFraction(d('2027-01-01'), d('2027-02-01'), d('2026-12-01'), d('2027-06-01'), 0)],
  ['an invalid date', () => dayCount(DayCountConventionProto.ACT_360, d('not-a-date'), d('2027-02-01'))],
])('%s throws ModelValidationError', (_name, call) => {
  expect(call).toThrow(ModelValidationError);
});

// ---------- guardrail 1: a bad day-count section breaks nothing else ----------

test('a bad default_day_count section leaves price types and the helpers working', () => {
  const real = readJson(path.join(PROTOS, 'hierarchy.json'));
  const broken = { ...real, default_day_count: { NOT_A_NODE: 'ACT_360' } };
  jest.isolateModules(() => {
    jest.doMock('../../../../hierarchy.json', () => broken);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dc = require('./day_count');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dpt = require('./default_price_types');
    expect(() => dc.resolveDayCount(bond(ProductTypeProto.CORP_BOND))).toThrow(/default_day_count/);
    expect(dpt.resolveTradePriceType(new SecurityProto().setProductType(ProductTypeProto.TREASURY_NOTE)))
      .toBe(PriceTypeProto.PERCENTAGE);
    expect(dc.dayCount(DayCountConventionProto.THIRTY_360_US, d('2026-12-01'), d('2027-03-01'))).toBe(90);
  });
  jest.dontMock('../../../../hierarchy.json');
});
