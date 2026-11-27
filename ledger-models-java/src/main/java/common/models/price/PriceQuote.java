package common.models.price;

import java.math.BigDecimal;

/**
 * LM-508: the one number a price resolves to, and which kind it is. The
 * order is the PriceProto comment's: mid if set; else the midpoint of bid and
 * ask when both are set; else the one side that is set. The kind lives in the
 * wrappers only; the proto has no enum for it. See docs/adr/price_bid_ask_mid.md.
 */
public record PriceQuote(BigDecimal value, Kind kind) {
    private static final BigDecimal TWO = BigDecimal.valueOf(2);

    /** Which side of the market {@link #value()} came from. */
    public enum Kind { MID, DERIVED_MID, BID, ASK }

    /** The resolved quote, or null when mid, bid and ask are all null (unset). */
    public static PriceQuote resolve(BigDecimal mid, BigDecimal bid, BigDecimal ask) {
        if (mid != null) return new PriceQuote(mid, Kind.MID);
        if (bid != null && ask != null) return new PriceQuote(midpoint(bid, ask), Kind.DERIVED_MID);
        if (bid != null) return new PriceQuote(bid, Kind.BID);
        if (ask != null) return new PriceQuote(ask, Kind.ASK);
        return null;
    }

    /**
     * (bid + ask) / 2, exact: halving always terminates in base 10, so the
     * division never rounds. The sum's scale is kept when it is even and grows
     * by one when it is odd (99 and 101 give 100; 99.5 and 100 give 99.75),
     * the same value and scale in every language.
     */
    public static BigDecimal midpoint(BigDecimal bid, BigDecimal ask) {
        return bid.add(ask).divide(TWO);
    }
}
