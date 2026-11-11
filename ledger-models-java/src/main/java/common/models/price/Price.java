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
    private BigDecimal price;

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
        super(id, asOf);
        this.price = price;
        this.security = security;
        this.priceType = priceType != null ? priceType : PriceTypeProto.UNKNOWN_PRICE_TYPE;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public Security getSecurity() {
        return security;
    }

    public PriceTypeProto getPriceType() {
        return priceType;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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
        return price.toString();
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
