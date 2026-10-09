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
import { AssetClassProto } from '../../../fintekkers/models/security/asset_class_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { InstrumentTypeProto } from '../../../fintekkers/models/security/instrument_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
interface AssetClassEntry {
    parent?: string | null;
    label?: string;
    aliases?: string[];
}
/** Parent product_type node (abstract or leaf). null for top-level nodes;
 * null for unknown nodes. */
export declare function parentOf(node: string): string | null;
/** All descendant nodes (transitive) of `ancestor` in the product_type tree.
 * Includes leaves and abstract intermediates beneath `ancestor` but NOT
 * `ancestor` itself. Returns sorted array (empty if `ancestor` is unknown). */
export declare function descendantsOf(ancestor: string): string[];
/** True iff `node` is a strict descendant of `ancestor` (any depth) in the
 * product_type tree. False if either is unknown or they are the same. */
export declare function isDescendantOf(node: string, ancestor: string): boolean;
/** Display label, or null if the node is unknown. */
export declare function labelOf(node: string): string | null;
/** Asset class for a leaf product_type. null for abstract or unknown. */
export declare function assetClassOf(productType: string): string | null;
/** instrument_type for a leaf product_type. null for abstract or unknown. */
export declare function instrumentTypeOf(productType: string): string | null;
export declare function assetClassParentOf(node: string): string | null;
export declare function assetClassDescendantsOf(ancestor: string): string[];
export declare function isAssetClassDescendantOf(node: string, ancestor: string): boolean;
export declare function assetClassLabelOf(node: string): string | null;
/** Normalised code / label / alias -> code. Throws if two codes claim the
 * same key, so an ambiguous label or alias fails at load time. Exported for
 * tests only. */
export declare function buildAssetClassLookup(classes: Record<string, AssetClassEntry>): Map<string, string>;
/** Resolve a stored or user-supplied asset-class value to its hierarchy.json
 * code. An exact code wins; otherwise the value is normalised (trimmed,
 * upper-cased, runs of whitespace or hyphens turned into `_`) and matched
 * against every code, label and alias. null for null, blank or unknown. */
export declare function resolveAssetClass(value: string | null | undefined): string | null;
/** True iff `storedValue` falls under `filterCode`: both resolve (see
 * resolveAssetClass) and the stored code equals the filter code or descends
 * from it. FIXED_INCOME matches RATES, CREDIT and "Fixed Income"; EQUITY
 * does not match RATES; unknown values match nothing. */
export declare function assetClassMatches(filterCode: string | null | undefined, storedValue: string | null | undefined): boolean;
/** Display label for an IdentifierTypeProto value, or null if unknown. */
export declare function identifierTypeLabelOf(v: IdentifierTypeProto): string | null;
/** Input placeholder (e.g. "e.g. US0378331005") for an IdentifierTypeProto
 * value, or null if unknown. */
export declare function identifierTypePlaceholderOf(v: IdentifierTypeProto): string | null;
/** Display label for an InstrumentTypeProto value, or null if unknown. */
export declare function instrumentTypeLabelOf(v: InstrumentTypeProto): string | null;
/** Display label for a ProductTypeProto value: the product_types label, else
 * enum_labels (e.g. PRODUCT_TYPE_UNKNOWN). null if unknown. */
export declare function productTypeLabelOf(v: ProductTypeProto): string | null;
/** Display label for an AssetClassProto value: the label of the hierarchy.json
 * code it resolves to (CASH_ASSET_CLASS -> "Cash"), else enum_labels
 * (e.g. INDEX). null if unknown. */
export declare function assetClassProtoLabelOf(v: AssetClassProto): string | null;
export declare function allProductTypes(): string[];
export declare function activeProductTypes(): string[];
export declare function allAssetClasses(): string[];
export declare function allInstrumentTypes(): string[];
export {};
