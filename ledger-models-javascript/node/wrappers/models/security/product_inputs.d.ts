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
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
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
export {};
