import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
/** A parsed, checked default_price_types section: node -> PriceTypeProto value. */
export declare class DefaultPriceTypes {
    /** node -> type, as written in the section. Read-only. */
    readonly entries: ReadonlyMap<string, PriceTypeProto>;
    constructor(entries: Map<string, PriceTypeProto>);
    /** The deepest entry on productType's parent chain, or null. */
    defaultFor(productType: string): PriceTypeProto | null;
}
/**
 * Parses and checks a default_price_types section against the shipped
 * product_types tree and the PriceTypeProto names. Throws when the section is
 * missing (undefined) or not an object, a key is not a product_types node, or
 * a value is not a PriceTypeProto name or is UNKNOWN_PRICE_TYPE. Exported for tests.
 */
export declare function parseDefaultPriceTypes(section: unknown): DefaultPriceTypes;
/** The shipped default_price_types section, parsed and checked on first use. */
export declare function shippedDefaultPriceTypes(): DefaultPriceTypes;
/**
 * The table default for the security's product_type, or null when it has
 * none. A missing security reads as PRODUCT_TYPE_UNKNOWN.
 */
export declare function defaultPriceTypeFor(security: SecurityProto | null | undefined): PriceTypeProto | null;
/**
 * The price_type to put on a trade price for this security. An explicit
 * priceType other than UNKNOWN_PRICE_TYPE is returned unchanged; otherwise the
 * table default. Throws NoDefaultPriceTypeError naming the product when there
 * is neither.
 */
export declare function resolveTradePriceType(security: SecurityProto | null | undefined, priceType?: PriceTypeProto | null): PriceTypeProto;
