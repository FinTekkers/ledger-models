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
import hierarchy from '../../../../hierarchy.json';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { NoDefaultPriceTypeError } from '../errors';
import { UUID } from '../utils/uuid';
import { allProductTypes, parentOf } from './product_hierarchy';

const SECTION = 'default_price_types';
const UNKNOWN = 'UNKNOWN_PRICE_TYPE';

function hasOwn(o: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

function bad(detail: string): Error {
  return new Error(`hierarchy.json ${SECTION}: ${detail}`);
}

/** A parsed, checked default_price_types section: node -> PriceTypeProto value. */
export class DefaultPriceTypes {
  /** node -> type, as written in the section. Read-only. */
  readonly entries: ReadonlyMap<string, PriceTypeProto>;

  constructor(entries: Map<string, PriceTypeProto>) {
    const frozen = new Map(entries);
    const readOnly = (): never => { throw new TypeError('DefaultPriceTypes entries are read-only'); };
    frozen.set = readOnly;
    frozen.delete = readOnly;
    frozen.clear = readOnly;
    this.entries = frozen;
  }

  /** The deepest entry on productType's parent chain, or null. */
  defaultFor(productType: string): PriceTypeProto | null {
    for (let node: string | null = productType; node !== null; node = parentOf(node)) {
      const type = this.entries.get(node);
      if (type !== undefined) return type;
    }
    return null;
  }
}

/**
 * Parses and checks a default_price_types section against the shipped
 * product_types tree and the PriceTypeProto names. Throws when the section is
 * missing (undefined) or not an object, a key is not a product_types node, or
 * a value is not a PriceTypeProto name or is UNKNOWN_PRICE_TYPE. Exported for tests.
 */
export function parseDefaultPriceTypes(section: unknown): DefaultPriceTypes {
  if (section === undefined) throw bad('section missing from hierarchy.json');
  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    throw bad('section must be an object');
  }
  const productTypes = new Set(allProductTypes());
  const entries = new Map<string, PriceTypeProto>();
  for (const [node, name] of Object.entries(section as Record<string, unknown>)) {
    if (!productTypes.has(node)) throw bad(`node '${node}' is not in product_types`);
    if (typeof name !== 'string' || !hasOwn(PriceTypeProto, name)) {
      throw bad(`value ${JSON.stringify(name)} for node ${node} is not a PriceTypeProto name`);
    }
    if (name === UNKNOWN) throw bad(`node ${node} must not default to ${UNKNOWN}`);
    entries.set(node, (PriceTypeProto as unknown as Record<string, PriceTypeProto>)[name]);
  }
  return new DefaultPriceTypes(entries);
}

let shipped: DefaultPriceTypes | undefined;

/** The shipped default_price_types section, parsed and checked on first use. */
export function shippedDefaultPriceTypes(): DefaultPriceTypes {
  if (!shipped) {
    const root = hierarchy as Record<string, unknown>;
    shipped = parseDefaultPriceTypes(hasOwn(root, SECTION) ? root[SECTION] : undefined);
  }
  return shipped;
}

/**
 * The table default for the security's product_type, or null when it has
 * none. A missing security reads as PRODUCT_TYPE_UNKNOWN.
 */
export function defaultPriceTypeFor(security: SecurityProto | null | undefined): PriceTypeProto | null {
  return shippedDefaultPriceTypes().defaultFor(productTypeOf(security));
}

/**
 * The price_type to put on a trade price for this security. An explicit
 * priceType other than UNKNOWN_PRICE_TYPE is returned unchanged; otherwise the
 * table default. Throws NoDefaultPriceTypeError naming the product when there
 * is neither.
 */
export function resolveTradePriceType(
  security: SecurityProto | null | undefined,
  priceType?: PriceTypeProto | null,
): PriceTypeProto {
  if (priceType !== undefined && priceType !== null && priceType !== PriceTypeProto.UNKNOWN_PRICE_TYPE) {
    return priceType;
  }
  const resolved = defaultPriceTypeFor(security);
  if (resolved === null) throw new NoDefaultPriceTypeError(productTypeOf(security), uuidOf(security));
  return resolved;
}

function productTypeOf(security: SecurityProto | null | undefined): string {
  const value = security ? security.getProductType() : ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
  for (const [k, v] of Object.entries(ProductTypeProto)) {
    if (v === value) return k;
  }
  return String(value);
}

function uuidOf(security: SecurityProto | null | undefined): UUID | undefined {
  const raw = security?.getUuid()?.getRawUuid_asU8();
  return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}
