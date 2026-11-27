import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { PriceTypeProto } from "../../../fintekkers/models/price/price_type_pb";
import type { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import Security from "../security/security";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { Decimal } from "decimal.js";
/**
 * LM-508: which side of the market getPrice() returned. Wrapper only; the
 * proto has no enum for it. See docs/adr/price_bid_ask_mid.md.
 */
export declare enum PriceKind {
    MID = "MID",
    DERIVED_MID = "DERIVED_MID",
    BID = "BID",
    ASK = "ASK"
}
/** The one number a price resolves to, and which kind it is. */
export type PriceQuote = {
    value: Decimal;
    kind: PriceKind;
};
/** Any mix of the three sides; an absent one is left unset. */
export type PriceSides = {
    mid?: Decimal;
    bid?: Decimal;
    ask?: Decimal;
};
declare class Price {
    proto: PriceProto;
    constructor(proto: PriceProto);
    /**
     * Simple factory: create a Price from a security UUID string, a numeric price, and a Date.
     * This is the primary entry point for callers who just want:
     *   new Price(uuid, 99.5, date)
     *
     * @param securityId - UUID string of the security (e.g. "18e8c4e6-3da0-47c9-...")
     * @param price - The price as a number (e.g. 99.5)
     * @param date - A JavaScript Date for when this price is effective
     * @param priceType - Optional price type, defaults to PERCENTAGE
     */
    static fromSimple(securityId: string, price: number, date: Date, priceType?: PriceTypeProto): Price;
    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime.
     * LM-449: an inline trade price may have no security; it is then left unset.
     * LM-461: price_type is set only when `priceType` is given; this does no
     * default lookup (the Transaction params constructor resolves it first).
     */
    static create(price: Decimal, security: Security | null | undefined, asOf: ZonedDateTime, priceType?: PriceTypeProto): Price;
    /**
     * LM-508: a price from any mix of mid, bid and ask; an absent side is
     * left unset. price_type is set only when `priceType` is given. Not
     * validated here: see price_rules.validate.
     */
    static createQuote(sides: PriceSides, security: Security | null | undefined, asOf: ZonedDateTime, priceType?: PriceTypeProto): Price;
    /**
     * Creates a cash price (always 1.0, so ABSOLUTE) for a cash security
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price;
    getID(): UUID;
    /**
     * True iff this Price is a link reference (only the uuid is populated).
     * See docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate.
     */
    isLink(): boolean;
    /**
     * Lazy hydration. Cache-only — caller must pre-warm via LinkResolver.
     * See docs/adr/lazy-link-hydration.md.
     */
    private ensureHydrated;
    /**
     * The one number this price resolves to: mid if set; else the bid/ask
     * midpoint when both are set; else the one side that is set. Throws a
     * ModelValidationError on `mid` when none is set. For new code prefer
     * getPriceQuote(), which also says which kind it is.
     */
    getPrice(): Decimal;
    /** The kind getPrice() returned (MID, DERIVED_MID, BID or ASK). */
    getPriceKind(): PriceKind;
    /** The resolved value and its kind. Throws a ModelValidationError on `mid` when none is set. */
    getPriceQuote(): PriceQuote;
    /** The raw mid, or undefined when unset. */
    getMid(): Decimal | undefined;
    /** The raw bid, or undefined when unset. */
    getBid(): Decimal | undefined;
    /** The raw ask, or undefined when unset. */
    getAsk(): Decimal | undefined;
    /** As getPriceQuote(), keeping the exact scale (a decimal.js `Decimal` drops trailing zeros). */
    private resolve;
    /** One side, or undefined when absent or unset. A malformed value throws, naming the field. */
    private side;
    /** The canonical string of the resolved price, keeping its scale, or 'N/A' when none is set or unreadable. */
    private display;
    getPriceType(): PriceTypeProto;
    getSecurity(): Security;
    getSecurityID(): UUID;
    getAsOf(): ZonedDateTime;
    toString(): string;
    equals(other: Price): boolean;
}
/**
 * LM-508: the decimal a price resolves to, read from the proto as given (a
 * link is not hydrated): mid, bid or ask as is, or the exact bid/ask midpoint
 * as a new decimal. Undefined when none is set. Same order as
 * Price.getPrice(); for pricer inputs and other proto-level readers.
 */
export declare function resolvedPriceDecimal(proto: PriceProto): DecimalValueProto | undefined;
export default Price;
