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
export declare function allProductTypes(): string[];
export declare function activeProductTypes(): string[];
export declare function allAssetClasses(): string[];
export declare function allInstrumentTypes(): string[];
