import Security from './security';
import BondSecurity from './BondSecurity';
import TIPSBond from './TIPSBond';
import FloatingRateNote from './FloatingRateNote';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { LocalDate } from '../utils/date';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { Decimal } from 'decimal.js';

function makeDate(y: number, m: number, d: number): LocalDate {
  return new LocalDate(new LocalDateProto().setYear(y).setMonth(m).setDay(d));
}

const baseInputs = {
  faceValue: new Decimal('1000'),
  couponRate: new Decimal('0.045'),
  couponType: CouponTypeProto.FIXED,
  couponFrequency: CouponFrequencyProto.SEMIANNUALLY,
  issueDate: makeDate(2024, 1, 15),
  maturityDate: makeDate(2034, 1, 15),
};

test('BondSecurity.fromPricerInputs round-trips through Security.create as a BondSecurity', () => {
  const proto = BondSecurity.fromPricerInputs(baseInputs);
  expect(proto.getProductType()).toBe(ProductTypeProto.TREASURY_NOTE);
  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(BondSecurity);
  const bond = sec as BondSecurity;
  expect(bond.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
  expect(bond.getFaceValue().getArbitraryPrecisionValue()).toBe('1000');
  expect(bond.getCouponType().name()).toBe('FIXED');
  expect(bond.getCouponFrequency().toString()).toBe('SEMIANNUALLY');
  expect(bond.getIssueDate().toDate().getFullYear()).toBe(2024);
  expect(bond.getMaturityDate().toDate().getFullYear()).toBe(2034);
});

test('TIPSBond.fromPricerInputs round-trips with tips_extension populated', () => {
  const proto = TIPSBond.fromPricerInputs({
    ...baseInputs,
    baseCpi: new Decimal('301.5'),
    indexDate: makeDate(2024, 1, 15),
    inflationIndexType: IndexTypeProto.CPI_U,
  });
  expect(proto.getProductType()).toBe(ProductTypeProto.TIPS);
  expect(proto.hasTipsExtension()).toBe(true);

  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(TIPSBond);
  const tips = sec as TIPSBond;
  // Bond-side checks (inherited from BondSecurity)
  expect(tips.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
  // TIPS-specific checks
  expect(tips.getBaseCpi()?.toString()).toBe('301.5');
  expect(tips.getIndexDate()?.toDate().getFullYear()).toBe(2024);
  expect(tips.getInflationIndexType()).toBe(IndexTypeProto.CPI_U);
});

test('FloatingRateNote.fromPricerInputs round-trips with frn_extension populated', () => {
  const proto = FloatingRateNote.fromPricerInputs({
    ...baseInputs,
    spread: new Decimal('0.0015'),
    referenceRateIndex: IndexTypeProto.SOFR,
    resetFrequency: CouponFrequencyProto.QUARTERLY,
  });
  expect(proto.getProductType()).toBe(ProductTypeProto.TREASURY_FRN);
  expect(proto.hasFrnExtension()).toBe(true);

  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(FloatingRateNote);
  const frn = sec as FloatingRateNote;
  expect(frn.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
  expect(frn.getSpread()?.toString()).toBe('0.0015');
  expect(frn.getReferenceRateIndex()).toBe(IndexTypeProto.SOFR);
  expect(frn.getResetFrequency()).toBe(CouponFrequencyProto.QUARTERLY);
});

test('TIPS / FRN wrappers inherit isBond() narrowing', () => {
  const tipsProto = TIPSBond.fromPricerInputs({
    ...baseInputs,
    baseCpi: new Decimal('250'),
    indexDate: makeDate(2024, 1, 15),
    inflationIndexType: IndexTypeProto.CPI_U,
  });
  const frnProto = FloatingRateNote.fromPricerInputs({
    ...baseInputs,
    spread: new Decimal('0.002'),
    referenceRateIndex: IndexTypeProto.SOFR,
    resetFrequency: CouponFrequencyProto.QUARTERLY,
  });
  expect(Security.create(tipsProto).isBond()).toBe(true);
  expect(Security.create(frnProto).isBond()).toBe(true);
});
