// LM-441: getField(MATURITY_DATE) / getField(ISSUE_DATE) report an unset date
// as null, never a placeholder such as 2999-12-31 or 1900-01-01. Bonds keep
// their real dates.
import Security from './security';
import BondSecurity from './BondSecurity';
import TIPSBond from './TIPSBond';
import FloatingRateNote from './FloatingRateNote';
import MortgageBackedSecurity from './MortgageBackedSecurity';
import IndexSecurity from './IndexSecurity';
import { Position } from '../position/position';

import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';

const ISSUE: [number, number, number] = [2024, 5, 15];
const MATURITY: [number, number, number] = [2034, 5, 15];

function localDate([y, m, d]: [number, number, number]): LocalDateProto {
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

function makeProto(productType: ProductTypeProto, opts: { bondDetails?: boolean; dates?: boolean } = {}): SecurityProto {
  const p = new SecurityProto();
  p.setProductType(productType);
  if (opts.bondDetails || opts.dates) {
    const bd = new BondDetailsProto();
    if (opts.dates) {
      bd.setIssueDate(localDate(ISSUE));
      bd.setMaturityDate(localDate(MATURITY));
    }
    p.setBondDetails(bd);
  }
  return p;
}

function ymd(d: Date): [number, number, number] {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}

function isPlaceholder(value: unknown): boolean {
  if (!(value instanceof Date)) return false;
  const [y, m, d] = ymd(value);
  return (y === 2999 && m === 12 && d === 31) || (y === 1900 && m === 1 && d === 1);
}

// JS has no EquitySecurity / CashSecurity: Security.create returns a plain
// Security for stock, cash, FX spot and crypto.
const NON_BONDS: Array<[string, ProductTypeProto, Function]> = [
  ['stock', ProductTypeProto.COMMON_STOCK, Security],
  ['index', ProductTypeProto.EQUITY_INDEX, IndexSecurity],
  ['cash', ProductTypeProto.CURRENCY, Security],
  ['fx spot', ProductTypeProto.FX_SPOT, Security],
  ['crypto', ProductTypeProto.CRYPTOCURRENCY, Security],
];

describe('Security absent dates (LM-441)', () => {
  for (const [name, productType, cls] of NON_BONDS) {
    for (const bondDetails of [false, true]) {
      test(`${name} (bond_details ${bondDetails ? 'present, dates unset' : 'absent'}) returns null`, () => {
        const security = Security.create(makeProto(productType, { bondDetails }));
        expect(security.constructor).toBe(cls);
        for (const field of [FieldProto.MATURITY_DATE, FieldProto.ISSUE_DATE]) {
          const value = security.getField(field);
          expect(value).toBeNull();
          expect(isPlaceholder(value)).toBe(false);
        }
      });
    }
  }

  test.each([
    ['fx spot', ProductTypeProto.FX_SPOT],
    ['crypto', ProductTypeProto.CRYPTOCURRENCY],
  ])('a non-bond %s with bond_details dates set returns them', (_name, productType) => {
    const security = Security.create(makeProto(productType, { dates: true }));
    expect(security.isBond()).toBe(false);
    expect(ymd(security.getField(FieldProto.MATURITY_DATE))).toEqual(MATURITY);
    expect(ymd(security.getField(FieldProto.ISSUE_DATE))).toEqual(ISSUE);
  });

  test.each([
    ['BondSecurity', ProductTypeProto.TREASURY_NOTE, BondSecurity],
    ['TIPSBond', ProductTypeProto.TIPS, TIPSBond],
    ['FloatingRateNote', ProductTypeProto.TREASURY_FRN, FloatingRateNote],
    ['MortgageBackedSecurity', ProductTypeProto.MORTGAGE_BACKED, MortgageBackedSecurity],
  ])('%s dates are unchanged', (_name, productType, cls) => {
    const security = Security.create(makeProto(productType as ProductTypeProto, { dates: true }));
    expect(security).toBeInstanceOf(cls);
    expect(ymd(security.getField(FieldProto.MATURITY_DATE))).toEqual(MATURITY);
    expect(ymd(security.getField(FieldProto.ISSUE_DATE))).toEqual(ISSUE);
  });

  test('a position with an unset MATURITY_DATE entry does not throw', () => {
    const entry = new FieldMapEntry().setField(FieldProto.MATURITY_DATE);
    const proto = new PositionProto();
    proto.addFields(entry);
    const position = new Position(proto);
    expect(position.getFieldValue(FieldProto.MATURITY_DATE)).toBeNull();
    expect(position.getFieldDisplay(entry)).toBe('');
    expect(() => position.toString()).not.toThrow();
    expect(position.toString().endsWith(',;')).toBe(true);
  });
});
