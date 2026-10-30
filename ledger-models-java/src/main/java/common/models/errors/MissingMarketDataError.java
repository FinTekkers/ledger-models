package common.models.errors;

import common.models.security.MarketDataKind;

import java.util.List;
import java.util.UUID;

/**
 * Typed input error: the security's valuation arm requires market data
 * ({@code hierarchy.json} {@code valuation_arms} {@code requires}) that the
 * caller did not supply, e.g. arm {@code tips} with no {@code CPI_U}. Thrown by
 * {@code ProductInputs.forSecurity} and {@code ValuationRequests.typed}.
 * Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Carries one violation on the arm field, e.g. {@code tips.cpi}. Like
 * {@link UnmappedProductTypeError}, the {@code Error} suffix matches the other
 * bindings; this is not a {@link java.lang.Error}. See
 * docs/adr/product_input_builders.md.
 */
public class MissingMarketDataError extends ModelValidationException {
    private final String arm;
    private final MarketDataKind kind;

    /**
     * @param arm      the {@code ProductInput.input} field, e.g. {@code tips}
     * @param kind     the missing market data
     * @param field    the arm field that holds it, e.g. {@code tips.cpi}
     * @param objectId UUID of the security, or null if it has none
     */
    public MissingMarketDataError(String arm, MarketDataKind kind, String field, UUID objectId) {
        super(List.of(violation(field, objectId, "missing market data " + kind.name() + " for arm " + arm)));
        this.arm = arm;
        this.kind = kind;
    }

    /** The {@code ProductInput.input} field the security needs, e.g. {@code tips}. */
    public String getArm() {
        return arm;
    }

    /** The market data that was missing, e.g. {@link MarketDataKind#CPI_U}. */
    public MarketDataKind getKind() {
        return kind;
    }
}
