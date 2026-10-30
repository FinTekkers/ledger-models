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
 */

import hierarchy from '../../../../hierarchy.json';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { UnmappedProductTypeError } from '../errors';
import { allProductTypes, descendantsOf, parentOf } from './product_hierarchy';

/** The closed requires vocabulary: market data an arm needs beyond the price. */
export type MarketDataKind = 'CPI_U' | 'FRN_FIXINGS' | 'FRN_CURVE';

const MARKET_DATA_KINDS: ReadonlyArray<string> = ['CPI_U', 'FRN_FIXINGS', 'FRN_CURVE'];

/** Map key for a node's entry with no coupon_types. */
const ANY_COUPON = '';

interface Arm {
  arm: string;
  requires: ReadonlyArray<MarketDataKind>;
}

function hasOwn(o: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

function enumName(e: object, value: number): string {
  for (const [k, v] of Object.entries(e)) {
    if (v === value) return k;
  }
  return String(value);
}

/** A parsed, checked valuation_arms section. */
export class ValuationArms {
  /** @param entries node -> coupon type name (or '' for the plain entry) -> arm */
  constructor(
    private readonly entries: Map<string, Map<string, Arm>>,
    private readonly unpriced: ReadonlySet<string>,
  ) {}

  /** The deepest matching node's arm, or null when unmapped or unpriced. */
  resolve(productType: string, couponType: string): Arm | null {
    for (let node: string | null = productType; node !== null; node = parentOf(node)) {
      const byCoupon = this.entries.get(node);
      const arm = byCoupon?.get(couponType) ?? byCoupon?.get(ANY_COUPON);
      if (arm) return arm;
      if (this.unpriced.has(node)) return null;
    }
    return null;
  }

  require(productType: string, couponType: string): Arm {
    const arm = this.resolve(productType, couponType);
    if (!arm) throw new UnmappedProductTypeError(productType, couponType);
    return arm;
  }

  /** Leaf product types (active and planned) with neither an entry nor an unpriced listing. */
  uncoveredLeaves(): string[] {
    return allProductTypes().filter(n => descendantsOf(n).length === 0 && !this.covers(n));
  }

  private covers(productType: string): boolean {
    for (let node: string | null = productType; node !== null; node = parentOf(node)) {
      if (this.entries.has(node) || this.unpriced.has(node)) return true;
    }
    return false;
  }
}

function bad(detail: string): Error {
  return new Error(`hierarchy.json valuation_arms: ${detail}`);
}

function stringOf(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== 'string') throw bad(`'${key}' must be a string in ${JSON.stringify(body)}`);
  return v;
}

function stringsOf(body: Record<string, unknown>, key: string): string[] {
  const v = body[key];
  if (!Array.isArray(v) || !v.every(x => typeof x === 'string')) {
    throw bad(`'${key}' must be a list of strings in ${JSON.stringify(body)}`);
  }
  return v as string[];
}

/**
 * Parses and checks a valuation_arms section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
export function parseValuationArms(section: unknown): ValuationArms {
  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    throw bad('section must be an object');
  }
  const s = section as Record<string, unknown>;
  const productTypes = new Set(allProductTypes());
  const arms = new Set(Object.keys(ProductInput.InputCase)
    .filter(k => k !== 'INPUT_NOT_SET')
    .map(k => k.toLowerCase()));

  if (!Array.isArray(s.entries)) throw bad("'entries' must be a list");
  const entries = new Map<string, Map<string, Arm>>();
  for (const raw of s.entries as unknown[]) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw bad(`entry must be an object, got ${JSON.stringify(raw)}`);
    }
    const body = raw as Record<string, unknown>;
    const node = stringOf(body, 'node');
    if (!productTypes.has(node)) throw bad(`node '${node}' is not in product_types`);
    const arm = stringOf(body, 'arm');
    if (!arms.has(arm)) throw bad(`arm '${arm}' is not a ProductInput.input field`);
    const requires = stringsOf(body, 'requires').map(r => {
      if (!MARKET_DATA_KINDS.includes(r)) {
        throw bad(`requires value '${r}' is not one of CPI_U, FRN_FIXINGS, FRN_CURVE`);
      }
      return r as MarketDataKind;
    });
    let coupons = [ANY_COUPON];
    if (hasOwn(body, 'coupon_types')) {
      coupons = stringsOf(body, 'coupon_types');
      for (const c of coupons) {
        if (!hasOwn(CouponTypeProto, c)) throw bad(`coupon_types value '${c}' is not a CouponTypeProto name`);
      }
    }
    let byCoupon = entries.get(node);
    if (!byCoupon) {
      byCoupon = new Map();
      entries.set(node, byCoupon);
    }
    const value: Arm = Object.freeze({ arm, requires: Object.freeze(requires) });
    for (const c of coupons) {
      if (byCoupon.has(c)) throw bad(`duplicate entry for node ${node}${c ? `, coupon_type ${c}` : ''}`);
      byCoupon.set(c, value);
    }
  }

  const unpriced = new Set<string>();
  for (const node of stringsOf(s, 'unpriced')) {
    if (!productTypes.has(node)) throw bad(`node '${node}' is not in product_types`);
    if (entries.has(node)) throw bad(`node ${node} is both mapped and unpriced`);
    unpriced.add(node);
  }
  return new ValuationArms(entries, unpriced);
}

let shippedArms: ValuationArms | undefined;

/** The shipped valuation_arms section, parsed and checked on first use. Exported for tests. */
export function shippedValuationArms(): ValuationArms {
  if (!shippedArms) {
    const section = (hierarchy as Record<string, unknown>).valuation_arms;
    if (section === undefined) throw bad('section missing from hierarchy.json');
    shippedArms = parseValuationArms(section);
  }
  return shippedArms;
}

function productTypeOf(security: SecurityProto): string {
  return enumName(ProductTypeProto, security.getProductType());
}

/** Read from the proto field only; unset bond_details reads as UNKNOWN_COUPON_TYPE. */
function couponTypeOf(security: SecurityProto): string {
  const details = security.getBondDetails();
  return details ? enumName(CouponTypeProto, details.getCouponType()) : 'UNKNOWN_COUPON_TYPE';
}

/** Name of the ProductInput.input oneof field that values `security`, e.g. 'tips'. */
export function armFor(security: SecurityProto): string {
  return shippedValuationArms().require(productTypeOf(security), couponTypeOf(security)).arm;
}

/** Market data the security's arm needs, in file order. A fresh array; empty when none. */
export function requiredMarketData(security: SecurityProto): MarketDataKind[] {
  return [...shippedValuationArms().require(productTypeOf(security), couponTypeOf(security)).requires];
}
