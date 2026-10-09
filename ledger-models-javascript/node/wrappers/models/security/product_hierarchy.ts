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

// hierarchy.json is bundled into the npm package via the package's `files`
// list (see package.json). Bundlers handle this `import` at build time
// (TypeScript's resolveJsonModule is enabled).
import hierarchy from '../../../../hierarchy.json';
import { AssetClassProto } from '../../../fintekkers/models/security/asset_class_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { InstrumentTypeProto } from '../../../fintekkers/models/security/instrument_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';

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
  aliases?: string[];
}

interface EnumLabelEntry {
  label?: string;
  placeholder?: string;
}

interface Registry {
  product_types: Record<string, ProductTypeEntry>;
  asset_classes: Record<string, AssetClassEntry>;
  instrument_types: string[];
  enum_labels?: Record<string, Record<string, EnumLabelEntry>>;
}

const registry: Registry = hierarchy as Registry;

function hasOwn(o: object | undefined, key: string): boolean {
  return o !== undefined && Object.prototype.hasOwnProperty.call(o, key);
}

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

function normaliseAssetClass(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

/** Normalised code / label / alias -> code. Throws if two codes claim the
 * same key, so an ambiguous label or alias fails at load time. Exported for
 * tests only. */
export function buildAssetClassLookup(
  classes: Record<string, AssetClassEntry>,
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [code, entry] of Object.entries(classes)) {
    const keys = [code, ...(entry.label ? [entry.label] : []), ...(entry.aliases ?? [])];
    for (const key of keys) {
      const n = normaliseAssetClass(key);
      if (!n) continue;
      const prev = lookup.get(n);
      if (prev !== undefined && prev !== code) {
        throw new Error(
          `hierarchy.json asset_classes: '${key}' resolves to both ${prev} and ${code}`,
        );
      }
      lookup.set(n, code);
    }
  }
  return lookup;
}

const assetClassLookup = buildAssetClassLookup(registry.asset_classes);

/** Resolve a stored or user-supplied asset-class value to its hierarchy.json
 * code. An exact code wins; otherwise the value is normalised (trimmed,
 * upper-cased, runs of whitespace or hyphens turned into `_`) and matched
 * against every code, label and alias. null for null, blank or unknown. */
export function resolveAssetClass(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (hasOwn(registry.asset_classes, value)) return value;
  return assetClassLookup.get(normaliseAssetClass(value)) ?? null;
}

/** True iff `storedValue` falls under `filterCode`: both resolve (see
 * resolveAssetClass) and the stored code equals the filter code or descends
 * from it. FIXED_INCOME matches RATES, CREDIT and "Fixed Income"; EQUITY
 * does not match RATES; unknown values match nothing. */
export function assetClassMatches(
  filterCode: string | null | undefined,
  storedValue: string | null | undefined,
): boolean {
  const f = resolveAssetClass(filterCode);
  const s = resolveAssetClass(storedValue);
  if (f === null || s === null) return false;
  return f === s || isAssetClassDescendantOf(s, f);
}

// ---------- enum labels ----------

/** Name of numeric enum value `v` in a generated *_pb enum object, or null. */
function enumValueName(enumObj: object, v: number): string | null {
  for (const [name, n] of Object.entries(enumObj)) {
    if (n === v) return name;
  }
  return null;
}

function enumEntry(enumName: string, valueName: string | null): EnumLabelEntry | null {
  if (valueName === null) return null;
  const values = registry.enum_labels?.[enumName];
  return values && hasOwn(values, valueName) ? values[valueName] : null;
}

/** Display label for an IdentifierTypeProto value, or null if unknown. */
export function identifierTypeLabelOf(v: IdentifierTypeProto): string | null {
  return enumEntry('IdentifierTypeProto', enumValueName(IdentifierTypeProto, v))?.label ?? null;
}

/** Input placeholder (e.g. "e.g. US0378331005") for an IdentifierTypeProto
 * value, or null if unknown. */
export function identifierTypePlaceholderOf(v: IdentifierTypeProto): string | null {
  return enumEntry('IdentifierTypeProto', enumValueName(IdentifierTypeProto, v))?.placeholder ?? null;
}

/** Display label for an InstrumentTypeProto value, or null if unknown. */
export function instrumentTypeLabelOf(v: InstrumentTypeProto): string | null {
  return enumEntry('InstrumentTypeProto', enumValueName(InstrumentTypeProto, v))?.label ?? null;
}

/** Display label for a ProductTypeProto value: the product_types label, else
 * enum_labels (e.g. PRODUCT_TYPE_UNKNOWN). null if unknown. */
export function productTypeLabelOf(v: ProductTypeProto): string | null {
  const name = enumValueName(ProductTypeProto, v);
  if (name === null) return null;
  const entry = hasOwn(registry.product_types, name) ? registry.product_types[name] : undefined;
  return entry?.label ?? enumEntry('ProductTypeProto', name)?.label ?? null;
}

/** Display label for an AssetClassProto value: the label of the hierarchy.json
 * code it resolves to (CASH_ASSET_CLASS -> "Cash"), else enum_labels
 * (e.g. INDEX). null if unknown. */
export function assetClassProtoLabelOf(v: AssetClassProto): string | null {
  const name = enumValueName(AssetClassProto, v);
  if (name === null) return null;
  const code = resolveAssetClass(name);
  if (code !== null) return assetClassLabelOf(code);
  return enumEntry('AssetClassProto', name)?.label ?? null;
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
