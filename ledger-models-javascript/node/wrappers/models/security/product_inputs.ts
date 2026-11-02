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

import hierarchy from '../../../../hierarchy.json';
import catalog from '../../../../catalog/measures.json';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import {
  BondInput, CashInput, EquityInput, FrnInput, InflationIndexInput, MbsInput, ProductInput,
  ReferenceRateFixingProto, TipsInput, YieldCurveInput,
} from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { MissingMarketDataError, ModelValidationError, UnmappedProductTypeError, violation } from '../errors';
import { UUID } from '../utils/uuid';
import { allProductTypes, descendantsOf, parentOf } from './product_hierarchy';

/** The closed requires vocabulary: market data an input type needs beyond the price. */
export type MarketDataKind = 'CPI_U' | 'FRN_FIXINGS' | 'FRN_CURVE';

const MARKET_DATA_KINDS: ReadonlyArray<string> = ['CPI_U', 'FRN_FIXINGS', 'FRN_CURVE'];

/** Map key for a node's entry with no coupon_types. */
const ANY_COUPON = '';

const SECTION = 'valuation_input_types';
const ENTRY_KEY = 'input_type';
/** Legacy names, still read for one release (LM-418). */
const LEGACY_SECTION = 'valuation_arms';
const LEGACY_ENTRY_KEY = 'arm';

interface InputTypeEntry {
  readonly inputType: string;
  /** @deprecated Use inputType. Removed in a later release (LM-418). */
  readonly arm: string;
  readonly requires: ReadonlyArray<MarketDataKind>;
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

/** A parsed, checked valuation_input_types section. */
export class ValuationInputTypes {
  /** @param entries node -> coupon type name (or '' for the plain entry) -> input type */
  constructor(
    private readonly entries: Map<string, Map<string, InputTypeEntry>>,
    private readonly unpriced: ReadonlySet<string>,
  ) {}

  /** The deepest matching node's input type, or null when unmapped or unpriced. */
  resolve(productType: string, couponType: string): InputTypeEntry | null {
    for (let node: string | null = productType; node !== null; node = parentOf(node)) {
      const byCoupon = this.entries.get(node);
      const entry = byCoupon?.get(couponType) ?? byCoupon?.get(ANY_COUPON);
      if (entry) return entry;
      if (this.unpriced.has(node)) return null;
    }
    return null;
  }

  require(productType: string, couponType: string): InputTypeEntry {
    const entry = this.resolve(productType, couponType);
    if (!entry) throw new UnmappedProductTypeError(productType, couponType);
    return entry;
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
  return new Error(`hierarchy.json ${SECTION}: ${detail}`);
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
 * Parses and checks a valuation_input_types section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
export function parseValuationInputTypes(section: unknown): ValuationInputTypes {
  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    throw bad('section must be an object');
  }
  const s = section as Record<string, unknown>;
  const productTypes = new Set(allProductTypes());
  const inputTypes = new Set(Object.keys(ProductInput.InputCase)
    .filter(k => k !== 'INPUT_NOT_SET')
    .map(k => k.toLowerCase()));

  if (!Array.isArray(s.entries)) throw bad("'entries' must be a list");
  const entries = new Map<string, Map<string, InputTypeEntry>>();
  for (const raw of s.entries as unknown[]) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw bad(`entry must be an object, got ${JSON.stringify(raw)}`);
    }
    const body = raw as Record<string, unknown>;
    const node = stringOf(body, 'node');
    if (!productTypes.has(node)) throw bad(`node '${node}' is not in product_types`);
    const inputType = stringOf(body, inputTypeKey(body));
    if (!inputTypes.has(inputType)) throw bad(`input_type '${inputType}' is not a ProductInput.input field`);
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
    const value: InputTypeEntry = Object.freeze({
      inputType,
      get arm(): string { return inputType; },
      requires: Object.freeze(requires),
    });
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
  return new ValuationInputTypes(entries, unpriced);
}

/**
 * The key that names an entry's input type: input_type, or for one release
 * the legacy arm (LM-418). An entry with both throws.
 */
function inputTypeKey(body: Record<string, unknown>): string {
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
export function valuationInputTypesFromHierarchy(root: unknown): ValuationInputTypes {
  if (typeof root !== 'object' || root === null || Array.isArray(root)) {
    throw bad('hierarchy.json root must be an object');
  }
  const current = hasOwn(root, SECTION);
  const legacy = hasOwn(root, LEGACY_SECTION);
  if (current && legacy) throw bad(`both ${SECTION} and ${LEGACY_SECTION} present`);
  if (!current && !legacy) throw bad('section missing from hierarchy.json');
  return parseValuationInputTypes((root as Record<string, unknown>)[current ? SECTION : LEGACY_SECTION]);
}

let shippedInputTypes: ValuationInputTypes | undefined;

/** The shipped valuation_input_types section, parsed and checked on first use. Exported for tests. */
export function shippedValuationInputTypes(): ValuationInputTypes {
  if (!shippedInputTypes) shippedInputTypes = valuationInputTypesFromHierarchy(hierarchy);
  return shippedInputTypes;
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
export function inputTypeFor(security: SecurityProto): string {
  return shippedValuationInputTypes().require(productTypeOf(security), couponTypeOf(security)).inputType;
}

/** @deprecated Use inputTypeFor. Removed in a later release (LM-418). */
export function armFor(security: SecurityProto): string {
  return inputTypeFor(security);
}

/** Market data the security's input type needs, in file order. A fresh array; empty when none. */
export function requiredMarketData(security: SecurityProto): MarketDataKind[] {
  return [...shippedValuationInputTypes().require(productTypeOf(security), couponTypeOf(security)).requires];
}

/**
 * The measures valuation-service computes for `inputType` (e.g. 'frn'), in catalog
 * order: entries of the bundled catalog/measures.json with computed_by
 * valuation-service and implemented true whose applies_to names a leaf product
 * type the input type values, or an ancestor of one. Throws
 * UnmappedProductTypeError(inputType, 'UNKNOWN_COUPON_TYPE') when no leaf maps
 * to `inputType`. A fresh array.
 */
export function measuresForInputType(inputType: string): MeasureProto[] {
  return measuresForInputTypeIn(catalog.measures, inputType);
}

/** @deprecated Use measuresForInputType. Removed in a later release (LM-418). */
export function measuresForArm(arm: string): MeasureProto[] {
  return measuresForInputType(arm);
}

/**
 * measuresForInputType over a given `measures` list. Exported for tests.
 * @internal
 */
export function measuresForInputTypeIn(measures: ReadonlyArray<unknown>, inputType: string): MeasureProto[] {
  const inputTypes = shippedValuationInputTypes();
  const lineage = new Set<string>();
  for (const leaf of allProductTypes()) {
    if (descendantsOf(leaf).length > 0 || !hasOwn(ProductTypeProto, leaf)) continue;
    // Leaves resolve with no coupon type, as inputTypeFor does with no bond_details:
    // the BOND + FLOAT entry is ignored on purpose (docs/adr/valuation_input_types.md).
    if (inputTypes.resolve(leaf, 'UNKNOWN_COUPON_TYPE')?.inputType !== inputType) continue;
    for (let node: string | null = leaf; node !== null; node = parentOf(node)) lineage.add(node);
  }
  if (lineage.size === 0) throw new UnmappedProductTypeError(inputType, 'UNKNOWN_COUPON_TYPE');
  const out: MeasureProto[] = [];
  for (const raw of measures) {
    const m = raw as Record<string, unknown>;
    if (m.computed_by !== 'valuation-service' || m.implemented !== true) continue;
    if (!Array.isArray(m.applies_to)) {
      throw new Error(`catalog/measures.json: 'applies_to' must be a list in ${JSON.stringify(m)}`);
    }
    if (!m.applies_to.some(n => typeof n === 'string' && lineage.has(n))) continue;
    const name = m.name;
    if (typeof name !== 'string' || !hasOwn(MeasureProto, name)) {
      throw new Error(`catalog/measures.json: '${String(name)}' is not a MeasureProto name`);
    }
    const measure = (MeasureProto as unknown as Record<string, MeasureProto>)[name];
    if (!out.includes(measure)) out.push(measure);
  }
  return out;
}

/**
 * @deprecated Use measuresForInputTypeIn. Removed in a later release (LM-418).
 * @internal
 */
export function measuresForArmIn(measures: ReadonlyArray<unknown>, arm: string): MeasureProto[] {
  return measuresForInputTypeIn(measures, arm);
}

/** @deprecated Use ValuationInputTypes. Removed in a later release (LM-418). */
export const ValuationArms = ValuationInputTypes;
/** @deprecated Use ValuationInputTypes. Removed in a later release (LM-418). */
export type ValuationArms = ValuationInputTypes;

/** @deprecated Use parseValuationInputTypes. Removed in a later release (LM-418). */
export function parseValuationArms(section: unknown): ValuationInputTypes {
  return parseValuationInputTypes(section);
}

/** @deprecated Use shippedValuationInputTypes. Removed in a later release (LM-418). */
export function shippedValuationArms(): ValuationInputTypes {
  return shippedValuationInputTypes();
}

/**
 * Market data for forSecurity, one field per MarketDataKind: CPI_U is `cpi`,
 * FRN_FIXINGS is `fixings`, FRN_CURVE is `curve`. Each is copied to the input type
 * field of the same name (TipsInput.cpi, FrnInput.fixings, FrnInput.curve)
 * when the input type has one; the others are ignored.
 */
export interface MarketData {
  cpi?: InflationIndexInput;
  fixings?: ReferenceRateFixingProto[];
  curve?: YieldCurveInput;
}

/**
 * The ProductInput for `security`, in the input type inputTypeFor picks.
 *
 * Sets the input type's security and copies price.price as is into clean_price
 * (bond, tips, frn, mbs) or unit_price (equity, cash). Never sets
 * cost_basis. Throws UnmappedProductTypeError when the type has no input type and
 * MissingMarketDataError when `marketData` lacks a kind the input type requires.
 * The caller's protos are set as they are, not copied or stamped (LM-322).
 */
export function forSecurity(security: SecurityProto, price: PriceProto, marketData?: MarketData | null): ProductInput {
  const md = marketData ?? {};
  const inputType = inputTypeFor(security);
  const p = price.getPrice();
  const out = new ProductInput();
  switch (inputType) {
    case 'bond':
      out.setBond(new BondInput().setSecurity(security).setCleanPrice(p));
      break;
    case 'tips':
      out.setTips(new TipsInput().setSecurity(security).setCleanPrice(p).setCpi(md.cpi));
      break;
    case 'frn':
      out.setFrn(new FrnInput().setSecurity(security).setCleanPrice(p).setCurve(md.curve)
        .setFixingsList([...(md.fixings ?? [])]));
      break;
    case 'mbs':
      out.setMbs(new MbsInput().setSecurity(security).setCleanPrice(p));
      break;
    case 'equity':
      out.setEquity(new EquityInput().setSecurity(security).setUnitPrice(p));
      break;
    case 'cash':
      out.setCash(new CashInput().setSecurity(security).setUnitPrice(p));
      break;
    default:
      throw new Error(`forSecurity has no builder for input type ${inputType}`);
  }
  checkProductInput(out);
  return out;
}

/**
 * Checks `productInput` is the input type inputTypeFor picks for its security, and holds
 * every market-data kind that input type requires. Throws ModelValidationError (no
 * input type, or the wrong input type), UnmappedProductTypeError or MissingMarketDataError.
 */
export function checkProductInput(productInput: ProductInput): void {
  const [inputType, body] = inputTypeOf(productInput);
  if (!body) throw new ModelValidationError([violation('product_input', undefined, 'no ProductInput input type is set')]);
  const security = body.getSecurity() ?? new SecurityProto();
  const productType = productTypeOf(security);
  const resolved = shippedValuationInputTypes().require(productType, couponTypeOf(security));
  if (resolved.inputType !== inputType) {
    throw new ModelValidationError([violation(`product_input.${inputType}`, uuidOf(security),
      `input type ${inputType} does not match input type ${resolved.inputType} for product_type ${productType}`)]);
  }
  for (const kind of resolved.requires) {
    if (!has(productInput, kind)) throw new MissingMarketDataError(inputType, kind, `${inputType}.${FIELD_OF[kind]}`, uuidOf(security));
  }
}

/** The set input type's name and message, or [undefined, undefined] when none is set. */
function inputTypeOf(input: ProductInput): [string, { getSecurity(): SecurityProto | undefined }] | [undefined, undefined] {
  switch (input.getInputCase()) {
    case ProductInput.InputCase.BOND: return ['bond', input.getBond()!];
    case ProductInput.InputCase.TIPS: return ['tips', input.getTips()!];
    case ProductInput.InputCase.FRN: return ['frn', input.getFrn()!];
    case ProductInput.InputCase.MBS: return ['mbs', input.getMbs()!];
    case ProductInput.InputCase.EQUITY: return ['equity', input.getEquity()!];
    case ProductInput.InputCase.CASH: return ['cash', input.getCash()!];
    default: return [undefined, undefined];
  }
}

/** The ProductInput input type field (and MarketData field) that holds each kind. */
const FIELD_OF: Readonly<Record<MarketDataKind, string>> = { CPI_U: 'cpi', FRN_FIXINGS: 'fixings', FRN_CURVE: 'curve' };

/** Whether `input` holds `kind`. A cpi with neither readings nor reference_cpi does not count. */
function has(input: ProductInput, kind: MarketDataKind): boolean {
  switch (kind) {
    case 'CPI_U': {
      const cpi = input.getTips()?.getCpi();
      return cpi !== undefined && cpi.getCpiCase() !== InflationIndexInput.CpiCase.CPI_NOT_SET;
    }
    case 'FRN_FIXINGS': return (input.getFrn()?.getFixingsList().length ?? 0) > 0;
    case 'FRN_CURVE': return input.getFrn()?.hasCurve() ?? false;
  }
}

function uuidOf(security: SecurityProto): UUID | undefined {
  const raw = security.getUuid()?.getRawUuid_asU8();
  return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}
