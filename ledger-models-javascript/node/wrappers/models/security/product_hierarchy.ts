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

// hierarchy.json is bundled into the npm package via the package's `files`
// list (see package.json). Bundlers handle this `import` at build time
// (TypeScript's resolveJsonModule is enabled).
import hierarchy from '../../../../hierarchy.json';

interface ProductTypeEntry {
  parent?: string | null;
  abstract?: boolean;
  asset_class?: string;
  instrument_type?: string;
  label?: string;
  status?: string;
}

interface AssetClassEntry {
  parent?: string | null;
  label?: string;
}

interface Registry {
  product_types: Record<string, ProductTypeEntry>;
  asset_classes: Record<string, AssetClassEntry>;
  instrument_types: string[];
}

const registry: Registry = hierarchy as Registry;

// ---------- product_type tree ----------

/** Parent product_type node (abstract or leaf). null for top-level nodes;
 * null for unknown nodes. */
export function parentOf(node: string): string | null {
  const entry = registry.product_types[node];
  return entry?.parent ?? null;
}

/** All descendant nodes (transitive) of `ancestor` in the product_type tree.
 * Includes leaves and abstract intermediates beneath `ancestor` but NOT
 * `ancestor` itself. Returns sorted array (empty if `ancestor` is unknown). */
export function descendantsOf(ancestor: string): string[] {
  const out: string[] = [];
  for (const [name, entry] of Object.entries(registry.product_types)) {
    let p = entry.parent ?? null;
    while (p) {
      if (p === ancestor) {
        out.push(name);
        break;
      }
      p = registry.product_types[p]?.parent ?? null;
    }
  }
  return out.sort();
}

/** True iff `node` is a strict descendant of `ancestor` (any depth) in the
 * product_type tree. False if either is unknown or they are the same. */
export function isDescendantOf(node: string, ancestor: string): boolean {
  if (node === ancestor) return false;
  const entry = registry.product_types[node];
  if (!entry) return false;
  let p = entry.parent ?? null;
  while (p) {
    if (p === ancestor) return true;
    p = registry.product_types[p]?.parent ?? null;
  }
  return false;
}

/** Display label, or null if the node is unknown. */
export function labelOf(node: string): string | null {
  return registry.product_types[node]?.label ?? null;
}

/** Asset class for a leaf product_type. null for abstract or unknown. */
export function assetClassOf(productType: string): string | null {
  return registry.product_types[productType]?.asset_class ?? null;
}

/** instrument_type for a leaf product_type. null for abstract or unknown. */
export function instrumentTypeOf(productType: string): string | null {
  return registry.product_types[productType]?.instrument_type ?? null;
}

// ---------- asset_class tree ----------

export function assetClassParentOf(node: string): string | null {
  return registry.asset_classes[node]?.parent ?? null;
}

export function assetClassDescendantsOf(ancestor: string): string[] {
  const out: string[] = [];
  for (const [name, entry] of Object.entries(registry.asset_classes)) {
    let p = entry.parent ?? null;
    while (p) {
      if (p === ancestor) {
        out.push(name);
        break;
      }
      p = registry.asset_classes[p]?.parent ?? null;
    }
  }
  return out.sort();
}

export function isAssetClassDescendantOf(node: string, ancestor: string): boolean {
  if (node === ancestor) return false;
  const entry = registry.asset_classes[node];
  if (!entry) return false;
  let p = entry.parent ?? null;
  while (p) {
    if (p === ancestor) return true;
    p = registry.asset_classes[p]?.parent ?? null;
  }
  return false;
}

export function assetClassLabelOf(node: string): string | null {
  return registry.asset_classes[node]?.label ?? null;
}

// ---------- introspection ----------

export function allProductTypes(): string[] {
  return Object.keys(registry.product_types).sort();
}

export function activeProductTypes(): string[] {
  return Object.entries(registry.product_types)
    .filter(([, e]) => e.status === 'active')
    .map(([k]) => k)
    .sort();
}

export function allAssetClasses(): string[] {
  return Object.keys(registry.asset_classes).sort();
}

export function allInstrumentTypes(): string[] {
  return [...registry.instrument_types];
}
