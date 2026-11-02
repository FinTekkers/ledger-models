package common.models.errors;

import common.models.security.MarketDataKind;

import java.util.List;
import java.util.UUID;

/**
 * Typed input error: the security's valuation input type requires market data
 * ({@code hierarchy.json} {@code valuation_input_types} {@code requires}) that
 * the caller did not supply, e.g. input type {@code tips} with no
 * {@code CPI_U}. Thrown by {@code ProductInputs.forSecurity} and
 * {@code ValuationRequests.typed}. Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Carries one violation on the input type's field, e.g. {@code tips.cpi}.
 * Like {@link UnmappedProductTypeError}, the {@code Error} suffix matches the
 * other bindings; this is not a {@link java.lang.Error}. See
 * docs/adr/product_input_builders.md.
 */
public class MissingMarketDataError extends ModelValidationException {
    private final String inputType;
    private final MarketDataKind kind;

    /**
     * @param inputType the {@code ProductInput.input} field, e.g. {@code tips}
     * @param kind      the missing market data
     * @param field     the input type's field that holds it, e.g. {@code tips.cpi}
     * @param objectId  UUID of the security, or null if it has none
     */
    public MissingMarketDataError(String inputType, MarketDataKind kind, String field, UUID objectId) {
        super(List.of(violation(field, objectId, "missing market data " + kind.name() + " for input type " + inputType)));
        this.inputType = inputType;
        this.kind = kind;
    }

    /** The {@code ProductInput.input} field the security needs, e.g. {@code tips}. */
    public String getInputType() {
        return inputType;
    }

    /**
     * @deprecated Use {@link #getInputType()}. Removed in a later release (LM-418).
     */
    @Deprecated
    public String getArm() {
        return getInputType();
    }

    /** The market data that was missing, e.g. {@link MarketDataKind#CPI_U}. */
    public MarketDataKind getKind() {
        return kind;
    }
}
