package common.models.security;

import common.models.errors.ModelValidationException;
import common.util.ObjectTypes;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.position.PositionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.requests.valuation.ProductInput;
import fintekkers.requests.valuation.ValuationRequestProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;

import java.util.ArrayList;
import java.util.List;

/**
 * Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
 * JS-TS. See docs/adr/product_input_builders.md.
 */
public final class ValuationRequests {

    private ValuationRequests() { }

    /**
     * A {@code ValuationRequestProto} valued from {@code productInput} alone.
     *
     * <p>Sets asof_datetime (23), measures (30), position_input (21) and
     * product_input (70). Never sets security_input (20) or price_input (22).
     * {@code productInput} is checked with {@link ProductInputs#checkProductInput}
     * first, so a tips input with no cpi throws
     * {@link common.models.errors.MissingMarketDataError} here too. The
     * caller's protos are copied in as they are, not stamped (LM-322).
     *
     * @throws ModelValidationException when {@code asof} or {@code position} is null,
     *         or {@code productInput} fails {@link ProductInputs#checkProductInput}
     */
    public static ValuationRequestProto typed(LocalTimestampProto asof, ProductInput productInput,
                                              PositionProto position, List<MeasureProto> measures) {
        List<FieldViolationProto> missing = new ArrayList<>();
        if (asof == null) missing.add(ModelValidationException.violation("asof_datetime", null, "asof_datetime is required"));
        if (position == null) missing.add(ModelValidationException.violation("position_input", null, "position_input is required"));
        if (!missing.isEmpty()) throw new ModelValidationException(missing);
        ProductInputs.checkProductInput(productInput);
        return ObjectTypes.stampOwn(ValuationRequestProto.newBuilder())
                .addAllMeasures(measures)
                .setAsofDatetime(asof)
                .setPositionInput(position)
                .setProductInput(productInput)
                .build();
    }
}
