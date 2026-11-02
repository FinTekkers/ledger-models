"use strict";
/**
 * Which ProductInput input type values a security, and which market data that
 * input type needs. Backed by the valuation_input_types section of
 * ledger-models-protos/hierarchy.json; there is no mapping table in code.
 * Same rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_input_types.md.
 *
 * Resolution walks from the security's product_type up its parent chain. At
 * each node a coupon_types entry matching bond_details.coupon_type wins, then
 * the node's plain entry, then an unpriced listing. The first node with any
 * match decides. No match, or an unpriced match, throws
 * UnmappedProductTypeError: there is no default input type. A broken section throws
 * a plain Error at load, like product_hierarchy.
 *
 * forSecurity builds the ProductInput for that input type from a security, its
 * price and its market data; checkProductInput checks a ProductInput against the
 * same rule (LM-410). See docs/adr/product_input_builders.md.
 *
 * measuresForInputType lists the measures valuation-service computes for an
 * input type, read from the bundled catalog/measures.json through the same
 * lookup (LM-427). There is no measure list in code.
 *
 * LM-418 renamed "arm" to "input type". The arm-named exports stay one release
 * as deprecated aliases, and hierarchy.json still loads with the legacy
 * valuation_arms / arm keys.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProductInput = exports.forSecurity = exports.shippedValuationArms = exports.parseValuationArms = exports.ValuationArms = exports.measuresForArmIn = exports.measuresForInputTypeIn = exports.measuresForArm = exports.measuresForInputType = exports.requiredMarketData = exports.armFor = exports.inputTypeFor = exports.shippedValuationInputTypes = exports.valuationInputTypesFromHierarchy = exports.parseValuationInputTypes = exports.ValuationInputTypes = void 0;
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const measures_json_1 = __importDefault(require("../../../../catalog/measures.json"));
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
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
const SECTION = 'valuation_input_types';
const ENTRY_KEY = 'input_type';
/** Legacy names, still read for one release (LM-418). */
const LEGACY_SECTION = 'valuation_arms';
const LEGACY_ENTRY_KEY = 'arm';
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
/** A parsed, checked valuation_input_types section. */
class ValuationInputTypes {
    /** @param entries node -> coupon type name (or '' for the plain entry) -> input type */
    constructor(entries, unpriced) {
        this.entries = entries;
        this.unpriced = unpriced;
    }
    /** The deepest matching node's input type, or null when unmapped or unpriced. */
    resolve(productType, couponType) {
        var _a;
        for (let node = productType; node !== null; node = (0, product_hierarchy_1.parentOf)(node)) {
            const byCoupon = this.entries.get(node);
            const entry = (_a = byCoupon === null || byCoupon === void 0 ? void 0 : byCoupon.get(couponType)) !== null && _a !== void 0 ? _a : byCoupon === null || byCoupon === void 0 ? void 0 : byCoupon.get(ANY_COUPON);
            if (entry)
                return entry;
            if (this.unpriced.has(node))
                return null;
        }
        return null;
    }
    require(productType, couponType) {
        const entry = this.resolve(productType, couponType);
        if (!entry)
            throw new errors_1.UnmappedProductTypeError(productType, couponType);
        return entry;
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
exports.ValuationInputTypes = ValuationInputTypes;
function bad(detail) {
    return new Error(`hierarchy.json ${SECTION}: ${detail}`);
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
 * Parses and checks a valuation_input_types section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
function parseValuationInputTypes(section) {
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
        throw bad('section must be an object');
    }
    const s = section;
    const productTypes = new Set((0, product_hierarchy_1.allProductTypes)());
    const inputTypes = new Set(Object.keys(product_inputs_pb_1.ProductInput.InputCase)
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
        const inputType = stringOf(body, inputTypeKey(body));
        if (!inputTypes.has(inputType))
            throw bad(`input_type '${inputType}' is not a ProductInput.input field`);
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
        const value = Object.freeze({
            inputType,
            get arm() { return inputType; },
            requires: Object.freeze(requires),
        });
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
    return new ValuationInputTypes(entries, unpriced);
}
exports.parseValuationInputTypes = parseValuationInputTypes;
/**
 * The key that names an entry's input type: input_type, or for one release
 * the legacy arm (LM-418). An entry with both throws.
 */
function inputTypeKey(body) {
    if (hasOwn(body, ENTRY_KEY) && hasOwn(body, LEGACY_ENTRY_KEY)) {
        throw bad(`entry has both ${ENTRY_KEY} and ${LEGACY_ENTRY_KEY}: ${JSON.stringify(body)}`);
    }
    return hasOwn(body, LEGACY_ENTRY_KEY) ? LEGACY_ENTRY_KEY : ENTRY_KEY;
}
/**
 * Parses and checks the valuation_input_types section of a whole
 * hierarchy.json `root`. For one release a root with the legacy
 * valuation_arms key instead loads the same way (LM-418); a root with both
 * keys, or neither, throws. Exported for tests.
 */
function valuationInputTypesFromHierarchy(root) {
    if (typeof root !== 'object' || root === null || Array.isArray(root)) {
        throw bad('hierarchy.json root must be an object');
    }
    const current = hasOwn(root, SECTION);
    const legacy = hasOwn(root, LEGACY_SECTION);
    if (current && legacy)
        throw bad(`both ${SECTION} and ${LEGACY_SECTION} present`);
    if (!current && !legacy)
        throw bad('section missing from hierarchy.json');
    return parseValuationInputTypes(root[current ? SECTION : LEGACY_SECTION]);
}
exports.valuationInputTypesFromHierarchy = valuationInputTypesFromHierarchy;
let shippedInputTypes;
/** The shipped valuation_input_types section, parsed and checked on first use. Exported for tests. */
function shippedValuationInputTypes() {
    if (!shippedInputTypes)
        shippedInputTypes = valuationInputTypesFromHierarchy(hierarchy_json_1.default);
    return shippedInputTypes;
}
exports.shippedValuationInputTypes = shippedValuationInputTypes;
function productTypeOf(security) {
    return enumName(product_type_pb_1.ProductTypeProto, security.getProductType());
}
/** Read from the proto field only; unset bond_details reads as UNKNOWN_COUPON_TYPE. */
function couponTypeOf(security) {
    const details = security.getBondDetails();
    return details ? enumName(coupon_type_pb_1.CouponTypeProto, details.getCouponType()) : 'UNKNOWN_COUPON_TYPE';
}
/** Name of the ProductInput.input oneof field that values `security`, e.g. 'tips'. */
function inputTypeFor(security) {
    return shippedValuationInputTypes().require(productTypeOf(security), couponTypeOf(security)).inputType;
}
exports.inputTypeFor = inputTypeFor;
/** @deprecated Use inputTypeFor. Removed in a later release (LM-418). */
function armFor(security) {
    return inputTypeFor(security);
}
exports.armFor = armFor;
/** Market data the security's input type needs, in file order. A fresh array; empty when none. */
function requiredMarketData(security) {
    return [...shippedValuationInputTypes().require(productTypeOf(security), couponTypeOf(security)).requires];
}
exports.requiredMarketData = requiredMarketData;
/**
 * The measures valuation-service computes for `inputType` (e.g. 'frn'), in catalog
 * order: entries of the bundled catalog/measures.json with computed_by
 * valuation-service and implemented true whose applies_to names a leaf product
 * type the input type values, or an ancestor of one. Throws
 * UnmappedProductTypeError(inputType, 'UNKNOWN_COUPON_TYPE') when no leaf maps
 * to `inputType`. A fresh array.
 */
function measuresForInputType(inputType) {
    return measuresForInputTypeIn(measures_json_1.default.measures, inputType);
}
exports.measuresForInputType = measuresForInputType;
/** @deprecated Use measuresForInputType. Removed in a later release (LM-418). */
function measuresForArm(arm) {
    return measuresForInputType(arm);
}
exports.measuresForArm = measuresForArm;
/**
 * measuresForInputType over a given `measures` list. Exported for tests.
 * @internal
 */
function measuresForInputTypeIn(measures, inputType) {
    var _a;
    const inputTypes = shippedValuationInputTypes();
    const lineage = new Set();
    for (const leaf of (0, product_hierarchy_1.allProductTypes)()) {
        if ((0, product_hierarchy_1.descendantsOf)(leaf).length > 0 || !hasOwn(product_type_pb_1.ProductTypeProto, leaf))
            continue;
        // Leaves resolve with no coupon type, as inputTypeFor does with no bond_details:
        // the BOND + FLOAT entry is ignored on purpose (docs/adr/valuation_input_types.md).
        if (((_a = inputTypes.resolve(leaf, 'UNKNOWN_COUPON_TYPE')) === null || _a === void 0 ? void 0 : _a.inputType) !== inputType)
            continue;
        for (let node = leaf; node !== null; node = (0, product_hierarchy_1.parentOf)(node))
            lineage.add(node);
    }
    if (lineage.size === 0)
        throw new errors_1.UnmappedProductTypeError(inputType, 'UNKNOWN_COUPON_TYPE');
    const out = [];
    for (const raw of measures) {
        const m = raw;
        if (m.computed_by !== 'valuation-service' || m.implemented !== true)
            continue;
        if (!Array.isArray(m.applies_to)) {
            throw new Error(`catalog/measures.json: 'applies_to' must be a list in ${JSON.stringify(m)}`);
        }
        if (!m.applies_to.some(n => typeof n === 'string' && lineage.has(n)))
            continue;
        const name = m.name;
        if (typeof name !== 'string' || !hasOwn(measure_pb_1.MeasureProto, name)) {
            throw new Error(`catalog/measures.json: '${String(name)}' is not a MeasureProto name`);
        }
        const measure = measure_pb_1.MeasureProto[name];
        if (!out.includes(measure))
            out.push(measure);
    }
    return out;
}
exports.measuresForInputTypeIn = measuresForInputTypeIn;
/**
 * @deprecated Use measuresForInputTypeIn. Removed in a later release (LM-418).
 * @internal
 */
function measuresForArmIn(measures, arm) {
    return measuresForInputTypeIn(measures, arm);
}
exports.measuresForArmIn = measuresForArmIn;
/** @deprecated Use ValuationInputTypes. Removed in a later release (LM-418). */
exports.ValuationArms = ValuationInputTypes;
/** @deprecated Use parseValuationInputTypes. Removed in a later release (LM-418). */
function parseValuationArms(section) {
    return parseValuationInputTypes(section);
}
exports.parseValuationArms = parseValuationArms;
/** @deprecated Use shippedValuationInputTypes. Removed in a later release (LM-418). */
function shippedValuationArms() {
    return shippedValuationInputTypes();
}
exports.shippedValuationArms = shippedValuationArms;
/**
 * The ProductInput for `security`, in the input type inputTypeFor picks.
 *
 * Sets the input type's security and copies price.price as is into clean_price
 * (bond, tips, frn, mbs) or unit_price (equity, cash). Never sets
 * cost_basis. Throws UnmappedProductTypeError when the type has no input type and
 * MissingMarketDataError when `marketData` lacks a kind the input type requires.
 * The caller's protos are set as they are, not copied or stamped (LM-322).
 */
function forSecurity(security, price, marketData) {
    var _a;
    const md = marketData !== null && marketData !== void 0 ? marketData : {};
    const inputType = inputTypeFor(security);
    const p = price.getPrice();
    const out = new product_inputs_pb_1.ProductInput();
    switch (inputType) {
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
            throw new Error(`forSecurity has no builder for input type ${inputType}`);
    }
    checkProductInput(out);
    return out;
}
exports.forSecurity = forSecurity;
/**
 * Checks `productInput` is the input type inputTypeFor picks for its security, and holds
 * every market-data kind that input type requires. Throws ModelValidationError (no
 * input type, or the wrong input type), UnmappedProductTypeError or MissingMarketDataError.
 */
function checkProductInput(productInput) {
    var _a;
    const [inputType, body] = inputTypeOf(productInput);
    if (!body)
        throw new errors_1.ModelValidationError([(0, errors_1.violation)('product_input', undefined, 'no ProductInput input type is set')]);
    const security = (_a = body.getSecurity()) !== null && _a !== void 0 ? _a : new security_pb_1.SecurityProto();
    const productType = productTypeOf(security);
    const resolved = shippedValuationInputTypes().require(productType, couponTypeOf(security));
    if (resolved.inputType !== inputType) {
        throw new errors_1.ModelValidationError([(0, errors_1.violation)(`product_input.${inputType}`, uuidOf(security), `input type ${inputType} does not match input type ${resolved.inputType} for product_type ${productType}`)]);
    }
    for (const kind of resolved.requires) {
        if (!has(productInput, kind))
            throw new errors_1.MissingMarketDataError(inputType, kind, `${inputType}.${FIELD_OF[kind]}`, uuidOf(security));
    }
}
exports.checkProductInput = checkProductInput;
/** The set input type's name and message, or [undefined, undefined] when none is set. */
function inputTypeOf(input) {
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
/** The ProductInput input type field (and MarketData field) that holds each kind. */
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