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
 *
 * forSecurity builds the ProductInput for that arm from a security, its price
 * and its market data; checkProductInput checks a ProductInput against the
 * same rule (LM-410). See docs/adr/product_input_builders.md.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProductInput = exports.forSecurity = exports.requiredMarketData = exports.armFor = exports.shippedValuationArms = exports.parseValuationArms = exports.ValuationArms = void 0;
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_inputs_pb_1 = require("../../../fintekkers/requests/valuation/product_inputs_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
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
/**
 * The ProductInput for `security`, in the arm armFor picks.
 *
 * Sets the arm's security and copies price.price as is into clean_price
 * (bond, tips, frn, mbs) or unit_price (equity, cash). Never sets
 * cost_basis. Throws UnmappedProductTypeError when the type has no arm and
 * MissingMarketDataError when `marketData` lacks a kind the arm requires.
 * The caller's protos are set as they are, not copied or stamped (LM-322).
 */
function forSecurity(security, price, marketData) {
    var _a;
    const md = marketData !== null && marketData !== void 0 ? marketData : {};
    const arm = armFor(security);
    const p = price.getPrice();
    const out = new product_inputs_pb_1.ProductInput();
    switch (arm) {
        case 'bond':
            out.setBond(new product_inputs_pb_1.BondInput().setSecurity(security).setCleanPrice(p));
            break;
        case 'tips':
            out.setTips(new product_inputs_pb_1.TipsInput().setSecurity(security).setCleanPrice(p).setCpi(md.cpi));
            break;
        case 'frn':
            out.setFrn(new product_inputs_pb_1.FrnInput().setSecurity(security).setCleanPrice(p).setCurve(md.curve)
                .setFixingsList([...((_a = md.fixings) !== null && _a !== void 0 ? _a : [])]));
            break;
        case 'mbs':
            out.setMbs(new product_inputs_pb_1.MbsInput().setSecurity(security).setCleanPrice(p));
            break;
        case 'equity':
            out.setEquity(new product_inputs_pb_1.EquityInput().setSecurity(security).setUnitPrice(p));
            break;
        case 'cash':
            out.setCash(new product_inputs_pb_1.CashInput().setSecurity(security).setUnitPrice(p));
            break;
        default:
            throw new Error(`forSecurity has no builder for arm ${arm}`);
    }
    checkProductInput(out);
    return out;
}
exports.forSecurity = forSecurity;
/**
 * Checks `productInput` is the arm armFor picks for its security, and holds
 * every market-data kind that arm requires. Throws ModelValidationError (no
 * arm, or the wrong arm), UnmappedProductTypeError or MissingMarketDataError.
 */
function checkProductInput(productInput) {
    var _a;
    const [arm, body] = armOf(productInput);
    if (!body)
        throw new errors_1.ModelValidationError([(0, errors_1.violation)('product_input', undefined, 'no ProductInput arm is set')]);
    const security = (_a = body.getSecurity()) !== null && _a !== void 0 ? _a : new security_pb_1.SecurityProto();
    const productType = productTypeOf(security);
    const resolved = shippedValuationArms().require(productType, couponTypeOf(security));
    if (resolved.arm !== arm) {
        throw new errors_1.ModelValidationError([(0, errors_1.violation)(`product_input.${arm}`, uuidOf(security), `arm ${arm} does not match arm ${resolved.arm} for product_type ${productType}`)]);
    }
    for (const kind of resolved.requires) {
        if (!has(productInput, kind))
            throw new errors_1.MissingMarketDataError(arm, kind, `${arm}.${FIELD_OF[kind]}`, uuidOf(security));
    }
}
exports.checkProductInput = checkProductInput;
/** The set arm's name and message, or [undefined, undefined] when none is set. */
function armOf(input) {
    switch (input.getInputCase()) {
        case product_inputs_pb_1.ProductInput.InputCase.BOND: return ['bond', input.getBond()];
        case product_inputs_pb_1.ProductInput.InputCase.TIPS: return ['tips', input.getTips()];
        case product_inputs_pb_1.ProductInput.InputCase.FRN: return ['frn', input.getFrn()];
        case product_inputs_pb_1.ProductInput.InputCase.MBS: return ['mbs', input.getMbs()];
        case product_inputs_pb_1.ProductInput.InputCase.EQUITY: return ['equity', input.getEquity()];
        case product_inputs_pb_1.ProductInput.InputCase.CASH: return ['cash', input.getCash()];
        default: return [undefined, undefined];
    }
}
/** The ProductInput arm field (and MarketData field) that holds each kind. */
const FIELD_OF = { CPI_U: 'cpi', FRN_FIXINGS: 'fixings', FRN_CURVE: 'curve' };
/** Whether `input` holds `kind`. A cpi with neither readings nor reference_cpi does not count. */
function has(input, kind) {
    var _a, _b, _c, _d, _e;
    switch (kind) {
        case 'CPI_U': {
            const cpi = (_a = input.getTips()) === null || _a === void 0 ? void 0 : _a.getCpi();
            return cpi !== undefined && cpi.getCpiCase() !== product_inputs_pb_1.InflationIndexInput.CpiCase.CPI_NOT_SET;
        }
        case 'FRN_FIXINGS': return ((_c = (_b = input.getFrn()) === null || _b === void 0 ? void 0 : _b.getFixingsList().length) !== null && _c !== void 0 ? _c : 0) > 0;
        case 'FRN_CURVE': return (_e = (_d = input.getFrn()) === null || _d === void 0 ? void 0 : _d.hasCurve()) !== null && _e !== void 0 ? _e : false;
    }
}
function uuidOf(security) {
    var _a;
    const raw = (_a = security.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
//# sourceMappingURL=product_inputs.js.map