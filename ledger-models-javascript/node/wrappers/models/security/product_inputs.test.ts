/**
 * LM-409: valuation_arms in hierarchy.json, resolved by armFor /
 * requiredMarketData.
 *
 * The shared cases live in ledger-models-protos/fixtures/valuation_arms_cases.json,
 * read by the Java, Python and Rust tests too.
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  armFor, measuresForArm, measuresForArmIn, parseValuationArms, requiredMarketData, shippedValuationArms,
} from './product_inputs';
import { descendantsOf } from './product_hierarchy';
import { UnmappedProductTypeError } from '../errors';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { BondDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';

const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
const BUNDLED = path.resolve(__dirname, '../../../../hierarchy.json');

interface Case {
  product_type: string;
  coupon_type: string;
  arm?: string;
  requires?: string[];
  error?: string;
}

const cases: Case[] = JSON.parse(
  fs.readFileSync(path.join(PROTOS, 'fixtures/valuation_arms_cases.json'), 'utf-8'),
).cases;

function sourceSection(): any {
  return JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8')).valuation_arms;
}

function hasEnumValue(productType: string): boolean {
  return Object.prototype.hasOwnProperty.call(ProductTypeProto, productType);
}

function security(productType: string, couponType: string): SecurityProto {
  const details = new BondDetailsProto();
  details.setCouponType(CouponTypeProto[couponType as keyof typeof CouponTypeProto]);
  const s = new SecurityProto();
  s.setProductType(ProductTypeProto[productType as keyof typeof ProductTypeProto]);
  s.setBondDetails(details);
  return s;
}

/** [arm, requires] through a real proto when the type has an enum value; planned leaves by name. */
function resolve(productType: string, couponType: string): [string, string[]] {
  if (!hasEnumValue(productType)) {
    const a = shippedValuationArms().require(productType, couponType);
    return [a.arm, [...a.requires]];
  }
  const s = security(productType, couponType);
  return [armFor(s), requiredMarketData(s)];
}

function catchUnmapped(fn: () => unknown): UnmappedProductTypeError {
  try {
    fn();
  } catch (e) {
    if (e instanceof UnmappedProductTypeError) return e;
    throw e;
  }
  throw new Error('expected UnmappedProductTypeError');
}

describe('valuation_arms shared fixture (metric 1)', () => {
  test('has the required cases', () => {
    expect(cases.length).toBeGreaterThanOrEqual(5);
    const seen = cases.map(c => `${c.product_type}/${c.coupon_type}`);
    expect(seen).toEqual(expect.arrayContaining([
      'TBILL/ZERO', 'TIPS/FIXED', 'CORP_BOND/FLOAT', 'TREASURY_NOTE/FLOAT', 'FX_SPOT/UNKNOWN_COUPON_TYPE',
    ]));
  });

  test.each(cases.map(c => [`${c.product_type}/${c.coupon_type}`, c] as [string, Case]))('%s', (_, c) => {
    if (c.error !== undefined) {
      expect(c.error).toBe('UnmappedProductTypeError');
      const e = catchUnmapped(() => resolve(c.product_type, c.coupon_type));
      expect([e.productType, e.couponType]).toEqual([c.product_type, c.coupon_type]);
    } else {
      expect(resolve(c.product_type, c.coupon_type)).toEqual([c.arm, c.requires]);
    }
  });
});

describe('unmapped types raise (metric 2)', () => {
  const unmapped = new Set(['FX_SPOT']);
  for (const root of ['INDEX', 'CRYPTO', 'COMMODITY_SPOT']) {
    for (const n of descendantsOf(root)) if (descendantsOf(n).length === 0) unmapped.add(n);
  }

  test('the set comes from the registry', () => {
    expect([...unmapped]).toEqual(expect.arrayContaining([
      'FX_SPOT', 'COMMODITY_INDEX', 'PLATINUM', 'PALLADIUM', 'CRYPTOCURRENCY', 'GOLD',
    ]));
  });

  test.each([...unmapped].sort())('%s', pt => {
    const e = catchUnmapped(() => resolve(pt, 'UNKNOWN_COUPON_TYPE'));
    expect(e.message).toContain(pt);
    expect(e.message).toContain('UNKNOWN_COUPON_TYPE');
  });

  test('message names product and coupon type', () => {
    const gold = security('GOLD', 'FLOAT');
    const e = catchUnmapped(() => armFor(gold));
    expect(e.message).toContain('GOLD');
    expect(e.message).toContain('FLOAT');
    expect(() => requiredMarketData(gold)).toThrow(UnmappedProductTypeError);
  });

  test('unset bond_details reads as UNKNOWN_COUPON_TYPE', () => {
    const corp = new SecurityProto();
    corp.setProductType(ProductTypeProto.CORP_BOND);
    expect(armFor(corp)).toBe('bond');
    const fx = new SecurityProto();
    fx.setProductType(ProductTypeProto.FX_SPOT);
    expect(catchUnmapped(() => armFor(fx)).couponType).toBe('UNKNOWN_COUPON_TYPE');
  });
});

test('bundled valuation_arms equals the source (metric 4)', () => {
  expect(fs.existsSync(BUNDLED)).toBe(true);
  const bundled = JSON.parse(fs.readFileSync(BUNDLED, 'utf-8'));
  expect(bundled.valuation_arms).toBeDefined();
  expect(bundled.valuation_arms).toEqual(sourceSection());
});

test('parse rejects a requires value outside the vocabulary (metric 5)', () => {
  const section = sourceSection();
  section.entries[0].requires.push('FX_RATE');
  expect(() => parseValuationArms(section)).toThrow(/FX_RATE/);
});

test('every leaf is covered (metric 3)', () => {
  expect(shippedValuationArms().uncoveredLeaves()).toEqual([]);
});

// ---------- LM-427: measuresForArm ----------

describe('measuresForArm', () => {
  const ARMS = ['bond', 'tips', 'frn', 'mbs', 'equity', 'cash'];
  const fixture: { arms: Record<string, string[]>; unknown_arm: string } = JSON.parse(
    fs.readFileSync(path.resolve(PROTOS, '../test-fixtures/catalog/measures-for-arm.json'), 'utf-8'),
  );
  const names = (arm: string): string[] =>
    measuresForArm(arm).map(m => Object.keys(MeasureProto).find(k => (MeasureProto as any)[k] === m)!);

  test('fixture lists the six arms, none empty', () => {
    expect(Object.keys(fixture.arms).sort()).toEqual([...ARMS].sort());
    for (const arm of ARMS) expect(fixture.arms[arm].length).toBeGreaterThan(0);
  });

  test.each(ARMS)('%s matches the shared fixture', arm => {
    const got = names(arm);
    expect(new Set(got).size).toBe(got.length);
    expect([...got].sort()).toEqual([...fixture.arms[arm]].sort());
  });

  test('frn and tips', () => {
    const frn = names('frn');
    for (const name of ['CONVEXITY', 'MODIFIED_DURATION', 'DV01', 'PROFIT_LOSS_PERCENT']) {
      expect(frn).not.toContain(name);
    }
    expect(names('tips')).toEqual(expect.arrayContaining(['REFERENCE_CPI', 'INDEX_RATIO']));
  });

  test('an unknown arm throws UnmappedProductTypeError', () => {
    let error: unknown;
    try {
      measuresForArm(fixture.unknown_arm);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UnmappedProductTypeError);
    expect((error as Error).constructor).toBe(UnmappedProductTypeError);
    expect((error as UnmappedProductTypeError).productType).toBe('swap');
  });

  /** The bundled catalog, with `fields` set on the entry named `name`. */
  function catalogWith(name: string, fields: Record<string, unknown>): unknown[] {
    const measures = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../../catalog/measures.json'), 'utf-8'),
    ).measures as Record<string, unknown>[];
    return measures.map(m => (m.name === name ? { ...m, ...fields } : m));
  }

  test('follows implemented', () => {
    expect(measuresForArm('frn')).toContain(MeasureProto.DISCOUNT_MARGIN);
    expect(measuresForArmIn(catalogWith('DISCOUNT_MARGIN', { implemented: false }), 'frn'))
      .not.toContain(MeasureProto.DISCOUNT_MARGIN);
  });

  test('follows an ancestor node', () => {
    const measures = catalogWith('PAR_YIELD', { implemented: true, applies_to: ['GOV_BOND'] });
    for (const arm of ['frn', 'bond']) {
      expect(measuresForArm(arm)).not.toContain(MeasureProto.PAR_YIELD);
      expect(measuresForArmIn(measures, arm)).toContain(MeasureProto.PAR_YIELD);
    }
  });
});
