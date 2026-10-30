"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-409: valuation_arms in hierarchy.json, resolved by armFor /
 * requiredMarketData.
 *
 * The shared cases live in ledger-models-protos/fixtures/valuation_arms_cases.json,
 * read by the Java, Python and Rust tests too.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const product_inputs_1 = require("./product_inputs");
const product_hierarchy_1 = require("./product_hierarchy");
const errors_1 = require("../errors");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
const BUNDLED = path.resolve(__dirname, '../../../../hierarchy.json');
const cases = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/valuation_arms_cases.json'), 'utf-8')).cases;
function sourceSection() {
    return JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8')).valuation_arms;
}
function hasEnumValue(productType) {
    return Object.prototype.hasOwnProperty.call(product_type_pb_1.ProductTypeProto, productType);
}
function security(productType, couponType) {
    const details = new security_pb_1.BondDetailsProto();
    details.setCouponType(coupon_type_pb_1.CouponTypeProto[couponType]);
    const s = new security_pb_1.SecurityProto();
    s.setProductType(product_type_pb_1.ProductTypeProto[productType]);
    s.setBondDetails(details);
    return s;
}
/** [arm, requires] through a real proto when the type has an enum value; planned leaves by name. */
function resolve(productType, couponType) {
    if (!hasEnumValue(productType)) {
        const a = (0, product_inputs_1.shippedValuationArms)().require(productType, couponType);
        return [a.arm, [...a.requires]];
    }
    const s = security(productType, couponType);
    return [(0, product_inputs_1.armFor)(s), (0, product_inputs_1.requiredMarketData)(s)];
}
function catchUnmapped(fn) {
    try {
        fn();
    }
    catch (e) {
        if (e instanceof errors_1.UnmappedProductTypeError)
            return e;
        throw e;
    }
    throw new Error('expected UnmappedProductTypeError');
}
describe('valuation_arms shared fixture (metric 1)', () => {
    test('has the required cases', () => {
        expect(cases.length).toBeGreaterThanOrEqual(5);
        const seen = cases.map(c => `${c.product_type}/${c.coupon_type}`);
        expect(seen).toEqual(expect.arrayContaining([
            'TBILL/ZERO', 'TIPS/FIXED', 'CORP_BOND/FLOAT', 'TREASURY_NOTE/FLOAT', 'FX_SPOT/UNKNOWN_COUPON_TYPE',
        ]));
    });
    test.each(cases.map(c => [`${c.product_type}/${c.coupon_type}`, c]))('%s', (_, c) => {
        if (c.error !== undefined) {
            expect(c.error).toBe('UnmappedProductTypeError');
            const e = catchUnmapped(() => resolve(c.product_type, c.coupon_type));
            expect([e.productType, e.couponType]).toEqual([c.product_type, c.coupon_type]);
        }
        else {
            expect(resolve(c.product_type, c.coupon_type)).toEqual([c.arm, c.requires]);
        }
    });
});
describe('unmapped types raise (metric 2)', () => {
    const unmapped = new Set(['FX_SPOT']);
    for (const root of ['INDEX', 'CRYPTO', 'COMMODITY_SPOT']) {
        for (const n of (0, product_hierarchy_1.descendantsOf)(root))
            if ((0, product_hierarchy_1.descendantsOf)(n).length === 0)
                unmapped.add(n);
    }
    test('the set comes from the registry', () => {
        expect([...unmapped]).toEqual(expect.arrayContaining([
            'FX_SPOT', 'COMMODITY_INDEX', 'PLATINUM', 'PALLADIUM', 'CRYPTOCURRENCY', 'GOLD',
        ]));
    });
    test.each([...unmapped].sort())('%s', pt => {
        const e = catchUnmapped(() => resolve(pt, 'UNKNOWN_COUPON_TYPE'));
        expect(e.message).toContain(pt);
        expect(e.message).toContain('UNKNOWN_COUPON_TYPE');
    });
    test('message names product and coupon type', () => {
        const gold = security('GOLD', 'FLOAT');
        const e = catchUnmapped(() => (0, product_inputs_1.armFor)(gold));
        expect(e.message).toContain('GOLD');
        expect(e.message).toContain('FLOAT');
        expect(() => (0, product_inputs_1.requiredMarketData)(gold)).toThrow(errors_1.UnmappedProductTypeError);
    });
    test('unset bond_details reads as UNKNOWN_COUPON_TYPE', () => {
        const corp = new security_pb_1.SecurityProto();
        corp.setProductType(product_type_pb_1.ProductTypeProto.CORP_BOND);
        expect((0, product_inputs_1.armFor)(corp)).toBe('bond');
        const fx = new security_pb_1.SecurityProto();
        fx.setProductType(product_type_pb_1.ProductTypeProto.FX_SPOT);
        expect(catchUnmapped(() => (0, product_inputs_1.armFor)(fx)).couponType).toBe('UNKNOWN_COUPON_TYPE');
    });
});
test('bundled valuation_arms equals the source (metric 4)', () => {
    expect(fs.existsSync(BUNDLED)).toBe(true);
    const bundled = JSON.parse(fs.readFileSync(BUNDLED, 'utf-8'));
    expect(bundled.valuation_arms).toBeDefined();
    expect(bundled.valuation_arms).toEqual(sourceSection());
});
test('parse rejects a requires value outside the vocabulary (metric 5)', () => {
    const section = sourceSection();
    section.entries[0].requires.push('FX_RATE');
    expect(() => (0, product_inputs_1.parseValuationArms)(section)).toThrow(/FX_RATE/);
});
test('every leaf is covered (metric 3)', () => {
    expect((0, product_inputs_1.shippedValuationArms)().uncoveredLeaves()).toEqual([]);
});
//# sourceMappingURL=product_inputs.test.js.map