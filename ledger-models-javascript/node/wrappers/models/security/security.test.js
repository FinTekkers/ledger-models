"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const uuid_1 = require("../utils/uuid");
const assert = require("assert");
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
test('test the security wrapper', () => {
    testSerialization();
});
function testSerialization() {
    const security = dummySecurity();
    const maturityDate = security.getMaturityDate();
    assert(maturityDate !== null);
    assert(maturityDate.getFullYear() == 2026);
}
test('equity routes to base Security and isBond() returns false', () => {
    const equity = dummyEquity();
    expect(equity).toBeInstanceOf(security_1.default);
    expect(equity).not.toBeInstanceOf(BondSecurity_1.default);
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
    if (!bond.isBond())
        throw new Error('test setup: expected bond');
    const issueDate = bond.getIssueDate();
    expect(issueDate).not.toBeNull();
    expect(issueDate).toBeInstanceOf(Date);
    expect(issueDate.getFullYear()).toBe(2021);
});
test('Security.getMaturityDate returns null on equity (no throw)', () => {
    const equity = dummyEquity();
    expect(equity.getMaturityDate()).toBeNull();
});
test('BondSecurity.getMaturityDate works on bond (inherited from Security)', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond())
        throw new Error('test setup: expected bond');
    const maturityDate = bond.getMaturityDate();
    expect(maturityDate).not.toBeNull();
    expect(maturityDate).toBeInstanceOf(Date);
    expect(maturityDate.getFullYear()).toBe(2026);
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
        expect(idx.getIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
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
    const bond = new security_pb_1.BondDetailsProto()
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setBondDetails(bond)
        .setDescription("Dummy security"));
}
function dummyBondSecurity() {
    // Same dummy security but with securityType set so the factory routes
    // to BondSecurity.
    const bond = new security_pb_1.BondDetailsProto()
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setBondDetails(bond)
        .setDescription("Dummy bond"));
}
function dummyEquity() {
    // Equity has no maturity / issue date in the proto, exercising the
    // null-return behavior on the date accessors.
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.COMMON_STOCK)
        .setAssetClass("Equity")
        .setIssuerName("Dummy issuer Inc.")
        .setDescription("Dummy equity"));
}
function dummyMbs() {
    const bond = new security_pb_1.BondDetailsProto()
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.04'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.MONTHLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('250000000'))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2024).setMonth(1).setDay(1))
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2054).setMonth(1).setDay(1));
    const proto = new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED)
        .setAssetClass("FixedIncome")
        .setIssuerName("FNMA")
        .setBondDetails(bond);
    // Pool number lives on the mbs_extension sub-message.
    const MbsExtension = require('../../../fintekkers/models/security/security_pb').MbsExtensionProto;
    proto.setMbsExtension(new MbsExtension().setPoolNumber('FN AS1234'));
    return security_1.default.create(proto);
}
function dummyIndex() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.CPI_SERIES)
        .setAssetClass("Index")
        .setIssuerName("BLS")
        .setIndexDetails(new security_pb_1.IndexDetailsProto().setIndexType(index_type_pb_1.IndexTypeProto.CPI_U)));
}
function dummyCash() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.CURRENCY)
        .setAssetClass("Cash")
        .setIssuerName("Federal Reserve"));
}
function dummyFxSpot() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.FX_SPOT)
        .setAssetClass("FX")
        .setIssuerName("FX"));
}
//# sourceMappingURL=security.test.js.map