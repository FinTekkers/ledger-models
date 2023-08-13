// Import or define the SecurityProto class
import { DecimalValueProto } from '../util/decimal_value_pb';
import { LocalDateProto } from '../util/local_date_pb';
import { CouponFrequencyProto } from './coupon_frequency_pb';
import { CouponTypeProto } from './coupon_type_pb';
import { SecurityProto } from './security_pb';
import { SecurityTypeProto } from './security_type_pb';

test('create a security proto (from sue) object and test it can be read', () => {
  // Usage example
  const security = new SecurityProto();

  security.setObjectClass('SomeObjectClass');
  security.setVersion('1.0');
  security.setAssetClass('FixedIncome');
  security.setCouponFrequency(CouponFrequencyProto.ANNUALLY);
  security.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
  security.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
  security.setIssueDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  security.setDatedDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  security.setMaturityDate(new LocalDateProto().setYear(2023).setMonth(1).setDay(1));
  security.setSecurityType(SecurityTypeProto.BOND_SECURITY);
  security.setCouponType(CouponTypeProto.FIXED)

  // Serialize the object to a binary representation
  const binaryData = security.serializeBinary();

  // Deserialize the binary data back to a SecurityProto object
  const deserializedSecurity = SecurityProto.deserializeBinary(binaryData);

  // Test that the deserialized object is the same as the original
  expect(deserializedSecurity.toObject()).toEqual(security.toObject());
});
