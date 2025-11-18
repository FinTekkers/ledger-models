"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const uuid_1 = require("../utils/uuid");
const coupon_type_1 = require("./coupon_type");
test('test Security.create returns BondSecurity with correct coupon type and frequency', () => {
    testBondSecurityCreation();
});
function testBondSecurityCreation() {
    // Create a SecurityProto with BOND_SECURITY type, coupon type, and coupon frequency
    const securityProto = new security_pb_1.SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    securityProto.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
    securityProto.setAssetClass('FixedIncome');
    securityProto.setIssuerName('Test Issuer');
    securityProto.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
    securityProto.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
    securityProto.setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    securityProto.setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    securityProto.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    securityProto.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setDescription('Test Bond Security');
    // Call Security.create and validate it returns a BondSecurity
    const security = security_1.default.create(securityProto);
    assert(security instanceof BondSecurity_1.default, 'Security.create should return a BondSecurity instance');
    // Cast to BondSecurity for type safety
    const bondSecurity = security;
    let p = coupon_type_pb_1.CouponTypeProto.FIXED;
    let c = new coupon_type_1.CouponType(p);
    let a = new coupon_type_1.CouponType(securityProto.getCouponType());
    // Validate coupon type
    const couponType = bondSecurity.getCouponType();
    assert(couponType.name() === 'FIXED', `Expected coupon type FIXED, got ${couponType.name()}`);
    // Validate coupon frequency
    const couponFrequency = bondSecurity.getCouponFrequency();
    assert(couponFrequency.toString() === 'SEMIANNUALLY', `Expected coupon frequency SEMIANNUALLY, got ${couponFrequency.toString()}`);
}
//# sourceMappingURL=BondSecurity.test.js.map