"use strict";
/**
 * Multi-language registry helper backed by ledger-models-protos/hierarchy.json.
 *
 * Identical signatures across Java / Rust / Python / JS-TS so consumers can
 * rely on the same query shape regardless of language. M1 of #257.
 *
 * Two trees are exposed:
 *   - product_type — what kind of contract is this. Walked via parentOf,
 *     descendantsOf, isDescendantOf.
 *   - asset_class — what exposure family does it belong to. Same shape via
 *     assetClassParentOf, etc.
 *
 * Plus per-leaf classification lookups: assetClassOf, instrumentTypeOf,
 * labelOf.
 *
 * asset_classes is the one canonical asset-class vocabulary.
 * assetClassMatches filters stored asset-class values (codes, labels such as
 * "Fixed Income", or aliases such as "CASH_ASSET_CLASS") against a code,
 * walking the tree. The *LabelOf / identifierTypePlaceholderOf helpers give
 * display strings for every value of the enums the UI shows. See
 * docs/adr/asset_class_vocabulary.md.
 *
 * `indexTypeOf` is intentionally absent — that dimension is deferred per
 * the M1 descope.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allInstrumentTypes = exports.allAssetClasses = exports.activeProductTypes = exports.allProductTypes = exports.assetClassProtoLabelOf = exports.productTypeLabelOf = exports.instrumentTypeLabelOf = exports.identifierTypePlaceholderOf = exports.identifierTypeLabelOf = exports.assetClassMatches = exports.resolveAssetClass = exports.buildAssetClassLookup = exports.assetClassLabelOf = exports.isAssetClassDescendantOf = exports.assetClassDescendantsOf = exports.assetClassParentOf = exports.instrumentTypeOf = exports.assetClassOf = exports.labelOf = exports.isDescendantOf = exports.descendantsOf = exports.parentOf = void 0;
// hierarchy.json is bundled into the npm package via the package's `files`
// list (see package.json). Bundlers handle this `import` at build time
// (TypeScript's resolveJsonModule is enabled).
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const asset_class_pb_1 = require("../../../fintekkers/models/security/asset_class_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const instrument_type_pb_1 = require("../../../fintekkers/models/security/instrument_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const registry = hierarchy_json_1.default;
function hasOwn(o, key) {
    return o !== undefined && Object.prototype.hasOwnProperty.call(o, key);
}
// ---------- product_type tree ----------
/** Parent product_type node (abstract or leaf). null for top-level nodes;
 * null for unknown nodes. */
function parentOf(node) {
    var _a;
    const entry = registry.product_types[node];
    return (_a = entry === null || entry === void 0 ? void 0 : entry.parent) !== null && _a !== void 0 ? _a : null;
}
exports.parentOf = parentOf;
/** All descendant nodes (transitive) of `ancestor` in the product_type tree.
 * Includes leaves and abstract intermediates beneath `ancestor` but NOT
 * `ancestor` itself. Returns sorted array (empty if `ancestor` is unknown). */
function descendantsOf(ancestor) {
    var _a, _b, _c;
    const out = [];
    for (const [name, entry] of Object.entries(registry.product_types)) {
        let p = (_a = entry.parent) !== null && _a !== void 0 ? _a : null;
        while (p) {
            if (p === ancestor) {
                out.push(name);
                break;
            }
            p = (_c = (_b = registry.product_types[p]) === null || _b === void 0 ? void 0 : _b.parent) !== null && _c !== void 0 ? _c : null;
        }
    }
    return out.sort();
}
exports.descendantsOf = descendantsOf;
/** True iff `node` is a strict descendant of `ancestor` (any depth) in the
 * product_type tree. False if either is unknown or they are the same. */
function isDescendantOf(node, ancestor) {
    var _a, _b, _c;
    if (node === ancestor)
        return false;
    const entry = registry.product_types[node];
    if (!entry)
        return false;
    let p = (_a = entry.parent) !== null && _a !== void 0 ? _a : null;
    while (p) {
        if (p === ancestor)
            return true;
        p = (_c = (_b = registry.product_types[p]) === null || _b === void 0 ? void 0 : _b.parent) !== null && _c !== void 0 ? _c : null;
    }
    return false;
}
exports.isDescendantOf = isDescendantOf;
/** Display label, or null if the node is unknown. */
function labelOf(node) {
    var _a, _b;
    return (_b = (_a = registry.product_types[node]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null;
}
exports.labelOf = labelOf;
/** Asset class for a leaf product_type. null for abstract or unknown. */
function assetClassOf(productType) {
    var _a, _b;
    return (_b = (_a = registry.product_types[productType]) === null || _a === void 0 ? void 0 : _a.asset_class) !== null && _b !== void 0 ? _b : null;
}
exports.assetClassOf = assetClassOf;
/** instrument_type for a leaf product_type. null for abstract or unknown. */
function instrumentTypeOf(productType) {
    var _a, _b;
    return (_b = (_a = registry.product_types[productType]) === null || _a === void 0 ? void 0 : _a.instrument_type) !== null && _b !== void 0 ? _b : null;
}
exports.instrumentTypeOf = instrumentTypeOf;
// ---------- asset_class tree ----------
function assetClassParentOf(node) {
    var _a, _b;
    return (_b = (_a = registry.asset_classes[node]) === null || _a === void 0 ? void 0 : _a.parent) !== null && _b !== void 0 ? _b : null;
}
exports.assetClassParentOf = assetClassParentOf;
function assetClassDescendantsOf(ancestor) {
    var _a, _b, _c;
    const out = [];
    for (const [name, entry] of Object.entries(registry.asset_classes)) {
        let p = (_a = entry.parent) !== null && _a !== void 0 ? _a : null;
        while (p) {
            if (p === ancestor) {
                out.push(name);
                break;
            }
            p = (_c = (_b = registry.asset_classes[p]) === null || _b === void 0 ? void 0 : _b.parent) !== null && _c !== void 0 ? _c : null;
        }
    }
    return out.sort();
}
exports.assetClassDescendantsOf = assetClassDescendantsOf;
function isAssetClassDescendantOf(node, ancestor) {
    var _a, _b, _c;
    if (node === ancestor)
        return false;
    const entry = registry.asset_classes[node];
    if (!entry)
        return false;
    let p = (_a = entry.parent) !== null && _a !== void 0 ? _a : null;
    while (p) {
        if (p === ancestor)
            return true;
        p = (_c = (_b = registry.asset_classes[p]) === null || _b === void 0 ? void 0 : _b.parent) !== null && _c !== void 0 ? _c : null;
    }
    return false;
}
exports.isAssetClassDescendantOf = isAssetClassDescendantOf;
function assetClassLabelOf(node) {
    var _a, _b;
    return (_b = (_a = registry.asset_classes[node]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null;
}
exports.assetClassLabelOf = assetClassLabelOf;
function normaliseAssetClass(value) {
    return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}
/** Normalised code / label / alias -> code. Throws if two codes claim the
 * same key, so an ambiguous label or alias fails at load time. Exported for
 * tests only. */
function buildAssetClassLookup(classes) {
    var _a;
    const lookup = new Map();
    for (const [code, entry] of Object.entries(classes)) {
        const keys = [code, ...(entry.label ? [entry.label] : []), ...((_a = entry.aliases) !== null && _a !== void 0 ? _a : [])];
        for (const key of keys) {
            const n = normaliseAssetClass(key);
            if (!n)
                continue;
            const prev = lookup.get(n);
            if (prev !== undefined && prev !== code) {
                throw new Error(`hierarchy.json asset_classes: '${key}' resolves to both ${prev} and ${code}`);
            }
            lookup.set(n, code);
        }
    }
    return lookup;
}
exports.buildAssetClassLookup = buildAssetClassLookup;
const assetClassLookup = buildAssetClassLookup(registry.asset_classes);
/** Resolve a stored or user-supplied asset-class value to its hierarchy.json
 * code. An exact code wins; otherwise the value is normalised (trimmed,
 * upper-cased, runs of whitespace or hyphens turned into `_`) and matched
 * against every code, label and alias. null for null, blank or unknown. */
function resolveAssetClass(value) {
    var _a;
    if (value === null || value === undefined)
        return null;
    if (hasOwn(registry.asset_classes, value))
        return value;
    return (_a = assetClassLookup.get(normaliseAssetClass(value))) !== null && _a !== void 0 ? _a : null;
}
exports.resolveAssetClass = resolveAssetClass;
/** True iff `storedValue` falls under `filterCode`: both resolve (see
 * resolveAssetClass) and the stored code equals the filter code or descends
 * from it. FIXED_INCOME matches RATES, CREDIT and "Fixed Income"; EQUITY
 * does not match RATES; unknown values match nothing. */
function assetClassMatches(filterCode, storedValue) {
    const f = resolveAssetClass(filterCode);
    const s = resolveAssetClass(storedValue);
    if (f === null || s === null)
        return false;
    return f === s || isAssetClassDescendantOf(s, f);
}
exports.assetClassMatches = assetClassMatches;
// ---------- enum labels ----------
/** Name of numeric enum value `v` in a generated *_pb enum object, or null. */
function enumValueName(enumObj, v) {
    for (const [name, n] of Object.entries(enumObj)) {
        if (n === v)
            return name;
    }
    return null;
}
function enumEntry(enumName, valueName) {
    var _a;
    if (valueName === null)
        return null;
    const values = (_a = registry.enum_labels) === null || _a === void 0 ? void 0 : _a[enumName];
    return values && hasOwn(values, valueName) ? values[valueName] : null;
}
/** Display label for an IdentifierTypeProto value, or null if unknown. */
function identifierTypeLabelOf(v) {
    var _a, _b;
    return (_b = (_a = enumEntry('IdentifierTypeProto', enumValueName(identifier_type_pb_1.IdentifierTypeProto, v))) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null;
}
exports.identifierTypeLabelOf = identifierTypeLabelOf;
/** Input placeholder (e.g. "e.g. US0378331005") for an IdentifierTypeProto
 * value, or null if unknown. */
function identifierTypePlaceholderOf(v) {
    var _a, _b;
    return (_b = (_a = enumEntry('IdentifierTypeProto', enumValueName(identifier_type_pb_1.IdentifierTypeProto, v))) === null || _a === void 0 ? void 0 : _a.placeholder) !== null && _b !== void 0 ? _b : null;
}
exports.identifierTypePlaceholderOf = identifierTypePlaceholderOf;
/** Display label for an InstrumentTypeProto value, or null if unknown. */
function instrumentTypeLabelOf(v) {
    var _a, _b;
    return (_b = (_a = enumEntry('InstrumentTypeProto', enumValueName(instrument_type_pb_1.InstrumentTypeProto, v))) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null;
}
exports.instrumentTypeLabelOf = instrumentTypeLabelOf;
/** Display label for a ProductTypeProto value: the product_types label, else
 * enum_labels (e.g. PRODUCT_TYPE_UNKNOWN). null if unknown. */
function productTypeLabelOf(v) {
    var _a, _b, _c;
    const name = enumValueName(product_type_pb_1.ProductTypeProto, v);
    if (name === null)
        return null;
    const entry = hasOwn(registry.product_types, name) ? registry.product_types[name] : undefined;
    return (_c = (_a = entry === null || entry === void 0 ? void 0 : entry.label) !== null && _a !== void 0 ? _a : (_b = enumEntry('ProductTypeProto', name)) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : null;
}
exports.productTypeLabelOf = productTypeLabelOf;
/** Display label for an AssetClassProto value: the label of the hierarchy.json
 * code it resolves to (CASH_ASSET_CLASS -> "Cash"), else enum_labels
 * (e.g. INDEX). null if unknown. */
function assetClassProtoLabelOf(v) {
    var _a, _b;
    const name = enumValueName(asset_class_pb_1.AssetClassProto, v);
    if (name === null)
        return null;
    const code = resolveAssetClass(name);
    if (code !== null)
        return assetClassLabelOf(code);
    return (_b = (_a = enumEntry('AssetClassProto', name)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : null;
}
exports.assetClassProtoLabelOf = assetClassProtoLabelOf;
// ---------- introspection ----------
function allProductTypes() {
    return Object.keys(registry.product_types).sort();
}
exports.allProductTypes = allProductTypes;
function activeProductTypes() {
    return Object.entries(registry.product_types)
        .filter(([, e]) => e.status === 'active')
        .map(([k]) => k)
        .sort();
}
exports.activeProductTypes = activeProductTypes;
function allAssetClasses() {
    return Object.keys(registry.asset_classes).sort();
}
exports.allAssetClasses = allAssetClasses;
function allInstrumentTypes() {
    return [...registry.instrument_types];
}
exports.allInstrumentTypes = allInstrumentTypes;
//# sourceMappingURL=product_hierarchy.js.map