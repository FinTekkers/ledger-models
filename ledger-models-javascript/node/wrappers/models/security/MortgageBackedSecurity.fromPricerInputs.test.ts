import Security from './security';
import BondSecurity from './BondSecurity';
import MortgageBackedSecurity from './MortgageBackedSecurity';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { AgencyProto } from '../../../fintekkers/models/security/bond/agency_pb';
import { LocalDate } from '../utils/date';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { Decimal } from 'decimal.js';

function makeDate(y: number, m: number, d: number): LocalDate {
  return new LocalDate(new LocalDateProto().setYear(y).setMonth(m).setDay(d));
}

const baseInputs = {
  faceValue: new Decimal('250000000'),
  couponRate: new Decimal('0.04'),
  couponType: CouponTypeProto.FIXED,
  couponFrequency: CouponFrequencyProto.MONTHLY,
  issueDate: makeDate(2024, 1, 1),
  maturityDate: makeDate(2054, 1, 1),
};

const mbsInputs = {
  ...baseInputs,
  poolNumber: 'FN AS1234',
  agency: AgencyProto.FNMA,
  wac: new Decimal('0.045'),
  wam: 358,
  passThroughRate: new Decimal('0.04'),
  currentFactor: new Decimal('0.95'),
  originalFaceValue: new Decimal('250000000'),
  currentUpb: new Decimal('237500000'),
  psaSpeed: new Decimal('150'),
};

test('MortgageBackedSecurity.fromPricerInputs populates bond_details and mbs_extension', () => {
  const proto = MortgageBackedSecurity.fromPricerInputs(mbsInputs);
  expect(proto.getProductType()).toBe(ProductTypeProto.MORTGAGE_BACKED);
  expect(proto.hasBondDetails()).toBe(true);
  expect(proto.hasMbsExtension()).toBe(true);

  const ext = proto.getMbsExtension()!;
  expect(ext.getPoolNumber()).toBe('FN AS1234');
  expect(ext.getAgency()).toBe(AgencyProto.FNMA);
  expect(ext.getWac()?.getArbitraryPrecisionValue()).toBe('0.045');
  expect(ext.getWam()).toBe(358);
  expect(ext.getPassThroughRate()?.getArbitraryPrecisionValue()).toBe('0.04');
  expect(ext.getCurrentFactor()?.getArbitraryPrecisionValue()).toBe('0.95');
  expect(ext.getOriginalFaceValue()?.getArbitraryPrecisionValue()).toBe('250000000');
  expect(ext.getCurrentUpb()?.getArbitraryPrecisionValue()).toBe('237500000');
  expect(ext.getPsaSpeed()?.getArbitraryPrecisionValue()).toBe('150');
});

test('MortgageBackedSecurity round-trips via serializeBinary / deserializeBinary preserving all 9 mbs fields', () => {
  const proto = MortgageBackedSecurity.fromPricerInputs(mbsInputs);
  const bytes = proto.serializeBinary();
  const round = SecurityProto.deserializeBinary(bytes);

  expect(round.getProductType()).toBe(ProductTypeProto.MORTGAGE_BACKED);
  expect(round.hasBondDetails()).toBe(true);
  expect(round.hasMbsExtension()).toBe(true);

  const ext = round.getMbsExtension()!;
  expect(ext.getPoolNumber()).toBe('FN AS1234');
  expect(ext.getAgency()).toBe(AgencyProto.FNMA);
  expect(ext.getWac()?.getArbitraryPrecisionValue()).toBe('0.045');
  expect(ext.getWam()).toBe(358);
  expect(ext.getPassThroughRate()?.getArbitraryPrecisionValue()).toBe('0.04');
  expect(ext.getCurrentFactor()?.getArbitraryPrecisionValue()).toBe('0.95');
  expect(ext.getOriginalFaceValue()?.getArbitraryPrecisionValue()).toBe('250000000');
  expect(ext.getCurrentUpb()?.getArbitraryPrecisionValue()).toBe('237500000');
  expect(ext.getPsaSpeed()?.getArbitraryPrecisionValue()).toBe('150');
});

test('MortgageBackedSecurity wraps via Security.create factory dispatch', () => {
  const proto = MortgageBackedSecurity.fromPricerInputs(mbsInputs);
  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(MortgageBackedSecurity);
  // Inherits BondSecurity behaviour.
  expect(sec).toBeInstanceOf(BondSecurity);
  expect(sec.isBond()).toBe(true);
});

test('MortgageBackedSecurity typed accessors read back the expected values', () => {
  const proto = MortgageBackedSecurity.fromPricerInputs(mbsInputs);
  const sec = Security.create(proto) as MortgageBackedSecurity;

  // Bond-side checks (inherited from BondSecurity).
  expect(sec.getCouponRate().getArbitraryPrecisionValue()).toBe('0.04');
  expect(sec.getFaceValue().getArbitraryPrecisionValue()).toBe('250000000');
  expect(sec.getIssueDate().toDate().getFullYear()).toBe(2024);
  expect(sec.getMaturityDate().toDate().getFullYear()).toBe(2054);

  // MBS-specific accessor checks.
  expect(sec.getPoolNumber()).toBe('FN AS1234');
  expect(sec.getAgency()).toBe(AgencyProto.FNMA);
  expect(sec.getWac()?.toString()).toBe('0.045');
  expect(sec.getWam()).toBe(358);
  expect(sec.getPassThroughRate()?.toString()).toBe('0.04');
  expect(sec.getCurrentFactor()?.toString()).toBe('0.95');
  expect(sec.getOriginalFaceValue()?.toString()).toBe('250000000');
  expect(sec.getCurrentUpb()?.toString()).toBe('237500000');
  expect(sec.getPsaSpeed()?.toString()).toBe('150');
});
