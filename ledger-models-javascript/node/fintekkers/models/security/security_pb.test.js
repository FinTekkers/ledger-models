"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// v0.4.0 (#277/#278): legacy SecurityProto flat fields removed. Round-trip
// uses the structured shape (bond_details + extensions).
const decimal_value_pb_1 = require("../util/decimal_value_pb");
const local_date_pb_1 = require("../util/local_date_pb");
const coupon_frequency_pb_1 = require("./coupon_frequency_pb");
const coupon_type_pb_1 = require("./coupon_type_pb");
const security_pb_1 = require("./security_pb");
const product_type_pb_1 = require("./product_type_pb");
test('create a SecurityProto (with bond_details) and round-trip via binary', () => {
    const bond = new security_pb_1.BondDetailsProto();
    bond.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.ANNUALLY);
    bond.setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    bond.setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    bond.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    bond.setDatedDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    bond.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(1).setDay(1));
    bond.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
    const security = new security_pb_1.SecurityProto();
    security.setObjectClass('SomeObjectClass');
    security.setVersion('1.0');
    security.setAssetClass('FixedIncome');
    security.setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE);
    security.setBondDetails(bond);
    const binaryData = security.serializeBinary();
    const deserialized = security_pb_1.SecurityProto.deserializeBinary(binaryData);
    expect(deserialized.toObject()).toEqual(security.toObject());
    expect(deserialized.getBondDetails().getCouponRate().getArbitraryPrecisionValue()).toBe('0.05');
});
//# sourceMappingURL=security_pb.test.js.map