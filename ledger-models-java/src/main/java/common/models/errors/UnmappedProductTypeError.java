package common.models.errors;

/**
 * Typed input error: the security's product type (and coupon type) has no
 * valuation arm in {@code hierarchy.json} {@code valuation_arms}, or is listed
 * there as {@code unpriced}. Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Despite the name, this is not a {@link java.lang.Error}: the name matches
 * the other bindings (docs/adr/valuation_arms.md). It extends
 * {@link IllegalArgumentException}, like {@link ModelValidationException}, and
 * is distinct from {@link common.models.errors.transaction.TransactionProcessingException},
 * which stays for state errors. See docs/adr/typed-input-errors.md.
 */
public class UnmappedProductTypeError extends IllegalArgumentException {
    private final String productType;
    private final String couponType;

    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    public UnmappedProductTypeError(String productType, String couponType) {
        super("No valuation arm for product_type " + productType + ", coupon_type " + couponType);
        this.productType = productType;
        this.couponType = couponType;
    }

    /** ProductTypeProto name of the security, e.g. {@code FX_SPOT}. */
    public String getProductType() {
        return productType;
    }

    /** CouponTypeProto name read from {@code bond_details.coupon_type}, e.g. {@code UNKNOWN_COUPON_TYPE}. */
    public String getCouponType() {
        return couponType;
    }
}
