package common.models.price;

import common.models.RawDataModelObject;
import common.models.security.Security;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Objects;
import java.util.UUID;

import static common.models.security.CashSecurity.USD;

public class Price extends RawDataModelObject {
    private final Security security;
    private BigDecimal price;

    public Price(UUID id, BigDecimal price, Security security, ZonedDateTime asOf) {
        super(id, asOf);
        this.price = price;
        this.security = security;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public Security getSecurity() {
        return security;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

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
