/**
 * LM-461: default trade-price type by product, from hierarchy.json
 * default_price_types. Parity with Python test_default_price_types.py, Java
 * DefaultPriceTypesTest and Rust default_price_types_test.rs.
 *
 * The shared cases live in ledger-models-protos/fixtures/default_price_types_cases.json;
 * expected values come from that file only, never from the resolver under test.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  defaultPriceTypeFor,
  parseDefaultPriceTypes,
  resolveTradePriceType,
  shippedDefaultPriceTypes,
} from './default_price_types';
import { NoDefaultPriceTypeError } from '../errors';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';

const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');

const CASES: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(PROTOS, 'fixtures/default_price_types_cases.json'), 'utf-8'),
).cases;

function sourceSection(): Record<string, string> {
  return JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8')).default_price_types;
}

const PRODUCT_TYPES = ProductTypeProto as unknown as Record<string, ProductTypeProto>;
const PRICE_TYPES = PriceTypeProto as unknown as Record<string, PriceTypeProto>;

// ---------- metric 3: every product resolves to the fixture, never UNKNOWN ----------

test('the fixture lists every ProductTypeProto enum value', () => {
  expect(Object.keys(CASES).sort()).toEqual(Object.keys(ProductTypeProto).sort());
});

test('the fixture covers deepest-node-wins', () => {
  expect(CASES.SOFR_SERIES).toBe('RATE');
  expect(CASES.T_BILL_13_WEEK_SERIES).toBe('RATE');
  expect(CASES.CPI_SERIES).toBe('INDEX_LEVEL');
});

test.each(Object.entries(CASES))('%s resolves as the fixture says (%s)', (productType, expected) => {
  const security = new SecurityProto().setProductType(PRODUCT_TYPES[productType]);
  if (expected === 'raises') {
    expect(defaultPriceTypeFor(security)).toBeNull();
    expect(() => resolveTradePriceType(security)).toThrow(NoDefaultPriceTypeError);
  } else {
    const resolved = resolveTradePriceType(security);
    expect(resolved).toBe(PRICE_TYPES[expected]);
    expect(resolved).not.toBe(PriceTypeProto.UNKNOWN_PRICE_TYPE);
  }
});

test('each table key resolves to its own entry', () => {
  const section = sourceSection();
  expect(Object.keys(section).length).toBeGreaterThan(0);
  for (const [node, name] of Object.entries(section)) {
    expect(shippedDefaultPriceTypes().defaultFor(node)).toBe(PRICE_TYPES[name]);
  }
});

test('the shipped entries are read-only', () => {
  const entries = shippedDefaultPriceTypes().entries as Map<string, PriceTypeProto>;
  expect(() => entries.set('BOND', PriceTypeProto.ABSOLUTE)).toThrow(TypeError);
  expect(shippedDefaultPriceTypes().defaultFor('BOND')).toBe(PriceTypeProto.PERCENTAGE);
});

test('the source section parses to the shipped table', () => {
  expect([...parseDefaultPriceTypes(sourceSection()).entries])
    .toEqual([...shippedDefaultPriceTypes().entries]);
});

// ---------- guardrail 3: a broken section throws at load ----------

test.each([
  ['an unknown node', { NOT_A_NODE: 'PERCENTAGE' }, 'NOT_A_NODE'],
  ['an unknown type name', { BOND: 'PERCENT' }, 'PERCENT'],
  ['an UNKNOWN_PRICE_TYPE value', { BOND: 'UNKNOWN_PRICE_TYPE' }, 'UNKNOWN_PRICE_TYPE'],
  ['an inherited key as a type name', { BOND: 'toString' }, 'toString'],
  ['a non-string value', { BOND: 2 }, 'BOND'],
  ['a missing section', undefined, 'missing'],
  ['a section that is not an object', ['BOND', 'PERCENTAGE'], 'object'],
])('%s throws', (_name, section, match) => {
  expect(() => parseDefaultPriceTypes(section)).toThrow(/default_price_types/);
  expect(() => parseDefaultPriceTypes(section)).toThrow(match);
});
