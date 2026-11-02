package common.models.security;

/**
 * The market data a valuation input type needs beyond the price, named by the
 * {@code requires} lists in {@code hierarchy.json} {@code valuation_input_types}.
 * A closed vocabulary: loading a {@code requires} value outside it fails.
 * See docs/adr/valuation_input_types.md.
 */
public enum MarketDataKind {
    /** CPI-U index readings (TIPS inflation accrual). */
    CPI_U,
    /** Reference-rate fixings for a floating coupon. */
    FRN_FIXINGS,
    /** Forward curve for projecting floating coupons. */
    FRN_CURVE
}
