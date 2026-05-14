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
const date_1 = require("../utils/date");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_js_1 = require("decimal.js");
function makeDate(y, m, d) {
    return new date_1.LocalDate(new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d));
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
    expect(bond.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
    expect(bond.getFaceValue().getArbitraryPrecisionValue()).toBe('1000');
    expect(bond.getCouponType().name()).toBe('FIXED');
    expect(bond.getCouponFrequency().toString()).toBe('SEMIANNUALLY');
    expect(bond.getIssueDate().toDate().getFullYear()).toBe(2024);
    expect(bond.getMaturityDate().toDate().getFullYear()).toBe(2034);
});
test('TIPSBond.fromPricerInputs round-trips with tips_extension populated', () => {
    var _a, _b;
    const proto = TIPSBond_1.default.fromPricerInputs(Object.assign(Object.assign({}, baseInputs), { baseCpi: new decimal_js_1.Decimal('301.5'), indexDate: makeDate(2024, 1, 15), inflationIndexType: index_type_pb_1.IndexTypeProto.CPI_U }));
    expect(proto.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TIPS);
    expect(proto.hasTipsExtension()).toBe(true);
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(TIPSBond_1.default);
    const tips = sec;
    // Bond-side checks (inherited from BondSecurity)
    expect(tips.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
    // TIPS-specific checks
    expect((_a = tips.getBaseCpi()) === null || _a === void 0 ? void 0 : _a.toString()).toBe('301.5');
    expect((_b = tips.getIndexDate()) === null || _b === void 0 ? void 0 : _b.toDate().getFullYear()).toBe(2024);
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
    expect(frn.getCouponRate().getArbitraryPrecisionValue()).toBe('0.045');
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