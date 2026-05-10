import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUID } from '../utils/uuid';

import assert = require('assert');
import Security from './security';
import BondSecurity from './BondSecurity';

import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';


test('test the security wrapper', () => {
    testSerialization();
});

function testSerialization(): void {
    const security = dummySecurity();

    assert(security.getMaturityDate().toDate().getFullYear() == 2026);
}

test('equity routes to base Security and isBond() returns false', () => {
    const equity = dummyEquity();
    expect(equity).toBeInstanceOf(Security);
    expect(equity).not.toBeInstanceOf(BondSecurity);
    expect(equity.isBond()).toBe(false);
});

test('bond routes to BondSecurity and isBond() returns true (narrows type)', () => {
    const bond = dummyBondSecurity();
    expect(bond.isBond()).toBe(true);
    if (bond.isBond()) {
        // Inside the narrowed branch TS knows bond: BondSecurity.
        // Calling a BondSecurity-only method here proves the narrowing works.
        expect(bond.getCouponRate()).toBeDefined();
    }
});

test('Security.getIssueDate returns null on equity (no throw)', () => {
    const equity = dummyEquity();
    // Phase 1 behavior change: was throw "Issue date is required", now returns null.
    // This is the symptom fix that motivated #205 — equity wrappers no longer
    // explode on per-record post-processing in ui-service.
    expect(equity.getIssueDate()).toBeNull();
});

test('BondSecurity.getIssueDate returns LocalDate (non-nullable) on bond', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond()) throw new Error('test setup: expected bond');
    const issueDate = bond.getIssueDate();
    expect(issueDate).not.toBeNull();
    expect(issueDate.toDate().getFullYear()).toBe(2021);
});

test('Security.getMaturityDate still throws on equity (Phase 1 deprecation, not removal)', () => {
    const equity = dummyEquity();
    // Behavior preserved deliberately for Phase 1 — callers still get a
    // loud error if they don't narrow first. Removal happens in Phase 2.
    expect(() => equity.getMaturityDate()).toThrow('Maturity date is required');
});

test('BondSecurity.getMaturityDate works on bond (inherited from Security)', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond()) throw new Error('test setup: expected bond');
    expect(bond.getMaturityDate().toDate().getFullYear()).toBe(2026);
});

function dummySecurity() {
    return Security.create(new SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")

        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)

        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy security")
    );
}

function dummyBondSecurity() {
    // Same dummy security but with securityType set so the factory routes
    // to BondSecurity.
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.TREASURY_NOTE)
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy bond")
    );
}

function dummyEquity() {
    // Equity has no maturity / issue date in the proto, exercising the
    // null-return behavior on getIssueDate and the throw-on-missing
    // behavior on getMaturityDate.
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.COMMON_STOCK)
        .setAssetClass("Equity")
        .setIssuerName("Dummy issuer Inc.")
        .setDescription("Dummy equity")
    );
}

