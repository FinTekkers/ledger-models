import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { PriceTypeProto } from "../../../fintekkers/models/price/price_type_pb";
import type { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import Security from "../security/security";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { Decimal } from "decimal.js";
import * as LinkCacheModule from "../../util/link-cache";
import { decodeDecimal, encodeDecimal, fromDecimalJs, isUnsetDecimal, midpoint, parseDecimalString, toCanonicalString, toDecimalJs, withField } from "../utils/decimal";
import type { CompactDecimal } from "../utils/decimal";
import { ObjectTypeProto } from '../../../fintekkers/models/util/object_type_pb';
import { stamp, stampOwn } from '../../util/object-types';
import { ModelValidationError, violation } from '../errors';

/**
 * LM-508: which side of the market getPrice() returned. Wrapper only; the
 * proto has no enum for it. See docs/adr/price_bid_ask_mid.md.
 */
export enum PriceKind {
    MID = 'MID',
    DERIVED_MID = 'DERIVED_MID',
    BID = 'BID',
    ASK = 'ASK',
}

/** The one number a price resolves to, and which kind it is. */
export type PriceQuote = { value: Decimal; kind: PriceKind };

/** Any mix of the three sides; an absent one is left unset. */
export type PriceSides = { mid?: Decimal; bid?: Decimal; ask?: Decimal };

class Price {
    proto: PriceProto;

    constructor(proto: PriceProto) {
        this.proto = proto;
    }

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
    static fromSimple(
        securityId: string,
        price: number,
        date: Date,
        priceType: PriceTypeProto = PriceTypeProto.PERCENTAGE
    ): Price {
        const decimalValueProto = encodeDecimal(parseDecimalString(price.toString()));

        const securityProto = stampOwn(new SecurityProto());
        securityProto.setUuid(new UUID(UUID.fromString(securityId)).toUUIDProto());
        securityProto.setIsLink(true);

        const priceProto = new PriceProto();
        stamp(priceProto, ObjectTypeProto.OBJECT_TYPE_PRICE);
        priceProto.setUuid(UUID.random().toUUIDProto());
        priceProto.setAsOf(ZonedDateTime.from(date).toProto());
        priceProto.setMid(decimalValueProto);
        priceProto.setSecurity(securityProto);
        priceProto.setPriceType(priceType);

        return new Price(priceProto);
    }

    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime.
     * LM-449: an inline trade price may have no security; it is then left unset.
     * LM-461: price_type is set only when `priceType` is given; this does no
     * default lookup (the Transaction params constructor resolves it first).
     */
    static create(price: Decimal, security: Security | null | undefined, asOf: ZonedDateTime, priceType?: PriceTypeProto): Price {
        return Price.createQuote({ mid: price }, security, asOf, priceType);
    }

    /**
     * LM-508: a price from any mix of mid, bid and ask; an absent side is
     * left unset. price_type is set only when `priceType` is given. Not
     * validated here: see price_rules.validate.
     */
    static createQuote(sides: PriceSides, security: Security | null | undefined, asOf: ZonedDateTime, priceType?: PriceTypeProto): Price {
        const priceProto = new PriceProto();
        if (sides.mid !== undefined) priceProto.setMid(encodeDecimal(fromDecimalJs(sides.mid)));
        if (sides.bid !== undefined) priceProto.setBid(encodeDecimal(fromDecimalJs(sides.bid)));
        if (sides.ask !== undefined) priceProto.setAsk(encodeDecimal(fromDecimalJs(sides.ask)));
        stamp(priceProto, ObjectTypeProto.OBJECT_TYPE_PRICE);
        priceProto.setAsOf(asOf.toProto());
        priceProto.setUuid(UUID.random().toUUIDProto());
        if (security) priceProto.setSecurity(security.proto);
        if (priceType !== undefined) priceProto.setPriceType(priceType);

        return new Price(priceProto);
    }

    /**
     * Creates a cash price (always 1.0, so ABSOLUTE) for a cash security
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price {
        return Price.create(new Decimal('1.0'), cashSecurity, asOf, PriceTypeProto.ABSOLUTE);
    }

    getID(): UUID {
        const uuid = this.proto.getUuid();
        if (!uuid) throw new Error("UUID is required");
        return UUID.fromU8Array(uuid.getRawUuid_asU8());
    }

    /**
     * True iff this Price is a link reference (only the uuid is populated).
     * See docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate.
     */
    isLink(): boolean {
        return this.proto.getIsLink();
    }

    /**
     * Lazy hydration. Cache-only — caller must pre-warm via LinkResolver.
     * See docs/adr/lazy-link-hydration.md.
     */
    private ensureHydrated(): void {
        if (!this.proto.getIsLink()) return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto) throw new Error("Cannot read fields on link-mode Price with no UUID set.");
        const uuidKey = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.PRICE.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(
            `Cannot read fields on link-mode Price uuid=${uuidKey} `
            + `— LinkCache miss. Pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`
        );
    }

    /**
     * The one number this price resolves to: mid if set; else the bid/ask
     * midpoint when both are set; else the one side that is set. Throws a
     * ModelValidationError on `mid` when none is set. For new code prefer
     * getPriceQuote(), which also says which kind it is.
     */
    getPrice(): Decimal {
        return this.getPriceQuote().value;
    }

    /** The kind getPrice() returned (MID, DERIVED_MID, BID or ASK). */
    getPriceKind(): PriceKind {
        return this.getPriceQuote().kind;
    }

    /** The resolved value and its kind. Throws a ModelValidationError on `mid` when none is set. */
    getPriceQuote(): PriceQuote {
        const { value, kind } = this.resolve();
        return { value: toDecimalJs(value), kind };
    }

    /** The raw mid, or undefined when unset. */
    getMid(): Decimal | undefined {
        return optionalDecimalJs(this.side('mid'));
    }

    /** The raw bid, or undefined when unset. */
    getBid(): Decimal | undefined {
        return optionalDecimalJs(this.side('bid'));
    }

    /** The raw ask, or undefined when unset. */
    getAsk(): Decimal | undefined {
        return optionalDecimalJs(this.side('ask'));
    }

    /** As getPriceQuote(), keeping the exact scale (a decimal.js `Decimal` drops trailing zeros). */
    private resolve(): { value: CompactDecimal; kind: PriceKind } {
        const mid = this.side('mid');
        const bid = this.side('bid');
        const ask = this.side('ask');
        if (mid) return { value: mid, kind: PriceKind.MID };
        if (bid && ask) return { value: midpoint(bid, ask), kind: PriceKind.DERIVED_MID };
        if (bid) return { value: bid, kind: PriceKind.BID };
        if (ask) return { value: ask, kind: PriceKind.ASK };
        const raw = this.proto.getUuid()?.getRawUuid_asU8();
        const id = raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
        throw new ModelValidationError([violation('mid', id, 'one of mid, bid or ask is required')]);
    }

    /** One side, or undefined when absent or unset. A malformed value throws, naming the field. */
    private side(field: 'mid' | 'bid' | 'ask'): CompactDecimal | undefined {
        this.ensureHydrated();
        const p = field === 'mid' ? this.proto.getMid() : field === 'bid' ? this.proto.getBid() : this.proto.getAsk();
        if (!p || isUnsetDecimal(p)) return undefined;
        return withField(field, () => decodeDecimal(p));
    }

    /** The canonical string of the resolved price, keeping its scale, or 'N/A' when none is set or unreadable. */
    private display(): string {
        try {
            return toCanonicalString(this.resolve().value);
        } catch (e) {
            return 'N/A';
        }
    }

    getPriceType(): PriceTypeProto {
        this.ensureHydrated();
        return this.proto.getPriceType();
    }

    getSecurity(): Security {
        const securityProto = this.proto.getSecurity();
        if (!securityProto) throw new Error("Security is required");
        return Security.create(securityProto);
    }

    getSecurityID(): UUID {
        const securityProto = this.proto.getSecurity();
        if (!securityProto) throw new Error("Security is required");
        const uuid = securityProto.getUuid();
        if (!uuid) throw new Error("Security UUID is required");
        return UUID.fromU8Array(uuid.getRawUuid_asU8());
    }

    getAsOf(): ZonedDateTime {
        return ZonedDateTime.fromRequired(this.proto.getAsOf(), 'price.as_of');
    }

    toString(): string {
        const priceStr = this.display();
        return `Price[${priceStr}, securityId=${this.getSecurityID().toString()}]`;
    }

    equals(other: Price): boolean {
        return this.getID().equals(other.getID());
    }
}

/**
 * LM-508: the decimal a price resolves to, read from the proto as given (a
 * link is not hydrated): mid, bid or ask as is, or the exact bid/ask midpoint
 * as a new decimal. Undefined when none is set. Same order as
 * Price.getPrice(); for pricer inputs and other proto-level readers.
 */
export function resolvedPriceDecimal(proto: PriceProto): DecimalValueProto | undefined {
    const set = (p: DecimalValueProto | undefined) => (p && !isUnsetDecimal(p) ? p : undefined);
    const mid = set(proto.getMid());
    const bid = set(proto.getBid());
    const ask = set(proto.getAsk());
    if (mid) return mid;
    if (bid && ask) {
        return encodeDecimal(midpoint(withField('bid', () => decodeDecimal(bid)), withField('ask', () => decodeDecimal(ask))));
    }
    return bid ?? ask;
}

function optionalDecimalJs(v: CompactDecimal | undefined): Decimal | undefined {
    return v ? toDecimalJs(v) : undefined;
}

export default Price;
