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
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
test('test Security.create returns BondSecurity with correct coupon type and frequency', () => {
    testBondSecurityCreation();
});
test('test BondSecurity.getTenor() returns correct Tenor for 10-year bond', () => {
    testBondSecurityTenor();
});
test('test BondSecurity.getTenor() returns correct Tenor for 10-year bond with as of date', () => {
    testBondSecurityTenorWithAsOfDate();
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
    // Validate coupon type
    const couponType = bondSecurity.getCouponType();
    assert(couponType.name() === 'FIXED', `Expected coupon type FIXED, got ${couponType.name()}`);
    // Validate coupon frequency
    const couponFrequency = bondSecurity.getCouponFrequency();
    assert(couponFrequency.toString() === 'SEMIANNUALLY', `Expected coupon frequency SEMIANNUALLY, got ${couponFrequency.toString()}`);
}
function testBondSecurityTenor() {
    // Create a SecurityProto with BOND_SECURITY type and dates for a 10-year bond
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
    // Set issue date: January 1, 2021
    securityProto.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    // Set maturity date: January 1, 2031 (exactly 10 years later)
    securityProto.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setDescription('Test 10-Year Bond Security');
    // Create BondSecurity
    const security = security_1.default.create(securityProto);
    assert(security instanceof BondSecurity_1.default, 'Security.create should return a BondSecurity instance');
    const bondSecurity = security;
    // Test getTenor()
    const tenor = bondSecurity.getTenor();
    assert(tenor !== null, 'Tenor should not be null');
    assert(tenor.getType() === tenor_type_pb_1.TenorTypeProto.TERM, 'Tenor type should be TERM');
    const period = tenor.getTenor();
    assert(period !== null, 'Period should not be null');
    if (period) {
        assert(period.years === 10, `Expected 10 years, got ${period.years}`);
        assert(period.months === 0, `Expected 0 months, got ${period.months}`);
        assert(period.days === 0, `Expected 0 days, got ${period.days}`);
    }
    // Test tenor description
    const tenorDescription = tenor.getTenorDescription();
    assert(tenorDescription === '10Y', `Expected tenor description "10Y", got "${tenorDescription}"`);
    // Test toString()
    const tenorString = tenor.toString();
    assert(tenorString === 'TERM: 10Y', `Expected "TERM: 10Y", got "${tenorString}"`);
    // Test with a bond that has months and days
    const securityProto2 = new security_pb_1.SecurityProto();
    securityProto2.setObjectClass('Security');
    securityProto2.setVersion('0.0.1');
    securityProto2.setUuid(uuid_1.UUID.random().toUUIDProto());
    securityProto2.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
    securityProto2.setAssetClass('FixedIncome');
    securityProto2.setIssuerName('Test Issuer');
    securityProto2.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
    securityProto2.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
    securityProto2.setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    securityProto2.setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    // Set issue date: January 15, 2021
    securityProto2.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(15));
    // Set maturity date: July 20, 2023 (2 years, 6 months, 5 days)
    securityProto2.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(7).setDay(20));
    securityProto2.setDescription('Test Bond with Months and Days');
    const bondSecurity2 = security_1.default.create(securityProto2);
    const tenor2 = bondSecurity2.getTenor();
    const period2 = tenor2.getTenor();
    if (period2) {
        assert(period2.years === 2, `Expected 2 years, got ${period2.years}`);
        assert(period2.months === 6, `Expected 6 months, got ${period2.months}`);
        assert(period2.days === 5, `Expected 5 days, got ${period2.days}`);
    }
    // Days are discarded when there are no weeks (rounding logic: 6M1D -> 6M)
    // So 2Y6M5D becomes 2Y6M
    assert(tenor2.toString() === 'TERM: 2Y6M', `Expected "TERM: 2Y6M", got "${tenor2.toString()}"`);
}
function testBondSecurityTenorWithAsOfDate() {
    // Create a SecurityProto with BOND_SECURITY type and dates for a 10-year bond
    const securityProto = new security_pb_1.SecurityProto();
    securityProto.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
    securityProto.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    // Set maturity date: January 1, 2031 (exactly 10 years later)
    securityProto.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    // Create BondSecurity
    const security = security_1.default.create(securityProto);
    const bondSecurity = security;
    // Test getTenor()
    const asOfDate = new Date(2026, 0, 1);
    const tenor = bondSecurity.getTenor(asOfDate);
    assert(tenor !== null, 'Tenor should not be null');
    assert(tenor.getType() === tenor_type_pb_1.TenorTypeProto.TERM, 'Tenor type should be TERM');
    const period = tenor.getTenor();
    assert(period !== null, 'Period should not be null');
    if (period) {
        assert(period.years === 5, `Expected 5 years, got ${period.years}`);
        assert(period.months === 0, `Expected 0 months, got ${period.months}`);
        assert(period.days === 0, `Expected 0 days, got ${period.days}`);
    }
    // Test tenor description
    const tenorDescription = tenor.getTenorDescription();
    assert(tenorDescription === '5Y', `Expected tenor description "5Y", got "${tenorDescription}"`);
    const tenorString = tenor.toString();
    assert(tenorString === 'TERM: 5Y', `Expected "TERM: 5Y", got "${tenorString}"`);
}
//# sourceMappingURL=BondSecurity.test.js.map