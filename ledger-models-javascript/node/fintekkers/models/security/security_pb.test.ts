// v0.4.0 (#277/#278): legacy SecurityProto flat fields removed. Round-trip
// uses the structured shape (bond_details + extensions).
import { DecimalValueProto } from '../util/decimal_value_pb';
import { LocalDateProto } from '../util/local_date_pb';
import { CouponFrequencyProto } from './coupon_frequency_pb';
import { CouponTypeProto } from './coupon_type_pb';
import { BondDetailsProto, SecurityProto } from './security_pb';
import { ProductTypeProto } from './product_type_pb';

test('create a SecurityProto (with bond_details) and round-trip via binary', () => {
  const bond = new BondDetailsProto();
  bond.setCouponFrequency(CouponFrequencyProto.ANNUALLY);
  bond.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
  bond.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
  bond.setIssueDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  bond.setDatedDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  bond.setMaturityDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  bond.setCouponType(CouponTypeProto.FIXED);

  const security = new SecurityProto();
  security.setObjectClass('SomeObjectClass');
  security.setVersion('1.0');
  security.setAssetClass('FixedIncome');
  security.setProductType(ProductTypeProto.TREASURY_NOTE);
  security.setBondDetails(bond);

  const binaryData = security.serializeBinary();
  const deserialized = SecurityProto.deserializeBinary(binaryData);

  expect(deserialized.toObject()).toEqual(security.toObject());
  expect(deserialized.getBondDetails()!.getCouponRate()!.getArbitraryPrecisionValue()).toBe('0.05');
});
