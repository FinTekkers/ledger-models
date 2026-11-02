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
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { InflationIndexInput, ProductInput, ReferenceRateFixingProto, YieldCurveInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
/** The closed requires vocabulary: market data an input type needs beyond the price. */
export type MarketDataKind = 'CPI_U' | 'FRN_FIXINGS' | 'FRN_CURVE';
interface InputTypeEntry {
    readonly inputType: string;
    /** @deprecated Use inputType. Removed in a later release (LM-418). */
    readonly arm: string;
    readonly requires: ReadonlyArray<MarketDataKind>;
}
/** A parsed, checked valuation_input_types section. */
export declare class ValuationInputTypes {
    private readonly entries;
    private readonly unpriced;
    /** @param entries node -> coupon type name (or '' for the plain entry) -> input type */
    constructor(entries: Map<string, Map<string, InputTypeEntry>>, unpriced: ReadonlySet<string>);
    /** The deepest matching node's input type, or null when unmapped or unpriced. */
    resolve(productType: string, couponType: string): InputTypeEntry | null;
    require(productType: string, couponType: string): InputTypeEntry;
    /** Leaf product types (active and planned) with neither an entry nor an unpriced listing. */
    uncoveredLeaves(): string[];
    private covers;
}
/**
 * Parses and checks a valuation_input_types section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
export declare function parseValuationInputTypes(section: unknown): ValuationInputTypes;
/**
 * Parses and checks the valuation_input_types section of a whole
 * hierarchy.json `root`. For one release a root with the legacy
 * valuation_arms key instead loads the same way (LM-418); a root with both
 * keys, or neither, throws. Exported for tests.
 */
export declare function valuationInputTypesFromHierarchy(root: unknown): ValuationInputTypes;
/** The shipped valuation_input_types section, parsed and checked on first use. Exported for tests. */
export declare function shippedValuationInputTypes(): ValuationInputTypes;
/** Name of the ProductInput.input oneof field that values `security`, e.g. 'tips'. */
export declare function inputTypeFor(security: SecurityProto): string;
/** @deprecated Use inputTypeFor. Removed in a later release (LM-418). */
export declare function armFor(security: SecurityProto): string;
/** Market data the security's input type needs, in file order. A fresh array; empty when none. */
export declare function requiredMarketData(security: SecurityProto): MarketDataKind[];
/**
 * The measures valuation-service computes for `inputType` (e.g. 'frn'), in catalog
 * order: entries of the bundled catalog/measures.json with computed_by
 * valuation-service and implemented true whose applies_to names a leaf product
 * type the input type values, or an ancestor of one. Throws
 * UnmappedProductTypeError(inputType, 'UNKNOWN_COUPON_TYPE') when no leaf maps
 * to `inputType`. A fresh array.
 */
export declare function measuresForInputType(inputType: string): MeasureProto[];
/** @deprecated Use measuresForInputType. Removed in a later release (LM-418). */
export declare function measuresForArm(arm: string): MeasureProto[];
/**
 * measuresForInputType over a given `measures` list. Exported for tests.
 * @internal
 */
export declare function measuresForInputTypeIn(measures: ReadonlyArray<unknown>, inputType: string): MeasureProto[];
/**
 * @deprecated Use measuresForInputTypeIn. Removed in a later release (LM-418).
 * @internal
 */
export declare function measuresForArmIn(measures: ReadonlyArray<unknown>, arm: string): MeasureProto[];
/** @deprecated Use ValuationInputTypes. Removed in a later release (LM-418). */
export declare const ValuationArms: typeof ValuationInputTypes;
/** @deprecated Use ValuationInputTypes. Removed in a later release (LM-418). */
export type ValuationArms = ValuationInputTypes;
/** @deprecated Use parseValuationInputTypes. Removed in a later release (LM-418). */
export declare function parseValuationArms(section: unknown): ValuationInputTypes;
/** @deprecated Use shippedValuationInputTypes. Removed in a later release (LM-418). */
export declare function shippedValuationArms(): ValuationInputTypes;
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
export declare function forSecurity(security: SecurityProto, price: PriceProto, marketData?: MarketData | null): ProductInput;
/**
 * Checks `productInput` is the input type inputTypeFor picks for its security, and holds
 * every market-data kind that input type requires. Throws ModelValidationError (no
 * input type, or the wrong input type), UnmappedProductTypeError or MissingMarketDataError.
 */
export declare function checkProductInput(productInput: ProductInput): void;
export {};
