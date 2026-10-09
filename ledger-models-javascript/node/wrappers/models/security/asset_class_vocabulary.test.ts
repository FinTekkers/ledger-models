/**
 * LM-275: one asset-class vocabulary (hierarchy.json), a shared match helper
 * and labels for every enum the UI shows.
 *
 * The match cases live in ledger-models-protos/fixtures/asset_class_matches.json,
 * shared with the Java and Python tests.
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  assetClassMatches,
  assetClassProtoLabelOf,
  buildAssetClassLookup,
  identifierTypeLabelOf,
  identifierTypePlaceholderOf,
  instrumentTypeLabelOf,
  productTypeLabelOf,
} from './product_hierarchy';
import { AssetClassProto } from '../../../fintekkers/models/security/asset_class_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { InstrumentTypeProto } from '../../../fintekkers/models/security/instrument_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';

const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');

interface FixtureRow {
  filter: string | null;
  stored: string | null;
  expected: boolean;
}

const rows: FixtureRow[] = JSON.parse(
  fs.readFileSync(path.join(PROTOS, 'fixtures/asset_class_matches.json'), 'utf-8'),
).cases;

const hierarchy = JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8'));

describe('assetClassMatches shared fixture', () => {
  test.each(rows)('assetClassMatches($filter, $stored) === $expected', ({ filter, stored, expected }) => {
    expect(assetClassMatches(filter, stored)).toBe(expected);
  });

  test('fixture has the required rows', () => {
    expect(rows.length).toBeGreaterThanOrEqual(7);
    const found = new Map(rows.map((r) => [`${r.filter}|${r.stored}`, r.expected]));
    const required: Array<[string, boolean]> = [
      ['FIXED_INCOME|RATES', true],
      ['FIXED_INCOME|CREDIT', true],
      ['FIXED_INCOME|Fixed Income', true],
      ['EQUITY|Equity', true],
      ['CASH|Cash', true],
      ['EQUITY|RATES', false],
      ['EQUITY|NOT_AN_ASSET_CLASS', false],
    ];
    for (const [key, expected] of required) {
      expect([key, found.get(key)]).toEqual([key, expected]);
    }
  });
});

describe('the tree comes from hierarchy.json', () => {
  test('every asset_classes entry matches its parent, label and aliases', () => {
    const entries = Object.entries<{ parent: string | null; label: string; aliases?: string[] }>(
      hierarchy.asset_classes,
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const [code, entry] of entries) {
      if (entry.parent) expect([entry.parent, code, assetClassMatches(entry.parent, code)]).toEqual([entry.parent, code, true]);
      expect([code, entry.label, assetClassMatches(code, entry.label)]).toEqual([code, entry.label, true]);
      for (const alias of entry.aliases ?? []) {
        expect([code, alias, assetClassMatches(code, alias)]).toEqual([code, alias, true]);
      }
    }
  });

  test('an ambiguous label fails at load', () => {
    expect(() =>
      buildAssetClassLookup({ A: { parent: null, label: 'Shared' }, B: { parent: null, label: 'shared' } }),
    ).toThrow();
  });
});

describe('labels for every enum value', () => {
  const enums: Array<[string, object, (v: number) => string | null]> = [
    ['IdentifierTypeProto', IdentifierTypeProto, identifierTypeLabelOf],
    ['InstrumentTypeProto', InstrumentTypeProto, instrumentTypeLabelOf],
    ['ProductTypeProto', ProductTypeProto, productTypeLabelOf],
    ['AssetClassProto', AssetClassProto, assetClassProtoLabelOf],
  ];

  test.each(enums)('every %s value has a non-empty label', (name, enumObj, labelOf) => {
    const values = Object.entries(enumObj);
    expect(values.length).toBeGreaterThan(0);
    let checked = 0;
    for (const [valueName, v] of values) {
      expect([`${name}.${valueName}`, (labelOf(v) ?? '').trim() !== '']).toEqual([`${name}.${valueName}`, true]);
      checked++;
    }
    expect(checked).toBe(values.length);
  });

  test('every IdentifierTypeProto value has a non-empty placeholder', () => {
    const values = Object.entries(IdentifierTypeProto);
    for (const [valueName, v] of values) {
      expect([valueName, (identifierTypePlaceholderOf(v as IdentifierTypeProto) ?? '').trim() !== '']).toEqual([valueName, true]);
    }
    expect(values.length).toBeGreaterThan(0);
  });

  test('CASH_ASSET_CLASS is labelled Cash', () => {
    expect(assetClassProtoLabelOf(AssetClassProto.CASH_ASSET_CLASS)).toBe('Cash');
  });

  test('out-of-range numbers return null', () => {
    expect(identifierTypeLabelOf(9999 as IdentifierTypeProto)).toBeNull();
    expect(identifierTypePlaceholderOf(9999 as IdentifierTypeProto)).toBeNull();
    expect(instrumentTypeLabelOf(9999 as InstrumentTypeProto)).toBeNull();
    expect(productTypeLabelOf(9999 as ProductTypeProto)).toBeNull();
    expect(assetClassProtoLabelOf(9999 as AssetClassProto)).toBeNull();
  });
});

describe('the published (compiled) product_hierarchy.js', () => {
  // npm publish runs no tsc: the tracked .js is what consumers get.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiled = require('./product_hierarchy.js');

  test('exports the asset-class match helper', () => {
    expect(typeof compiled.assetClassMatches).toBe('function');
    expect(typeof compiled.resolveAssetClass).toBe('function');
    expect(compiled.assetClassMatches('FIXED_INCOME', 'RATES')).toBe(true);
    expect(compiled.assetClassMatches('EQUITY', 'RATES')).toBe(false);
  });

  test('exports the label and placeholder helpers', () => {
    for (const fn of [
      'identifierTypeLabelOf',
      'identifierTypePlaceholderOf',
      'instrumentTypeLabelOf',
      'productTypeLabelOf',
      'assetClassProtoLabelOf',
    ]) {
      expect([fn, typeof compiled[fn]]).toEqual([fn, 'function']);
    }
    expect(compiled.identifierTypeLabelOf(IdentifierTypeProto.ISIN)).toBe('ISIN');
    expect(compiled.identifierTypePlaceholderOf(IdentifierTypeProto.ISIN)).toBeTruthy();
    expect(compiled.instrumentTypeLabelOf(InstrumentTypeProto.INSTRUMENT_TYPE_CASH)).toBeTruthy();
    expect(compiled.productTypeLabelOf(ProductTypeProto.TBILL)).toBe('Treasury Bill');
    expect(compiled.assetClassProtoLabelOf(AssetClassProto.CASH_ASSET_CLASS)).toBe('Cash');
  });
});
