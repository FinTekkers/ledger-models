import assert = require('assert');
import Security from './security';
import BondSecurity from './BondSecurity';
import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { UUID } from '../utils/uuid';
import { CouponType } from './coupon_type';
import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';

test('test Security.create returns BondSecurity with correct coupon type and frequency', () => {
    testBondSecurityCreation();
});

test('test BondSecurity.getTenor() returns correct Tenor for 10-year bond', () => {
    testBondSecurityTenor();
});

test('test BondSecurity.getTenor() returns correct Tenor for 10-year bond with as of date', () => {
    testBondSecurityTenorWithAsOfDate();
});

function testBondSecurityCreation(): void {
    // Create a SecurityProto with BOND_SECURITY type, coupon type, and coupon frequency
    const securityProto = new SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(UUID.random().toUUIDProto());
    securityProto.setProductType(ProductTypeProto.TREASURY_NOTE);
    securityProto.setAssetClass('FixedIncome');
    securityProto.setIssuerName('Test Issuer');
    const bond = new BondDetailsProto();
    bond.setCouponType(CouponTypeProto.FIXED);
    bond.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    bond.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    bond.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    bond.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    bond.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setBondDetails(bond);
    securityProto.setDescription('Test Bond Security');

    // Call Security.create and validate it returns a BondSecurity
    const security = Security.create(securityProto);
    assert(security instanceof BondSecurity, 'Security.create should return a BondSecurity instance');

    // Cast to BondSecurity for type safety
    const bondSecurity = security as BondSecurity;

    // Validate coupon type
    const couponType = bondSecurity.getCouponType();
    assert(couponType.name() === 'FIXED', `Expected coupon type FIXED, got ${couponType.name()}`);

    // Validate coupon frequency
    const couponFrequency = bondSecurity.getCouponFrequency();
    assert(couponFrequency.toString() === 'SEMIANNUALLY', `Expected coupon frequency SEMIANNUALLY, got ${couponFrequency.toString()}`);
}

function testBondSecurityTenor(): void {
    // Create a SecurityProto with BOND_SECURITY type and dates for a 10-year bond
    const securityProto = new SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(UUID.random().toUUIDProto());
    securityProto.setProductType(ProductTypeProto.TREASURY_NOTE);
    securityProto.setAssetClass('FixedIncome');
    securityProto.setIssuerName('Test Issuer');
    const bond = new BondDetailsProto();
    bond.setCouponType(CouponTypeProto.FIXED);
    bond.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    bond.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    bond.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));

    // Set issue date: January 1, 2021
    bond.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    // Set maturity date: January 1, 2031 (exactly 10 years later)
    bond.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setBondDetails(bond);
    securityProto.setDescription('Test 10-Year Bond Security');

    // Create BondSecurity
    const security = Security.create(securityProto);
    assert(security instanceof BondSecurity, 'Security.create should return a BondSecurity instance');
    const bondSecurity = security as BondSecurity;

    // Test getTenor()
    const tenor = bondSecurity.getTenor();
    assert(tenor !== null, 'Tenor should not be null');
    assert(tenor.getType() === TenorTypeProto.TERM, 'Tenor type should be TERM');

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
    const securityProto2 = new SecurityProto();
    securityProto2.setObjectClass('Security');
    securityProto2.setVersion('0.0.1');
    securityProto2.setUuid(UUID.random().toUUIDProto());
    securityProto2.setProductType(ProductTypeProto.TREASURY_NOTE);
    securityProto2.setAssetClass('FixedIncome');
    securityProto2.setIssuerName('Test Issuer');
    const bond2 = new BondDetailsProto();
    bond2.setCouponType(CouponTypeProto.FIXED);
    bond2.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    bond2.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    bond2.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));

    // Set issue date: January 15, 2021
    bond2.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(15));
    // Set maturity date: July 20, 2023 (2 years, 6 months, 5 days)
    bond2.setMaturityDate(new LocalDateProto().setYear(2023).setMonth(7).setDay(20));
    securityProto2.setBondDetails(bond2);
    securityProto2.setDescription('Test Bond with Months and Days');

    const bondSecurity2 = Security.create(securityProto2) as BondSecurity;
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

function testBondSecurityTenorWithAsOfDate(): void {
    // Create a SecurityProto with BOND_SECURITY type and dates for a 10-year bond
    const securityProto = new SecurityProto();

    securityProto.setProductType(ProductTypeProto.TREASURY_NOTE);
    const bond3 = new BondDetailsProto();
    bond3.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    // Set maturity date: January 1, 2031 (exactly 10 years later)
    bond3.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    securityProto.setBondDetails(bond3);

    // Create BondSecurity
    const security = Security.create(securityProto);
    const bondSecurity = security as BondSecurity;

    // Test getTenor()
    const asOfDate = new Date(2026, 0, 1);
    const tenor = bondSecurity.getTenor(asOfDate);

    assert(tenor !== null, 'Tenor should not be null');
    assert(tenor.getType() === TenorTypeProto.TERM, 'Tenor type should be TERM');

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