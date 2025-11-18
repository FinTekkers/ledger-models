import assert = require('assert');
import Security from './security';
import BondSecurity from './BondSecurity';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
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

function testBondSecurityCreation(): void {
    // Create a SecurityProto with BOND_SECURITY type, coupon type, and coupon frequency
    const securityProto = new SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(UUID.random().toUUIDProto());
    securityProto.setSecurityType(SecurityTypeProto.BOND_SECURITY);
    securityProto.setAssetClass('FixedIncome');
    securityProto.setIssuerName('Test Issuer');
    securityProto.setCouponType(CouponTypeProto.FIXED);
    securityProto.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    securityProto.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    securityProto.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    securityProto.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    securityProto.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
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
    securityProto.setSecurityType(SecurityTypeProto.BOND_SECURITY);
    securityProto.setAssetClass('FixedIncome');
    securityProto.setIssuerName('Test Issuer');
    securityProto.setCouponType(CouponTypeProto.FIXED);
    securityProto.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    securityProto.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    securityProto.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));

    // Set issue date: January 1, 2021
    securityProto.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    // Set maturity date: January 1, 2031 (exactly 10 years later)
    securityProto.setMaturityDate(new LocalDateProto().setYear(2031).setMonth(1).setDay(1));
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
    securityProto2.setSecurityType(SecurityTypeProto.BOND_SECURITY);
    securityProto2.setAssetClass('FixedIncome');
    securityProto2.setIssuerName('Test Issuer');
    securityProto2.setCouponType(CouponTypeProto.FIXED);
    securityProto2.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    securityProto2.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
    securityProto2.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'));

    // Set issue date: January 15, 2021
    securityProto2.setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(15));
    // Set maturity date: July 20, 2023 (2 years, 6 months, 5 days)
    securityProto2.setMaturityDate(new LocalDateProto().setYear(2023).setMonth(7).setDay(20));
    securityProto2.setDescription('Test Bond with Months and Days');

    const bondSecurity2 = Security.create(securityProto2) as BondSecurity;
    const tenor2 = bondSecurity2.getTenor();
    const period2 = tenor2.getTenor();

    if (period2) {
        assert(period2.years === 2, `Expected 2 years, got ${period2.years}`);
        assert(period2.months === 6, `Expected 6 months, got ${period2.months}`);
        assert(period2.days === 5, `Expected 5 days, got ${period2.days}`);
    }

    assert(tenor2.toString() === 'TERM: 2Y6M5D', `Expected "TERM: 2Y6M5D", got "${tenor2.toString()}"`);
}

