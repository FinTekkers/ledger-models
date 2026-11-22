// LM-479: EquityDetailsProto.shares_outstanding round-trips, stays absent
// when unset, and EquitySecurity.getSharesOutstanding never reports absent
// as 0.
import Security from './security';
import EquitySecurity from './EquitySecurity';
import { SecurityProto, EquityDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';

function etf(details?: EquityDetailsProto): SecurityProto {
  const proto = new SecurityProto().setProductType(ProductTypeProto.ETF);
  if (details) proto.setEquityDetails(details);
  return proto;
}

function roundTrip(proto: SecurityProto): SecurityProto {
  return SecurityProto.deserializeBinary(proto.serializeBinary());
}

function oneBillion(): DecimalValueProto {
  return encodeDecimal(parseDecimalString('1000000000'));
}

describe('EquityDetailsProto.shares_outstanding (LM-479)', () => {
  test('round-trips 1,000,000,000 through bytes', () => {
    const parsed = roundTrip(etf(new EquityDetailsProto().setSharesOutstanding(oneBillion())));

    const details = parsed.getEquityDetails()!;
    expect(details.hasSharesOutstanding()).toBe(true);
    expect(toCanonicalString(decodeDecimal(details.getSharesOutstanding()!))).toBe('1000000000');
  });

  test('equity_details without shares_outstanding stays absent after round trip', () => {
    const parsed = roundTrip(etf(new EquityDetailsProto()));

    expect(parsed.hasEquityDetails()).toBe(true);
    expect(parsed.getEquityDetails()!.hasSharesOutstanding()).toBe(false);
  });

  test('ETF: serialize, parse, Security.create, getter returns the value', () => {
    const security = Security.create(roundTrip(etf(new EquityDetailsProto().setSharesOutstanding(oneBillion()))));

    expect(security).toBeInstanceOf(EquitySecurity);
    expect(security.isEquity()).toBe(true);
    if (!security.isEquity()) throw new Error('expected an EquitySecurity');
    expect(security.getSharesOutstanding()!.toFixed()).toBe('1000000000');
  });

  test('ETF without shares_outstanding: getter returns undefined, not 0', () => {
    const security = Security.create(roundTrip(etf(new EquityDetailsProto())));

    expect(security).toBeInstanceOf(EquitySecurity);
    expect((security as EquitySecurity).getSharesOutstanding()).toBeUndefined();
  });

  test('ETF without equity_details: getter returns undefined', () => {
    const security = Security.create(roundTrip(etf()));

    expect(security).toBeInstanceOf(EquitySecurity);
    expect((security as EquitySecurity).getSharesOutstanding()).toBeUndefined();
  });

  test('present but empty DecimalValueProto: getter returns undefined', () => {
    const parsed = roundTrip(etf(new EquityDetailsProto().setSharesOutstanding(new DecimalValueProto())));
    expect(parsed.getEquityDetails()!.hasSharesOutstanding()).toBe(true);

    const security = new EquitySecurity(parsed);
    expect(security.getSharesOutstanding()).toBeUndefined();
  });
});
