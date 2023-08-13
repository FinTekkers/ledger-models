"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import or define the SecurityProto class
var decimal_value_pb_1 = require("../util/decimal_value_pb");
var local_date_pb_1 = require("../util/local_date_pb");
var coupon_frequency_pb_1 = require("./coupon_frequency_pb");
var coupon_type_pb_1 = require("./coupon_type_pb");
var security_pb_1 = require("./security_pb");
var security_type_pb_1 = require("./security_type_pb");
test('create a security proto (from sue) object and test it can be read', function () {
    // Usage example
    var security = new security_pb_1.SecurityProto();
    security.setObjectClass('SomeObjectClass');
    security.setVersion('1.0');
    security.setAssetClass('FixedIncome');
    security.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.ANNUALLY);
    security.setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    security.setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    security.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    security.setDatedDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    security.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    security.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
    security.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
    // Serialize the object to a binary representation
    var binaryData = security.serializeBinary();
    // Deserialize the binary data back to a SecurityProto object
    var deserializedSecurity = security_pb_1.SecurityProto.deserializeBinary(binaryData);
    // Test that the deserialized object is the same as the original
    expect(deserializedSecurity.toObject()).toEqual(security.toObject());
});
//# sourceMappingURL=security_pb.test.js.map