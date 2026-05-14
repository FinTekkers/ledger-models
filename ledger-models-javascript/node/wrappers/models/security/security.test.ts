import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUID } from '../utils/uuid';

import assert = require('assert');
import Security from './security';
import BondSecurity from './BondSecurity';
import IndexSecurity from './IndexSecurity';
import MortgageBackedSecurity from './MortgageBackedSecurity';

import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityProto, BondDetailsProto, IndexDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';


test('test the security wrapper', () => {
    testSerialization();
});

function testSerialization(): void {
    const security = dummySecurity();

    const maturityDate = security.getMaturityDate();
    assert(maturityDate !== null);
    assert(maturityDate.getFullYear() == 2026);
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

test('BondSecurity.getIssueDate returns Date on bond', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond()) throw new Error('test setup: expected bond');
    const issueDate = bond.getIssueDate();
    expect(issueDate).not.toBeNull();
    expect(issueDate).toBeInstanceOf(Date);
    expect(issueDate!.getFullYear()).toBe(2021);
});

test('Security.getMaturityDate returns null on equity (no throw)', () => {
    const equity = dummyEquity();
    expect(equity.getMaturityDate()).toBeNull();
});

test('BondSecurity.getMaturityDate works on bond (inherited from Security)', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond()) throw new Error('test setup: expected bond');
    const maturityDate = bond.getMaturityDate();
    expect(maturityDate).not.toBeNull();
    expect(maturityDate).toBeInstanceOf(Date);
    expect(maturityDate!.getFullYear()).toBe(2026);
});

test('isMbs(): true on MORTGAGE_BACKED, narrows to MortgageBackedSecurity', () => {
    const mbs = dummyMbs();
    expect(mbs.isMbs()).toBe(true);
    if (mbs.isMbs()) {
        // Inside the narrowed branch TS knows mbs: MortgageBackedSecurity.
        expect(mbs.getPoolNumber()).toBe('FN AS1234');
    }
    // Non-MBS bonds return false.
    expect(dummyBondSecurity().isMbs()).toBe(false);
    expect(dummyEquity().isMbs()).toBe(false);
});

test('isIndex(): true on EQUITY_INDEX / CPI_SERIES, narrows to IndexSecurity', () => {
    const idx = dummyIndex();
    expect(idx.isIndex()).toBe(true);
    if (idx.isIndex()) {
        // Inside the narrowed branch TS knows idx: IndexSecurity.
        expect(idx.getIndexType()).toBe(IndexTypeProto.CPI_U);
    }
    expect(dummyBondSecurity().isIndex()).toBe(false);
    expect(dummyEquity().isIndex()).toBe(false);
});

test('isCash(): runtime predicate, true on CURRENCY only', () => {
    expect(dummyCash().isCash()).toBe(true);
    expect(dummyBondSecurity().isCash()).toBe(false);
    expect(dummyEquity().isCash()).toBe(false);
});

test('isEquity(): runtime predicate, true on STOCK descendants', () => {
    expect(dummyEquity().isEquity()).toBe(true);
    expect(dummyBondSecurity().isEquity()).toBe(false);
    expect(dummyCash().isEquity()).toBe(false);
});

test('isFxSpot(): runtime predicate, true on FX_SPOT only', () => {
    expect(dummyFxSpot().isFxSpot()).toBe(true);
    expect(dummyCash().isFxSpot()).toBe(false);
    expect(dummyEquity().isFxSpot()).toBe(false);
});

function dummySecurity() {
    const bond = new BondDetailsProto()
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return Security.create(new SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setBondDetails(bond)
        .setDescription("Dummy security")
    );
}

function dummyBondSecurity() {
    // Same dummy security but with securityType set so the factory routes
    // to BondSecurity.
    const bond = new BondDetailsProto()
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.TREASURY_NOTE)
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setBondDetails(bond)
        .setDescription("Dummy bond")
    );
}

function dummyEquity() {
    // Equity has no maturity / issue date in the proto, exercising the
    // null-return behavior on the date accessors.
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.COMMON_STOCK)
        .setAssetClass("Equity")
        .setIssuerName("Dummy issuer Inc.")
        .setDescription("Dummy equity")
    );
}

function dummyMbs() {
    const bond = new BondDetailsProto()
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.04'))
        .setCouponFrequency(CouponFrequencyProto.MONTHLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('250000000'))
        .setIssueDate(new LocalDateProto().setYear(2024).setMonth(1).setDay(1))
        .setMaturityDate(new LocalDateProto().setYear(2054).setMonth(1).setDay(1));
    const proto = new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.MORTGAGE_BACKED)
        .setAssetClass("FixedIncome")
        .setIssuerName("FNMA")
        .setBondDetails(bond);
    // Pool number lives on the mbs_extension sub-message.
    const MbsExtension = require('../../../fintekkers/models/security/security_pb').MbsExtensionProto;
    proto.setMbsExtension(new MbsExtension().setPoolNumber('FN AS1234'));
    return Security.create(proto);
}

function dummyIndex() {
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.CPI_SERIES)
        .setAssetClass("Index")
        .setIssuerName("BLS")
        .setIndexDetails(new IndexDetailsProto().setIndexType(IndexTypeProto.CPI_U))
    );
}

function dummyCash() {
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.CURRENCY)
        .setAssetClass("Cash")
        .setIssuerName("Federal Reserve")
    );
}

function dummyFxSpot() {
    return Security.create(new SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
        .setProductType(ProductTypeProto.FX_SPOT)
        .setAssetClass("FX")
        .setIssuerName("FX")
    );
}

