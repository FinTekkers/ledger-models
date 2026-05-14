"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const TIPSBond_1 = __importDefault(require("./TIPSBond"));
const FloatingRateNote_1 = __importDefault(require("./FloatingRateNote"));
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const decimal_js_1 = require("decimal.js");
function makeDate(y, m, d) {
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
}
const baseInputs = {
    faceValue: new decimal_js_1.Decimal('1000'),
    couponRate: new decimal_js_1.Decimal('0.045'),
    couponType: coupon_type_pb_1.CouponTypeProto.FIXED,
    couponFrequency: coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY,
    issueDate: makeDate(2024, 1, 15),
    maturityDate: makeDate(2034, 1, 15),
};
test('BondSecurity.fromPricerInputs round-trips through Security.create as a BondSecurity', () => {
    const proto = BondSecurity_1.default.fromPricerInputs(baseInputs);
    expect(proto.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TREASURY_NOTE);
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(BondSecurity_1.default);
    const bond = sec;
    expect(bond.getCouponRate().equals(new decimal_js_1.Decimal('0.045'))).toBe(true);
    expect(bond.getFaceValue().equals(new decimal_js_1.Decimal('1000'))).toBe(true);
    expect(bond.getCouponType().name()).toBe('FIXED');
    expect(bond.getCouponFrequency().toString()).toBe('SEMIANNUALLY');
    const issueDate = bond.getIssueDate();
    const maturityDate = bond.getMaturityDate();
    expect(issueDate).toBeInstanceOf(Date);
    expect(maturityDate).toBeInstanceOf(Date);
    expect(issueDate.getFullYear()).toBe(2024);
    expect(maturityDate.getFullYear()).toBe(2034);
});
test('TIPSBond.fromPricerInputs round-trips with tips_extension populated', () => {
    var _a;
    const proto = TIPSBond_1.default.fromPricerInputs(Object.assign(Object.assign({}, baseInputs), { baseCpi: new decimal_js_1.Decimal('301.5'), indexDate: makeDate(2024, 1, 15), inflationIndexType: index_type_pb_1.IndexTypeProto.CPI_U }));
    expect(proto.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TIPS);
    expect(proto.hasTipsExtension()).toBe(true);
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(TIPSBond_1.default);
    const tips = sec;
    // Bond-side checks (inherited from BondSecurity)
    expect(tips.getCouponRate().equals(new decimal_js_1.Decimal('0.045'))).toBe(true);
    // TIPS-specific checks
    expect((_a = tips.getBaseCpi()) === null || _a === void 0 ? void 0 : _a.toString()).toBe('301.5');
    const indexDate = tips.getIndexDate();
    expect(indexDate).toBeInstanceOf(Date);
    expect(indexDate.getFullYear()).toBe(2024);
    expect(tips.getInflationIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
});
test('FloatingRateNote.fromPricerInputs round-trips with frn_extension populated', () => {
    var _a;
    const proto = FloatingRateNote_1.default.fromPricerInputs(Object.assign(Object.assign({}, baseInputs), { spread: new decimal_js_1.Decimal('0.0015'), referenceRateIndex: index_type_pb_1.IndexTypeProto.SOFR, resetFrequency: coupon_frequency_pb_1.CouponFrequencyProto.QUARTERLY }));
    expect(proto.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TREASURY_FRN);
    expect(proto.hasFrnExtension()).toBe(true);
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(FloatingRateNote_1.default);
    const frn = sec;
    expect(frn.getCouponRate().equals(new decimal_js_1.Decimal('0.045'))).toBe(true);
    expect((_a = frn.getSpread()) === null || _a === void 0 ? void 0 : _a.toString()).toBe('0.0015');
    expect(frn.getReferenceRateIndex()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
    expect(frn.getResetFrequency()).toBe(coupon_frequency_pb_1.CouponFrequencyProto.QUARTERLY);
});
test('TIPS / FRN wrappers inherit isBond() narrowing', () => {
    const tipsProto = TIPSBond_1.default.fromPricerInputs(Object.assign(Object.assign({}, baseInputs), { baseCpi: new decimal_js_1.Decimal('250'), indexDate: makeDate(2024, 1, 15), inflationIndexType: index_type_pb_1.IndexTypeProto.CPI_U }));
    const frnProto = FloatingRateNote_1.default.fromPricerInputs(Object.assign(Object.assign({}, baseInputs), { spread: new decimal_js_1.Decimal('0.002'), referenceRateIndex: index_type_pb_1.IndexTypeProto.SOFR, resetFrequency: coupon_frequency_pb_1.CouponFrequencyProto.QUARTERLY }));
    expect(security_1.default.create(tipsProto).isBond()).toBe(true);
    expect(security_1.default.create(frnProto).isBond()).toBe(true);
});
//# sourceMappingURL=BondSecurity.fromPricerInputs.test.js.map