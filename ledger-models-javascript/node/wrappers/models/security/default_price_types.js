"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTradePriceType = exports.defaultPriceTypeFor = exports.shippedDefaultPriceTypes = exports.parseDefaultPriceTypes = exports.DefaultPriceTypes = void 0;
/**
 * The default price_type of a trade price, by product. Backed by the
 * default_price_types section of ledger-models-protos/hierarchy.json; there is
 * no mapping table in code. Same rule in Java / Rust / Python / JS-TS. See
 * docs/adr/default_price_types.md.
 *
 * Resolution walks from the security's product_type up its parent chain; the
 * first node with an entry decides, so SOFR_SERIES -> RATE beats INDEX ->
 * INDEX_LEVEL. A product with no entry anywhere on its chain has no default.
 *
 * resolveTradePriceType is what the Transaction params constructor calls: an
 * explicit priceType wins (UNKNOWN_PRICE_TYPE, proto3's unset value, counts as
 * omitted), then the table default, else NoDefaultPriceTypeError. It never
 * returns UNKNOWN_PRICE_TYPE. A broken section throws at load, like
 * product_inputs.
 */
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
const product_hierarchy_1 = require("./product_hierarchy");
const SECTION = 'default_price_types';
const UNKNOWN = 'UNKNOWN_PRICE_TYPE';
function hasOwn(o, key) {
    return Object.prototype.hasOwnProperty.call(o, key);
}
function bad(detail) {
    return new Error(`hierarchy.json ${SECTION}: ${detail}`);
}
/** A parsed, checked default_price_types section: node -> PriceTypeProto value. */
class DefaultPriceTypes {
    constructor(entries) {
        const frozen = new Map(entries);
        const readOnly = () => { throw new TypeError('DefaultPriceTypes entries are read-only'); };
        frozen.set = readOnly;
        frozen.delete = readOnly;
        frozen.clear = readOnly;
        this.entries = frozen;
    }
    /** The deepest entry on productType's parent chain, or null. */
    defaultFor(productType) {
        for (let node = productType; node !== null; node = (0, product_hierarchy_1.parentOf)(node)) {
            const type = this.entries.get(node);
            if (type !== undefined)
                return type;
        }
        return null;
    }
}
exports.DefaultPriceTypes = DefaultPriceTypes;
/**
 * Parses and checks a default_price_types section against the shipped
 * product_types tree and the PriceTypeProto names. Throws when the section is
 * missing (undefined) or not an object, a key is not a product_types node, or
 * a value is not a PriceTypeProto name or is UNKNOWN_PRICE_TYPE. Exported for tests.
 */
function parseDefaultPriceTypes(section) {
    if (section === undefined)
        throw bad('section missing from hierarchy.json');
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
        throw bad('section must be an object');
    }
    const productTypes = new Set((0, product_hierarchy_1.allProductTypes)());
    const entries = new Map();
    for (const [node, name] of Object.entries(section)) {
        if (!productTypes.has(node))
            throw bad(`node '${node}' is not in product_types`);
        if (typeof name !== 'string' || !hasOwn(price_type_pb_1.PriceTypeProto, name)) {
            throw bad(`value ${JSON.stringify(name)} for node ${node} is not a PriceTypeProto name`);
        }
        if (name === UNKNOWN)
            throw bad(`node ${node} must not default to ${UNKNOWN}`);
        entries.set(node, price_type_pb_1.PriceTypeProto[name]);
    }
    return new DefaultPriceTypes(entries);
}
exports.parseDefaultPriceTypes = parseDefaultPriceTypes;
let shipped;
/** The shipped default_price_types section, parsed and checked on first use. */
function shippedDefaultPriceTypes() {
    if (!shipped) {
        const root = hierarchy_json_1.default;
        shipped = parseDefaultPriceTypes(hasOwn(root, SECTION) ? root[SECTION] : undefined);
    }
    return shipped;
}
exports.shippedDefaultPriceTypes = shippedDefaultPriceTypes;
/**
 * The table default for the security's product_type, or null when it has
 * none. A missing security reads as PRODUCT_TYPE_UNKNOWN.
 */
function defaultPriceTypeFor(security) {
    return shippedDefaultPriceTypes().defaultFor(productTypeOf(security));
}
exports.defaultPriceTypeFor = defaultPriceTypeFor;
/**
 * The price_type to put on a trade price for this security. An explicit
 * priceType other than UNKNOWN_PRICE_TYPE is returned unchanged; otherwise the
 * table default. Throws NoDefaultPriceTypeError naming the product when there
 * is neither.
 */
function resolveTradePriceType(security, priceType) {
    if (priceType !== undefined && priceType !== null && priceType !== price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE) {
        return priceType;
    }
    const resolved = defaultPriceTypeFor(security);
    if (resolved === null)
        throw new errors_1.NoDefaultPriceTypeError(productTypeOf(security), uuidOf(security));
    return resolved;
}
exports.resolveTradePriceType = resolveTradePriceType;
function productTypeOf(security) {
    const value = security ? security.getProductType() : product_type_pb_1.ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
    for (const [k, v] of Object.entries(product_type_pb_1.ProductTypeProto)) {
        if (v === value)
            return k;
    }
    return String(value);
}
function uuidOf(security) {
    var _a;
    const raw = (_a = security === null || security === void 0 ? void 0 : security.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
//# sourceMappingURL=default_price_types.js.map