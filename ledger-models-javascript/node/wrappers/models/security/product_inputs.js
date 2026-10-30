"use strict";
/**
 * Which ProductInput arm values a security, and which market data that arm
 * needs. Backed by the valuation_arms section of
 * ledger-models-protos/hierarchy.json; there is no mapping table in code.
 * Same rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_arms.md.
 *
 * Resolution walks from the security's product_type up its parent chain. At
 * each node a coupon_types entry matching bond_details.coupon_type wins, then
 * the node's plain entry, then an unpriced listing. The first node with any
 * match decides. No match, or an unpriced match, throws
 * UnmappedProductTypeError: there is no default arm. A broken section throws
 * a plain Error at load, like product_hierarchy.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiredMarketData = exports.armFor = exports.shippedValuationArms = exports.parseValuationArms = exports.ValuationArms = void 0;
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const product_inputs_pb_1 = require("../../../fintekkers/requests/valuation/product_inputs_pb");
const errors_1 = require("../errors");
const product_hierarchy_1 = require("./product_hierarchy");
const MARKET_DATA_KINDS = ['CPI_U', 'FRN_FIXINGS', 'FRN_CURVE'];
/** Map key for a node's entry with no coupon_types. */
const ANY_COUPON = '';
function hasOwn(o, key) {
    return Object.prototype.hasOwnProperty.call(o, key);
}
function enumName(e, value) {
    for (const [k, v] of Object.entries(e)) {
        if (v === value)
            return k;
    }
    return String(value);
}
/** A parsed, checked valuation_arms section. */
class ValuationArms {
    /** @param entries node -> coupon type name (or '' for the plain entry) -> arm */
    constructor(entries, unpriced) {
        this.entries = entries;
        this.unpriced = unpriced;
    }
    /** The deepest matching node's arm, or null when unmapped or unpriced. */
    resolve(productType, couponType) {
        var _a;
        for (let node = productType; node !== null; node = (0, product_hierarchy_1.parentOf)(node)) {
            const byCoupon = this.entries.get(node);
            const arm = (_a = byCoupon === null || byCoupon === void 0 ? void 0 : byCoupon.get(couponType)) !== null && _a !== void 0 ? _a : byCoupon === null || byCoupon === void 0 ? void 0 : byCoupon.get(ANY_COUPON);
            if (arm)
                return arm;
            if (this.unpriced.has(node))
                return null;
        }
        return null;
    }
    require(productType, couponType) {
        const arm = this.resolve(productType, couponType);
        if (!arm)
            throw new errors_1.UnmappedProductTypeError(productType, couponType);
        return arm;
    }
    /** Leaf product types (active and planned) with neither an entry nor an unpriced listing. */
    uncoveredLeaves() {
        return (0, product_hierarchy_1.allProductTypes)().filter(n => (0, product_hierarchy_1.descendantsOf)(n).length === 0 && !this.covers(n));
    }
    covers(productType) {
        for (let node = productType; node !== null; node = (0, product_hierarchy_1.parentOf)(node)) {
            if (this.entries.has(node) || this.unpriced.has(node))
                return true;
        }
        return false;
    }
}
exports.ValuationArms = ValuationArms;
function bad(detail) {
    return new Error(`hierarchy.json valuation_arms: ${detail}`);
}
function stringOf(body, key) {
    const v = body[key];
    if (typeof v !== 'string')
        throw bad(`'${key}' must be a string in ${JSON.stringify(body)}`);
    return v;
}
function stringsOf(body, key) {
    const v = body[key];
    if (!Array.isArray(v) || !v.every(x => typeof x === 'string')) {
        throw bad(`'${key}' must be a list of strings in ${JSON.stringify(body)}`);
    }
    return v;
}
/**
 * Parses and checks a valuation_arms section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
function parseValuationArms(section) {
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
        throw bad('section must be an object');
    }
    const s = section;
    const productTypes = new Set((0, product_hierarchy_1.allProductTypes)());
    const arms = new Set(Object.keys(product_inputs_pb_1.ProductInput.InputCase)
        .filter(k => k !== 'INPUT_NOT_SET')
        .map(k => k.toLowerCase()));
    if (!Array.isArray(s.entries))
        throw bad("'entries' must be a list");
    const entries = new Map();
    for (const raw of s.entries) {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            throw bad(`entry must be an object, got ${JSON.stringify(raw)}`);
        }
        const body = raw;
        const node = stringOf(body, 'node');
        if (!productTypes.has(node))
            throw bad(`node '${node}' is not in product_types`);
        const arm = stringOf(body, 'arm');
        if (!arms.has(arm))
            throw bad(`arm '${arm}' is not a ProductInput.input field`);
        const requires = stringsOf(body, 'requires').map(r => {
            if (!MARKET_DATA_KINDS.includes(r)) {
                throw bad(`requires value '${r}' is not one of CPI_U, FRN_FIXINGS, FRN_CURVE`);
            }
            return r;
        });
        let coupons = [ANY_COUPON];
        if (hasOwn(body, 'coupon_types')) {
            coupons = stringsOf(body, 'coupon_types');
            for (const c of coupons) {
                if (!hasOwn(coupon_type_pb_1.CouponTypeProto, c))
                    throw bad(`coupon_types value '${c}' is not a CouponTypeProto name`);
            }
        }
        let byCoupon = entries.get(node);
        if (!byCoupon) {
            byCoupon = new Map();
            entries.set(node, byCoupon);
        }
        const value = Object.freeze({ arm, requires: Object.freeze(requires) });
        for (const c of coupons) {
            if (byCoupon.has(c))
                throw bad(`duplicate entry for node ${node}${c ? `, coupon_type ${c}` : ''}`);
            byCoupon.set(c, value);
        }
    }
    const unpriced = new Set();
    for (const node of stringsOf(s, 'unpriced')) {
        if (!productTypes.has(node))
            throw bad(`node '${node}' is not in product_types`);
        if (entries.has(node))
            throw bad(`node ${node} is both mapped and unpriced`);
        unpriced.add(node);
    }
    return new ValuationArms(entries, unpriced);
}
exports.parseValuationArms = parseValuationArms;
let shippedArms;
/** The shipped valuation_arms section, parsed and checked on first use. Exported for tests. */
function shippedValuationArms() {
    if (!shippedArms) {
        const section = hierarchy_json_1.default.valuation_arms;
        if (section === undefined)
            throw bad('section missing from hierarchy.json');
        shippedArms = parseValuationArms(section);
    }
    return shippedArms;
}
exports.shippedValuationArms = shippedValuationArms;
function productTypeOf(security) {
    return enumName(product_type_pb_1.ProductTypeProto, security.getProductType());
}
/** Read from the proto field only; unset bond_details reads as UNKNOWN_COUPON_TYPE. */
function couponTypeOf(security) {
    const details = security.getBondDetails();
    return details ? enumName(coupon_type_pb_1.CouponTypeProto, details.getCouponType()) : 'UNKNOWN_COUPON_TYPE';
}
/** Name of the ProductInput.input oneof field that values `security`, e.g. 'tips'. */
function armFor(security) {
    return shippedValuationArms().require(productTypeOf(security), couponTypeOf(security)).arm;
}
exports.armFor = armFor;
/** Market data the security's arm needs, in file order. A fresh array; empty when none. */
function requiredMarketData(security) {
    return [...shippedValuationArms().require(productTypeOf(security), couponTypeOf(security)).requires];
}
exports.requiredMarketData = requiredMarketData;
//# sourceMappingURL=product_inputs.js.map