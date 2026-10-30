package common.models.security;

import fintekkers.requests.valuation.InflationIndexInput;
import fintekkers.requests.valuation.ReferenceRateFixingProto;
import fintekkers.requests.valuation.YieldCurveInput;

import java.util.List;
import java.util.Optional;

/**
 * Market data for {@link ProductInputs#forSecurity}, one field per
 * {@link MarketDataKind}: {@code CPI_U} is {@link #cpi()},
 * {@code FRN_FIXINGS} is {@link #fixings()}, {@code FRN_CURVE} is
 * {@link #curve()}. Each is copied to the arm field of the same name
 * ({@code TipsInput.cpi}, {@code FrnInput.fixings}, {@code FrnInput.curve})
 * when the arm has one; the others are ignored. Immutable.
 */
public final class MarketData {
    /** No market data: enough for arms that require none. */
    public static final MarketData NONE = builder().build();

    private final InflationIndexInput cpi;
    private final List<ReferenceRateFixingProto> fixings;
    private final YieldCurveInput curve;

    private MarketData(Builder b) {
        this.cpi = b.cpi;
        this.fixings = List.copyOf(b.fixings);
        this.curve = b.curve;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Optional<InflationIndexInput> cpi() {
        return Optional.ofNullable(cpi);
    }

    /** Unmodifiable; empty when none. */
    public List<ReferenceRateFixingProto> fixings() {
        return fixings;
    }

    public Optional<YieldCurveInput> curve() {
        return Optional.ofNullable(curve);
    }

    public static final class Builder {
        private InflationIndexInput cpi;
        private List<ReferenceRateFixingProto> fixings = List.of();
        private YieldCurveInput curve;

        private Builder() { }

        public Builder cpi(InflationIndexInput cpi) {
            this.cpi = cpi;
            return this;
        }

        public Builder fixings(List<ReferenceRateFixingProto> fixings) {
            this.fixings = List.copyOf(fixings);
            return this;
        }

        public Builder curve(YieldCurveInput curve) {
            this.curve = curve;
            return this;
        }

        public MarketData build() {
            return new MarketData(this);
        }
    }
}
