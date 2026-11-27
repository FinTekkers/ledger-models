package common.models.price;

import common.models.RawDataModelObject;
import common.models.security.DefaultPriceTypes;
import common.models.security.Security;
import fintekkers.models.price.PriceTypeProto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Objects;
import java.util.UUID;

import static common.models.security.CashSecurity.USD;

public class Price extends RawDataModelObject {
    private final Security security;
    private final PriceTypeProto priceType;
    // LM-508: any mix of the three; null is unset. getPrice() resolves them.
    private BigDecimal mid;
    private final BigDecimal bid;
    private final BigDecimal ask;

    /**
     * The price_type is {@code UNKNOWN_PRICE_TYPE}. For a trade price use
     * {@link #forTrade(BigDecimal, Security, ZonedDateTime)}, which sets it.
     */
    public Price(UUID id, BigDecimal price, Security security, ZonedDateTime asOf) {
        this(id, price, security, asOf, PriceTypeProto.UNKNOWN_PRICE_TYPE);
    }

    /**
     * LM-449: carries {@code PriceProto.price_type} so a price re-serialized
     * (e.g. on a derived maturation child) keeps it. A null type is
     * {@code UNKNOWN_PRICE_TYPE}. The security may be null: an inline trade
     * price need not name one.
     */
    public Price(UUID id, BigDecimal price, Security security, ZonedDateTime asOf, PriceTypeProto priceType) {
        this(id, price, null, null, security, asOf, priceType);
    }

    /**
     * LM-508: a price from any mix of mid, bid and ask; null leaves a side
     * unset. Not validated here: see {@link PriceRules#validate}.
     */
    public Price(UUID id, BigDecimal mid, BigDecimal bid, BigDecimal ask, Security security, ZonedDateTime asOf,
                 PriceTypeProto priceType) {
        super(id, asOf);
        this.mid = mid;
        this.bid = bid;
        this.ask = ask;
        this.security = security;
        this.priceType = priceType != null ? priceType : PriceTypeProto.UNKNOWN_PRICE_TYPE;
    }

    /**
     * The one number this price resolves to: mid if set; else the bid/ask
     * midpoint when both are set; else the one side that is set. Null when
     * none is set. For new code prefer {@link #getPriceQuote()}, which also
     * says which kind it is; this stays for existing callers.
     */
    public BigDecimal getPrice() {
        PriceQuote quote = getPriceQuote();
        return quote != null ? quote.value() : null;
    }

    /** The resolved value and its kind (MID, DERIVED_MID, BID or ASK), or null when none is set. */
    public PriceQuote getPriceQuote() {
        return PriceQuote.resolve(mid, bid, ask);
    }

    /** The kind {@link #getPrice()} returned, or null when none is set. */
    public PriceQuote.Kind getPriceKind() {
        PriceQuote quote = getPriceQuote();
        return quote != null ? quote.kind() : null;
    }

    /** The raw mid, or null when unset. */
    public BigDecimal getMid() {
        return mid;
    }

    /** The raw bid, or null when unset. */
    public BigDecimal getBid() {
        return bid;
    }

    /** The raw ask, or null when unset. */
    public BigDecimal getAsk() {
        return ask;
    }

    public Security getSecurity() {
        return security;
    }

    public PriceTypeProto getPriceType() {
        return priceType;
    }

    /** Sets the mid (LM-508); bid and ask are unchanged. */
    public void setPrice(BigDecimal price) {
        this.mid = price;
    }

    /**
     * LM-461: a trade price with a typed {@code price_type}: the default for
     * the security's product_type in {@code hierarchy.json}
     * {@code default_price_types} (bonds {@code PERCENTAGE}, stocks
     * {@code ABSOLUTE}). Pass the result to a {@code Transaction}
     * constructor. The price number goes through as given. A null security
     * reads as {@code PRODUCT_TYPE_UNKNOWN}.
     *
     * @throws common.models.errors.NoDefaultPriceTypeError when the product
     *         has no default, before anything is built
     */
    public static Price forTrade(BigDecimal price, Security security, ZonedDateTime asOf) {
        return forTrade(price, security, asOf, null);
    }

    /**
     * As {@link #forTrade(BigDecimal, Security, ZonedDateTime)}, with an
     * explicit {@code priceType} that is passed through unchanged. A null or
     * {@code UNKNOWN_PRICE_TYPE} type counts as omitted and takes the default.
     *
     * @throws common.models.errors.NoDefaultPriceTypeError when the type is
     *         omitted and the product has no default
     */
    public static Price forTrade(BigDecimal price, Security security, ZonedDateTime asOf, PriceTypeProto priceType) {
        PriceTypeProto resolved = DefaultPriceTypes.resolve(security != null ? security.getProto() : null, priceType);
        return new Price(UUID.randomUUID(), price, security, asOf, resolved);
    }

    /**
     * LM-508: a price from any mix of mid, bid and ask (null leaves a side
     * unset), with {@code priceType} resolved as {@link #forTrade(BigDecimal,
     * Security, ZonedDateTime, PriceTypeProto)} does.
     *
     * @throws common.models.errors.NoDefaultPriceTypeError when the type is
     *         omitted and the product has no default
     */
    public static Price forQuote(BigDecimal mid, BigDecimal bid, BigDecimal ask, Security security, ZonedDateTime asOf,
                                 PriceTypeProto priceType) {
        PriceTypeProto resolved = DefaultPriceTypes.resolve(security != null ? security.getProto() : null, priceType);
        return new Price(UUID.randomUUID(), mid, bid, ask, security, asOf, resolved);
    }

    /**
     * The price_type is {@code UNKNOWN_PRICE_TYPE}. For a trade price use
     * {@link #forTrade(BigDecimal, Security, ZonedDateTime)}, which sets it.
     */
    public static Price getPrice(BigDecimal price, Security sec) {
        return new Price(UUID.randomUUID(), price, sec, ZonedDateTime.now());
    }

    public static Price CASH_PRICE = new Price(UUID.randomUUID(), BigDecimal.ONE, USD, USD.getAsOf());

    public static Price getCashPrice() {
        return CASH_PRICE;
    }

    @Override
    public String toString() {
        BigDecimal value = getPrice();
        return value != null ? value.toString() : "N/A";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Price price1 = (Price) o;
        return Objects.equals(id, price1.id) && Objects.equals(getAsOf(), price1.getAsOf());
    }

    /**
     * Java contract: equals() above keys off (id, asOf); hashCode() must
     * combine the same two so equal instances hash equal. Without this
     * override, Object#hashCode returns identity hashes — so two Price
     * instances built from the same (id, asOf) land in different HashMap
     * buckets and silently fail to dedupe in collectors / sets.
     *
     * Surfaced post-#340: Transaction#getPrice (and equivalent wrapper
     * deserialization paths) now build a fresh Price on every call,
     * exposing the missing override.
     */
    @Override
    public int hashCode() {
        return Objects.hash(id, getAsOf());
    }
}
