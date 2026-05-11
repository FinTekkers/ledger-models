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
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
test('test the security wrapper', () => {
    testSerialization();
});
function testSerialization() {
    const security = dummySecurity();
    assert(security.getMaturityDate().toDate().getFullYear() == 2026);
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
test('BondSecurity.getIssueDate returns LocalDate (non-nullable) on bond', () => {
    const bond = dummyBondSecurity();
    if (!bond.isBond())
        throw new Error('test setup: expected bond');
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
    if (!bond.isBond())
        throw new Error('test setup: expected bond');
    expect(bond.getMaturityDate().toDate().getFullYear()).toBe(2026);
});
function dummySecurity() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy security"));
}
function dummyBondSecurity() {
    // Same dummy security but with securityType set so the factory routes
    // to BondSecurity.
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy bond"));
}
function dummyEquity() {
    // Equity has no maturity / issue date in the proto, exercising the
    // null-return behavior on getIssueDate and the throw-on-missing
    // behavior on getMaturityDate.
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.COMMON_STOCK)
        .setAssetClass("Equity")
        .setIssuerName("Dummy issuer Inc.")
        .setDescription("Dummy equity"));
}
//# sourceMappingURL=security.test.js.map