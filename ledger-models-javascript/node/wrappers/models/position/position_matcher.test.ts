/**
 * LM-281: the JS filter helper matches Java's PositionFilter row for row.
 *
 * ASSET_CLASS EQUALS / NOT_EQUALS use the shared assetClassMatches rule;
 * every other field compares exactly. A null stored value never throws.
 */
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import Security from '../security/security';
import { FilterableRow, FilterSpec, filterRows, matches } from './position_matcher';

function securityRow(assetClass: string): Security {
  const proto = new SecurityProto();
  proto.setAssetClass(assetClass);
  return new Security(proto);
}

function stubRow(assetClass: string | null): FilterableRow {
  return {
    getField: (_field: FieldProto) => assetClass,
  };
}

function assetClasses(rows: FilterableRow[]): Array<string | null> {
  return rows.map((row) => row.getField(FieldProto.ASSET_CLASS));
}

function assetClassFilter(operator: PositionFilterOperator): FilterSpec[] {
  return [{ field: FieldProto.ASSET_CLASS, operator, value: 'FIXED_INCOME' }];
}

describe('position_matcher', () => {
  test('ASSET_CLASS EQUALS FIXED_INCOME matches group members', () => {
    const rows = ['RATES', 'CREDIT', 'Fixed Income', 'EQUITY'].map(securityRow);
    const result = filterRows(rows, assetClassFilter(PositionFilterOperator.EQUALS));
    expect(assetClasses(result)).toEqual(['RATES', 'CREDIT', 'Fixed Income']);
  });

  test('ASSET_CLASS NOT_EQUALS FIXED_INCOME keeps only non-members', () => {
    const rows = ['RATES', 'CREDIT', 'Fixed Income', 'EQUITY'].map(securityRow);
    const result = filterRows(rows, assetClassFilter(PositionFilterOperator.NOT_EQUALS));
    expect(assetClasses(result)).toEqual(['EQUITY']);
  });

  test('null, empty and unknown stored values never throw', () => {
    const rows = [stubRow(null), securityRow(''), securityRow('NOT_A_CLASS')];
    const equals = assetClassFilter(PositionFilterOperator.EQUALS);
    const notEquals = assetClassFilter(PositionFilterOperator.NOT_EQUALS);
    expect(() => filterRows(rows, equals)).not.toThrow();
    expect(filterRows(rows, equals)).toEqual([]);
    expect(() => filterRows(rows, notEquals)).not.toThrow();
    expect(assetClasses(filterRows(rows, notEquals))).toEqual([null, '', 'NOT_A_CLASS']);
  });

  test('other fields compare exactly', () => {
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, 'a', 'a')).toBe(true);
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, 'a', 'b')).toBe(false);
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, 'a', 'b')).toBe(true);
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, 'a', 'a')).toBe(false);
    expect(matches(FieldProto.MATURITY_DATE, PositionFilterOperator.MORE_THAN, 1, 2)).toBe(true);
    expect(matches(FieldProto.MATURITY_DATE, PositionFilterOperator.MORE_THAN, 2, 1)).toBe(false);
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.EQUALS, 'a', null)).toBe(false);
    expect(matches(FieldProto.PORTFOLIO_NAME, PositionFilterOperator.NOT_EQUALS, 'a', null)).toBe(true);
  });
});

describe('the published (compiled) position_matcher.js', () => {
  // npm publish runs no tsc: the tracked .js is what consumers get.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiled = require('./position_matcher.js');

  test('exports working matches and filterRows', () => {
    expect(typeof compiled.matches).toBe('function');
    expect(typeof compiled.filterRows).toBe('function');
    expect(
      compiled.matches(
        FieldProto.ASSET_CLASS,
        PositionFilterOperator.EQUALS,
        'FIXED_INCOME',
        'RATES',
      ),
    ).toBe(true);
    expect(
      compiled.matches(
        FieldProto.ASSET_CLASS,
        PositionFilterOperator.NOT_EQUALS,
        'FIXED_INCOME',
        'EQUITY',
      ),
    ).toBe(true);
    const rows = ['RATES', 'EQUITY'].map(securityRow);
    const kept = compiled.filterRows(rows, assetClassFilter(PositionFilterOperator.EQUALS));
    expect(assetClasses(kept)).toEqual(['RATES']);
  });
});
