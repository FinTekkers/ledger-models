"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedPriceDecimal = exports.PriceKind = void 0;
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_1 = __importDefault(require("../security/security"));
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const decimal_js_1 = require("decimal.js");
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const decimal_1 = require("../utils/decimal");
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const object_types_1 = require("../../util/object-types");
const errors_1 = require("../errors");
/**
 * LM-508: which side of the market getPrice() returned. Wrapper only; the
 * proto has no enum for it. See docs/adr/price_bid_ask_mid.md.
 */
var PriceKind;
(function (PriceKind) {
    PriceKind["MID"] = "MID";
    PriceKind["DERIVED_MID"] = "DERIVED_MID";
    PriceKind["BID"] = "BID";
    PriceKind["ASK"] = "ASK";
})(PriceKind || (exports.PriceKind = PriceKind = {}));
class Price {
    constructor(proto) {
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
    static fromSimple(securityId, price, date, priceType = price_type_pb_1.PriceTypeProto.PERCENTAGE) {
        const decimalValueProto = (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(price.toString()));
        const securityProto = (0, object_types_1.stampOwn)(new security_pb_1.SecurityProto());
        securityProto.setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(securityId)).toUUIDProto());
        securityProto.setIsLink(true);
        const priceProto = new price_pb_1.PriceProto();
        (0, object_types_1.stamp)(priceProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE);
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        priceProto.setAsOf(datetime_1.ZonedDateTime.from(date).toProto());
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
    static create(price, security, asOf, priceType) {
        return Price.createQuote({ mid: price }, security, asOf, priceType);
    }
    /**
     * LM-508: a price from any mix of mid, bid and ask; an absent side is
     * left unset. price_type is set only when `priceType` is given. Not
     * validated here: see price_rules.validate.
     */
    static createQuote(sides, security, asOf, priceType) {
        const priceProto = new price_pb_1.PriceProto();
        if (sides.mid !== undefined)
            priceProto.setMid((0, decimal_1.encodeDecimal)((0, decimal_1.fromDecimalJs)(sides.mid)));
        if (sides.bid !== undefined)
            priceProto.setBid((0, decimal_1.encodeDecimal)((0, decimal_1.fromDecimalJs)(sides.bid)));
        if (sides.ask !== undefined)
            priceProto.setAsk((0, decimal_1.encodeDecimal)((0, decimal_1.fromDecimalJs)(sides.ask)));
        (0, object_types_1.stamp)(priceProto, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE);
        priceProto.setAsOf(asOf.toProto());
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        if (security)
            priceProto.setSecurity(security.proto);
        if (priceType !== undefined)
            priceProto.setPriceType(priceType);
        return new Price(priceProto);
    }
    /**
     * Creates a cash price (always 1.0, so ABSOLUTE) for a cash security
     */
    static getCashPrice(cashSecurity, asOf) {
        return Price.create(new decimal_js_1.Decimal('1.0'), cashSecurity, asOf, price_type_pb_1.PriceTypeProto.ABSOLUTE);
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    /**
     * True iff this Price is a link reference (only the uuid is populated).
     * See docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate.
     */
    isLink() {
        return this.proto.getIsLink();
    }
    /**
     * Lazy hydration. Cache-only — caller must pre-warm via LinkResolver.
     * See docs/adr/lazy-link-hydration.md.
     */
    ensureHydrated() {
        if (!this.proto.getIsLink())
            return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto)
            throw new Error("Cannot read fields on link-mode Price with no UUID set.");
        const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new datetime_1.ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.PRICE.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(`Cannot read fields on link-mode Price uuid=${uuidKey} `
            + `— LinkCache miss. Pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`);
    }
    /**
     * The one number this price resolves to: mid if set; else the bid/ask
     * midpoint when both are set; else the one side that is set. Throws a
     * ModelValidationError on `mid` when none is set. For new code prefer
     * getPriceQuote(), which also says which kind it is.
     */
    getPrice() {
        return this.getPriceQuote().value;
    }
    /** The kind getPrice() returned (MID, DERIVED_MID, BID or ASK). */
    getPriceKind() {
        return this.getPriceQuote().kind;
    }
    /** The resolved value and its kind. Throws a ModelValidationError on `mid` when none is set. */
    getPriceQuote() {
        const { value, kind } = this.resolve();
        return { value: (0, decimal_1.toDecimalJs)(value), kind };
    }
    /** The raw mid, or undefined when unset. */
    getMid() {
        return optionalDecimalJs(this.side('mid'));
    }
    /** The raw bid, or undefined when unset. */
    getBid() {
        return optionalDecimalJs(this.side('bid'));
    }
    /** The raw ask, or undefined when unset. */
    getAsk() {
        return optionalDecimalJs(this.side('ask'));
    }
    /** As getPriceQuote(), keeping the exact scale (a decimal.js `Decimal` drops trailing zeros). */
    resolve() {
        var _a;
        const mid = this.side('mid');
        const bid = this.side('bid');
        const ask = this.side('ask');
        if (mid)
            return { value: mid, kind: PriceKind.MID };
        if (bid && ask)
            return { value: (0, decimal_1.midpoint)(bid, ask), kind: PriceKind.DERIVED_MID };
        if (bid)
            return { value: bid, kind: PriceKind.BID };
        if (ask)
            return { value: ask, kind: PriceKind.ASK };
        const raw = (_a = this.proto.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
        const id = raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
        throw new errors_1.ModelValidationError([(0, errors_1.violation)('mid', id, 'one of mid, bid or ask is required')]);
    }
    /** One side, or undefined when absent or unset. A malformed value throws, naming the field. */
    side(field) {
        this.ensureHydrated();
        const p = field === 'mid' ? this.proto.getMid() : field === 'bid' ? this.proto.getBid() : this.proto.getAsk();
        if (!p || (0, decimal_1.isUnsetDecimal)(p))
            return undefined;
        return (0, decimal_1.withField)(field, () => (0, decimal_1.decodeDecimal)(p));
    }
    /** The canonical string of the resolved price, keeping its scale, or 'N/A' when none is set or unreadable. */
    display() {
        try {
            return (0, decimal_1.toCanonicalString)(this.resolve().value);
        }
        catch (e) {
            return 'N/A';
        }
    }
    getPriceType() {
        this.ensureHydrated();
        return this.proto.getPriceType();
    }
    getSecurity() {
        const securityProto = this.proto.getSecurity();
        if (!securityProto)
            throw new Error("Security is required");
        return security_1.default.create(securityProto);
    }
    getSecurityID() {
        const securityProto = this.proto.getSecurity();
        if (!securityProto)
            throw new Error("Security is required");
        const uuid = securityProto.getUuid();
        if (!uuid)
            throw new Error("Security UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getAsOf() {
        return datetime_1.ZonedDateTime.fromRequired(this.proto.getAsOf(), 'price.as_of');
    }
    toString() {
        const priceStr = this.display();
        return `Price[${priceStr}, securityId=${this.getSecurityID().toString()}]`;
    }
    equals(other) {
        return this.getID().equals(other.getID());
    }
}
/**
 * LM-508: the decimal a price resolves to, read from the proto as given (a
 * link is not hydrated): mid, bid or ask as is, or the exact bid/ask midpoint
 * as a new decimal. Undefined when none is set. Same order as
 * Price.getPrice(); for pricer inputs and other proto-level readers.
 */
function resolvedPriceDecimal(proto) {
    const set = (p) => (p && !(0, decimal_1.isUnsetDecimal)(p) ? p : undefined);
    const mid = set(proto.getMid());
    const bid = set(proto.getBid());
    const ask = set(proto.getAsk());
    if (mid)
        return mid;
    if (bid && ask) {
        return (0, decimal_1.encodeDecimal)((0, decimal_1.midpoint)((0, decimal_1.withField)('bid', () => (0, decimal_1.decodeDecimal)(bid)), (0, decimal_1.withField)('ask', () => (0, decimal_1.decodeDecimal)(ask))));
    }
    return bid !== null && bid !== void 0 ? bid : ask;
}
exports.resolvedPriceDecimal = resolvedPriceDecimal;
function optionalDecimalJs(v) {
    return v ? (0, decimal_1.toDecimalJs)(v) : undefined;
}
exports.default = Price;
//# sourceMappingURL=Price.js.map