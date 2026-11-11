package common.models.errors;

import java.util.List;
import java.util.UUID;

/**
 * Typed input error: a trade price is being built with no {@code price_type}
 * and the security's product_type has no entry (on its parent chain) in
 * {@code hierarchy.json} {@code default_price_types}, e.g. {@code FX_SPOT}.
 * Thrown by {@code Price.forTrade} before any price or transaction is built.
 * Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Carries one violation on {@code price.price_type} whose object id is the
 * security's UUID. Like {@link UnmappedProductTypeError}, the {@code Error}
 * suffix matches the other bindings; this is not a {@link java.lang.Error}.
 * See docs/adr/default_price_types.md.
 */
public class NoDefaultPriceTypeError extends ModelValidationException {
    /** Field path of the one violation. */
    public static final String FIELD = "price.price_type";

    private final String productType;

    /**
     * @param productType the ProductTypeProto name, e.g. {@code FX_SPOT}
     * @param objectId    UUID of the security, or null if it has none
     */
    public NoDefaultPriceTypeError(String productType, UUID objectId) {
        super(List.of(violation(FIELD, objectId, "no default price_type for product_type " + productType
                + " in hierarchy.json default_price_types; pass price_type")));
        this.productType = productType;
    }

    /** The ProductTypeProto name with no default, e.g. {@code FX_SPOT}. */
    public String getProductType() {
        return productType;
    }
}
