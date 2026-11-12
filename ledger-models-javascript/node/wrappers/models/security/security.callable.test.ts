// LM-465: a bond carries callable and its first call_date. The call date is
// never the maturity date: maturity_date and getField(MATURITY_DATE) stay the
// legal final maturity.
import Security from './security';
import BondSecurity from './BondSecurity';
import IndexSecurity from './IndexSecurity';

import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

// 912810CK2, 10 3/8% Bonds of 2004-2009: called 2004-11-15, legal maturity 2009-11-15.
const CALL_DATE: [number, number, number] = [2004, 11, 15];
const MATURITY: [number, number, number] = [2009, 11, 15];

function localDate([y, m, d]: [number, number, number]): LocalDateProto {
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

function ymd(d: Date | null): [number, number, number] | null {
  return d ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null;
}

function bondProto(callable: boolean): SecurityProto {
  const bd = new BondDetailsProto().setMaturityDate(localDate(MATURITY));
  if (callable) {
    bd.setCallable(true);
    bd.setCallDate(localDate(CALL_DATE));
  }
  const p = new SecurityProto();
  p.setProductType(ProductTypeProto.TREASURY_BOND);
  p.setIssuerName('US Treasury');
  p.addIdentifiers(new IdentifierProto().setIdentifierType(IdentifierTypeProto.CUSIP).setIdentifierValue('912810CK2'));
  p.setBondDetails(bd);
  return p;
}

function decode(proto: SecurityProto): SecurityProto {
  return SecurityProto.deserializeBinary(proto.serializeBinary());
}

// Serializes the wrapper's proto, parses the bytes and wraps them again.
function rewrap(security: Security): Security {
  return Security.create(decode(security.proto));
}

describe('Callable bonds (LM-465)', () => {
  test('callable bond wire round-trip keeps all three values', () => {
    const decoded = decode(bondProto(true));
    expect(decoded.getBondDetails()!.getCallable()).toBe(true);
    expect(decoded.getBondDetails()!.hasCallDate()).toBe(true);

    const bond = Security.create(decoded);
    expect(bond).toBeInstanceOf(BondSecurity);
    expect(bond.isCallable()).toBe(true);
    expect(ymd(bond.getCallDate())).toEqual(CALL_DATE);
    expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
  });

  test('callable bond re-saved through the wrapper keeps all three values', () => {
    const bond = rewrap(Security.create(bondProto(true)));
    expect(bond).toBeInstanceOf(BondSecurity);
    expect(bond.isCallable()).toBe(true);
    expect(ymd(bond.getCallDate())).toEqual(CALL_DATE);
    expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
  });

  test('getField(MATURITY_DATE) is the legal maturity, not the call date', () => {
    const bond = rewrap(Security.create(bondProto(true)));
    expect(ymd(bond.getField(FieldProto.MATURITY_DATE))).toEqual(MATURITY);
    expect(ymd(bond.getField(FieldProto.MATURITY_DATE))).not.toEqual(CALL_DATE);
  });

  test('non-callable bond round-trip leaves call_date unset', () => {
    const decoded = decode(bondProto(false));
    expect(decoded.getBondDetails()!.getCallable()).toBe(false);
    expect(decoded.getBondDetails()!.hasCallDate()).toBe(false);

    const bond = rewrap(Security.create(decoded));
    expect(bond.isCallable()).toBe(false);
    expect(bond.getCallDate()).toBeNull();
    expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
  });

  test.each([
    ['stock', ProductTypeProto.COMMON_STOCK, Security],
    ['cash', ProductTypeProto.CURRENCY, Security],
    ['index', ProductTypeProto.EQUITY_INDEX, IndexSecurity],
  ])('non-bond %s is not callable and has no call date', (_name, productType, cls) => {
    const p = new SecurityProto();
    p.setProductType(productType as ProductTypeProto);
    const security = Security.create(decode(p));
    expect(security).toBeInstanceOf(cls as Function);
    expect(security.isCallable()).toBe(false);
    expect(security.getCallDate()).toBeNull();
  });
});
