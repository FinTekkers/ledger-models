/**
 * LM-418: the deprecated arm-named exports give the same results as the
 * input-type names they call, and hierarchy.json still loads with the legacy
 * valuation_arms / arm keys for one release.
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  armFor, forSecurity, inputTypeFor, measuresForArm, measuresForArmIn, measuresForInputType,
  measuresForInputTypeIn, parseValuationArms, parseValuationInputTypes, shippedValuationArms,
  shippedValuationInputTypes, valuationInputTypesFromHierarchy, ValuationArms, ValuationInputTypes,
} from './product_inputs';
import { MissingMarketDataError } from '../errors';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { BondDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';

const REPO = path.resolve(__dirname, '../../../../..');

function readJson(...parts: string[]): any {
  return JSON.parse(fs.readFileSync(path.join(REPO, ...parts), 'utf-8'));
}

/** The value, or the thrown error's class and message. */
function outcome(call: () => unknown): unknown {
  try {
    return call();
  } catch (e) {
    return [(e as Error).constructor.name, (e as Error).message];
  }
}

/** `root` with the section and entry keys renamed to the legacy names. */
function legacy(root: any): any {
  const out = JSON.parse(JSON.stringify(root));
  const section = out.valuation_input_types;
  delete out.valuation_input_types;
  for (const entry of section.entries) {
    entry.arm = entry.input_type;
    delete entry.input_type;
  }
  out.valuation_arms = section;
  return out;
}

// ---------- metric 2: the aliases match the new names ----------

describe('armFor matches inputTypeFor on every fixture case', () => {
  const cases: { product_type: string; coupon_type: string; input_type?: string }[] =
    readJson('ledger-models-protos', 'fixtures', 'valuation_input_types_cases.json').cases;
  const priced = cases.filter(c => Object.prototype.hasOwnProperty.call(ProductTypeProto, c.product_type));

  test('there are enough cases', () => expect(priced.length).toBeGreaterThanOrEqual(5));

  test.each(priced)('$product_type/$coupon_type', c => {
    const s = new SecurityProto()
      .setProductType((ProductTypeProto as unknown as Record<string, number>)[c.product_type])
      .setBondDetails(new BondDetailsProto()
        .setCouponType((CouponTypeProto as unknown as Record<string, number>)[c.coupon_type]));
    const expected = outcome(() => inputTypeFor(s));
    expect(outcome(() => armFor(s))).toEqual(expected);
    if (c.input_type !== undefined) expect(expected).toBe(c.input_type);
  });
});

describe('measuresForArm matches measuresForInputType', () => {
  const fixture: { input_types: Record<string, string[]>; unknown_input_type: string } =
    readJson('test-fixtures', 'catalog', 'measures-for-input-type.json');
  const inputTypes = [...Object.keys(fixture.input_types), fixture.unknown_input_type];
  const catalog = readJson('ledger-models-protos', 'catalog', 'measures.json').measures;

  test.each(inputTypes)('%s', inputType => {
    expect(outcome(() => measuresForArm(inputType))).toEqual(outcome(() => measuresForInputType(inputType)));
    expect(outcome(() => measuresForArmIn(catalog, inputType)))
      .toEqual(outcome(() => measuresForInputTypeIn(catalog, inputType)));
  });

  test('INFLATION_COMPENSATION for the tips arm only (LM-434, VS-155)', () => {
    const others = Object.keys(fixture.input_types).filter(arm => arm !== 'tips');
    expect(others).toHaveLength(5);
    expect(measuresForArm('tips')).toContain(MeasureProto.INFLATION_COMPENSATION);
    for (const arm of others) expect(measuresForArm(arm)).not.toContain(MeasureProto.INFLATION_COMPENSATION);
  });
});

test('the ValuationArms aliases are the ValuationInputTypes ones', () => {
  const section = readJson('ledger-models-protos', 'hierarchy.json').valuation_input_types;
  expect(ValuationArms).toBe(ValuationInputTypes);
  const parsed: ValuationArms = parseValuationArms(section);
  expect(parsed).toBeInstanceOf(ValuationInputTypes);
  expect(parsed).toEqual(parseValuationInputTypes(section));
  expect(shippedValuationArms()).toBe(shippedValuationInputTypes());
  const entry = shippedValuationInputTypes().require('TIPS', 'FIXED');
  expect(entry.arm).toBe(entry.inputType);
  expect(entry.inputType).toBe('tips');
});

test('MissingMarketDataError.arm matches inputType', () => {
  const tips = new SecurityProto().setProductType(ProductTypeProto.TIPS);
  let e: unknown;
  try {
    forSecurity(tips, new PriceProto());
  } catch (err) {
    e = err;
  }
  expect(e).toBeInstanceOf(MissingMarketDataError);
  const m = e as MissingMarketDataError;
  expect(m.inputType).toBe('tips');
  expect(m.arm).toBe(m.inputType);
  expect(m.message).toContain('for input type tips');
});

// ---------- metric 3: the legacy keys load the same mapping ----------

test('the legacy keys load the same mapping', () => {
  const root = readJson('ledger-models-protos', 'hierarchy.json');
  expect(root.valuation_input_types.entries).toHaveLength(8);
  const current = valuationInputTypesFromHierarchy(root);
  const old = valuationInputTypesFromHierarchy(legacy(root));
  expect(old).toEqual(current);
  expect(current).toEqual(shippedValuationInputTypes());
  expect(old.uncoveredLeaves()).toEqual(current.uncoveredLeaves());
});

const breaks: [string, (root: any) => void][] = [
  ['both root keys', r => { r.valuation_arms = JSON.parse(JSON.stringify(r.valuation_input_types)); }],
  ['neither root key', r => { delete r.valuation_input_types; }],
  ['an entry with both fields', r => { r.valuation_input_types.entries[0].arm = 'bond'; }],
];

test.each(breaks)('%s is rejected', (_name, brk) => {
  const root = readJson('ledger-models-protos', 'hierarchy.json');
  brk(root);
  expect(() => valuationInputTypesFromHierarchy(root)).toThrow(/valuation_input_types/);
});
