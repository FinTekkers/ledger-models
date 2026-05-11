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
 * `indexTypeOf` is intentionally absent — that dimension is deferred per
 * the M1 descope.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allInstrumentTypes = exports.allAssetClasses = exports.activeProductTypes = exports.allProductTypes = exports.assetClassLabelOf = exports.isAssetClassDescendantOf = exports.assetClassDescendantsOf = exports.assetClassParentOf = exports.instrumentTypeOf = exports.assetClassOf = exports.labelOf = exports.isDescendantOf = exports.descendantsOf = exports.parentOf = void 0;
// hierarchy.json is bundled into the npm package via the package's `files`
// list (see package.json). Bundlers handle this `import` at build time
// (TypeScript's resolveJsonModule is enabled).
const hierarchy_json_1 = __importDefault(require("../../../../hierarchy.json"));
const registry = hierarchy_json_1.default;
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