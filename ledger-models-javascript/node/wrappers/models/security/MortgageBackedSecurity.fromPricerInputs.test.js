"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const MortgageBackedSecurity_1 = __importDefault(require("./MortgageBackedSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const agency_pb_1 = require("../../../fintekkers/models/security/bond/agency_pb");
const decimal_js_1 = require("decimal.js");
function makeDate(y, m, d) {
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
}
const baseInputs = {
    faceValue: new decimal_js_1.Decimal('250000000'),
    couponRate: new decimal_js_1.Decimal('0.04'),
    couponType: coupon_type_pb_1.CouponTypeProto.FIXED,
    couponFrequency: coupon_frequency_pb_1.CouponFrequencyProto.MONTHLY,
    issueDate: makeDate(2024, 1, 1),
    maturityDate: makeDate(2054, 1, 1),
};
const mbsInputs = Object.assign(Object.assign({}, baseInputs), { poolNumber: 'FN AS1234', agency: agency_pb_1.AgencyProto.FNMA, wac: new decimal_js_1.Decimal('0.045'), wam: 358, passThroughRate: new decimal_js_1.Decimal('0.04'), currentFactor: new decimal_js_1.Decimal('0.95'), originalFaceValue: new decimal_js_1.Decimal('250000000'), currentUpb: new decimal_js_1.Decimal('237500000'), psaSpeed: new decimal_js_1.Decimal('150') });
test('MortgageBackedSecurity.fromPricerInputs populates bond_details and mbs_extension', () => {
    var _a, _b, _c, _d, _e, _f;
    const proto = MortgageBackedSecurity_1.default.fromPricerInputs(mbsInputs);
    expect(proto.getProductType()).toBe(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED);
    expect(proto.hasBondDetails()).toBe(true);
    expect(proto.hasMbsExtension()).toBe(true);
    const ext = proto.getMbsExtension();
    expect(ext.getPoolNumber()).toBe('FN AS1234');
    expect(ext.getAgency()).toBe(agency_pb_1.AgencyProto.FNMA);
    expect((_a = ext.getWac()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()).toBe('0.045');
    expect(ext.getWam()).toBe(358);
    expect((_b = ext.getPassThroughRate()) === null || _b === void 0 ? void 0 : _b.getArbitraryPrecisionValue()).toBe('0.04');
    expect((_c = ext.getCurrentFactor()) === null || _c === void 0 ? void 0 : _c.getArbitraryPrecisionValue()).toBe('0.95');
    expect((_d = ext.getOriginalFaceValue()) === null || _d === void 0 ? void 0 : _d.getArbitraryPrecisionValue()).toBe('250000000');
    expect((_e = ext.getCurrentUpb()) === null || _e === void 0 ? void 0 : _e.getArbitraryPrecisionValue()).toBe('237500000');
    expect((_f = ext.getPsaSpeed()) === null || _f === void 0 ? void 0 : _f.getArbitraryPrecisionValue()).toBe('150');
});
test('MortgageBackedSecurity round-trips via serializeBinary / deserializeBinary preserving all 9 mbs fields', () => {
    var _a, _b, _c, _d, _e, _f;
    const proto = MortgageBackedSecurity_1.default.fromPricerInputs(mbsInputs);
    const bytes = proto.serializeBinary();
    const round = security_pb_1.SecurityProto.deserializeBinary(bytes);
    expect(round.getProductType()).toBe(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED);
    expect(round.hasBondDetails()).toBe(true);
    expect(round.hasMbsExtension()).toBe(true);
    const ext = round.getMbsExtension();
    expect(ext.getPoolNumber()).toBe('FN AS1234');
    expect(ext.getAgency()).toBe(agency_pb_1.AgencyProto.FNMA);
    expect((_a = ext.getWac()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()).toBe('0.045');
    expect(ext.getWam()).toBe(358);
    expect((_b = ext.getPassThroughRate()) === null || _b === void 0 ? void 0 : _b.getArbitraryPrecisionValue()).toBe('0.04');
    expect((_c = ext.getCurrentFactor()) === null || _c === void 0 ? void 0 : _c.getArbitraryPrecisionValue()).toBe('0.95');
    expect((_d = ext.getOriginalFaceValue()) === null || _d === void 0 ? void 0 : _d.getArbitraryPrecisionValue()).toBe('250000000');
    expect((_e = ext.getCurrentUpb()) === null || _e === void 0 ? void 0 : _e.getArbitraryPrecisionValue()).toBe('237500000');
    expect((_f = ext.getPsaSpeed()) === null || _f === void 0 ? void 0 : _f.getArbitraryPrecisionValue()).toBe('150');
});
test('MortgageBackedSecurity wraps via Security.create factory dispatch', () => {
    const proto = MortgageBackedSecurity_1.default.fromPricerInputs(mbsInputs);
    const sec = security_1.default.create(proto);
    expect(sec).toBeInstanceOf(MortgageBackedSecurity_1.default);
    // Inherits BondSecurity behaviour.
    expect(sec).toBeInstanceOf(BondSecurity_1.default);
    expect(sec.isBond()).toBe(true);
});
test('MortgageBackedSecurity typed accessors read back the expected values', () => {
    var _a, _b, _c, _d, _e, _f;
    const proto = MortgageBackedSecurity_1.default.fromPricerInputs(mbsInputs);
    const sec = security_1.default.create(proto);
    // Bond-side checks (inherited from BondSecurity).
    expect(sec.getCouponRate().equals(new decimal_js_1.Decimal('0.04'))).toBe(true);
    expect(sec.getFaceValue().equals(new decimal_js_1.Decimal('250000000'))).toBe(true);
    const issueDate = sec.getIssueDate();
    const maturityDate = sec.getMaturityDate();
    expect(issueDate).toBeInstanceOf(Date);
    expect(maturityDate).toBeInstanceOf(Date);
    expect(issueDate.getFullYear()).toBe(2024);
    expect(maturityDate.getFullYear()).toBe(2054);
    // MBS-specific accessor checks.
    expect(sec.getPoolNumber()).toBe('FN AS1234');
    expect(sec.getAgency()).toBe(agency_pb_1.AgencyProto.FNMA);
    expect((_a = sec.getWac()) === null || _a === void 0 ? void 0 : _a.toString()).toBe('0.045');
    expect(sec.getWam()).toBe(358);
    expect((_b = sec.getPassThroughRate()) === null || _b === void 0 ? void 0 : _b.toString()).toBe('0.04');
    expect((_c = sec.getCurrentFactor()) === null || _c === void 0 ? void 0 : _c.toString()).toBe('0.95');
    expect((_d = sec.getOriginalFaceValue()) === null || _d === void 0 ? void 0 : _d.toString()).toBe('250000000');
    expect((_e = sec.getCurrentUpb()) === null || _e === void 0 ? void 0 : _e.toString()).toBe('237500000');
    expect((_f = sec.getPsaSpeed()) === null || _f === void 0 ? void 0 : _f.toString()).toBe('150');
});
//# sourceMappingURL=MortgageBackedSecurity.fromPricerInputs.test.js.map