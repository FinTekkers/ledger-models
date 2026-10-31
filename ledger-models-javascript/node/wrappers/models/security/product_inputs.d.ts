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
 *
 * forSecurity builds the ProductInput for that arm from a security, its price
 * and its market data; checkProductInput checks a ProductInput against the
 * same rule (LM-410). See docs/adr/product_input_builders.md.
 *
 * measuresForArm lists the measures valuation-service computes for an arm,
 * read from the bundled catalog/measures.json through the same lookup
 * (LM-427). There is no measure list in code.
 */
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { InflationIndexInput, ProductInput, ReferenceRateFixingProto, YieldCurveInput } from '../../../fintekkers/requests/valuation/product_inputs_pb';
/** The closed requires vocabulary: market data an arm needs beyond the price. */
export type MarketDataKind = 'CPI_U' | 'FRN_FIXINGS' | 'FRN_CURVE';
interface Arm {
    arm: string;
    requires: ReadonlyArray<MarketDataKind>;
}
/** A parsed, checked valuation_arms section. */
export declare class ValuationArms {
    private readonly entries;
    private readonly unpriced;
    /** @param entries node -> coupon type name (or '' for the plain entry) -> arm */
    constructor(entries: Map<string, Map<string, Arm>>, unpriced: ReadonlySet<string>);
    /** The deepest matching node's arm, or null when unmapped or unpriced. */
    resolve(productType: string, couponType: string): Arm | null;
    require(productType: string, couponType: string): Arm;
    /** Leaf product types (active and planned) with neither an entry nor an unpriced listing. */
    uncoveredLeaves(): string[];
    private covers;
}
/**
 * Parses and checks a valuation_arms section against the shipped
 * product_types tree, the ProductInput oneof and the CouponTypeProto /
 * MarketDataKind vocabularies. Throws on any failure. Exported for tests.
 */
export declare function parseValuationArms(section: unknown): ValuationArms;
/** The shipped valuation_arms section, parsed and checked on first use. Exported for tests. */
export declare function shippedValuationArms(): ValuationArms;
/** Name of the ProductInput.input oneof field that values `security`, e.g. 'tips'. */
export declare function armFor(security: SecurityProto): string;
/** Market data the security's arm needs, in file order. A fresh array; empty when none. */
export declare function requiredMarketData(security: SecurityProto): MarketDataKind[];
/**
 * The measures valuation-service computes for `arm` (e.g. 'frn'), in catalog
 * order: entries of the bundled catalog/measures.json with computed_by
 * valuation-service and implemented true whose applies_to names a leaf product
 * type the arm values, or an ancestor of one. Throws
 * UnmappedProductTypeError(arm, 'UNKNOWN_COUPON_TYPE') when no leaf maps to
 * `arm`. A fresh array.
 */
export declare function measuresForArm(arm: string): MeasureProto[];
/**
 * measuresForArm over a given `measures` list. Exported for tests.
 * @internal
 */
export declare function measuresForArmIn(measures: ReadonlyArray<unknown>, arm: string): MeasureProto[];
/**
 * Market data for forSecurity, one field per MarketDataKind: CPI_U is `cpi`,
 * FRN_FIXINGS is `fixings`, FRN_CURVE is `curve`. Each is copied to the arm
 * field of the same name (TipsInput.cpi, FrnInput.fixings, FrnInput.curve)
 * when the arm has one; the others are ignored.
 */
export interface MarketData {
    cpi?: InflationIndexInput;
    fixings?: ReferenceRateFixingProto[];
    curve?: YieldCurveInput;
}
/**
 * The ProductInput for `security`, in the arm armFor picks.
 *
 * Sets the arm's security and copies price.price as is into clean_price
 * (bond, tips, frn, mbs) or unit_price (equity, cash). Never sets
 * cost_basis. Throws UnmappedProductTypeError when the type has no arm and
 * MissingMarketDataError when `marketData` lacks a kind the arm requires.
 * The caller's protos are set as they are, not copied or stamped (LM-322).
 */
export declare function forSecurity(security: SecurityProto, price: PriceProto, marketData?: MarketData | null): ProductInput;
/**
 * Checks `productInput` is the arm armFor picks for its security, and holds
 * every market-data kind that arm requires. Throws ModelValidationError (no
 * arm, or the wrong arm), UnmappedProductTypeError or MissingMarketDataError.
 */
export declare function checkProductInput(productInput: ProductInput): void;
export {};
