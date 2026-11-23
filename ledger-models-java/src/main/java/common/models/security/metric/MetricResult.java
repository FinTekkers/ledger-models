package common.models.security.metric;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * One security metric value (LM-485): the latest point on or before the date
 * asked for. A missing value is a {@code null} MetricResult, never a zero.
 *
 * @param value the stored value, scale kept as stored
 * @param date  the observation date of the point
 * @param on    the date asked for
 */
public record MetricResult(BigDecimal value, LocalDate date, LocalDate on) {

    public MetricResult {
        Objects.requireNonNull(value, "MetricResult value is required");
        Objects.requireNonNull(date, "MetricResult date is required");
        Objects.requireNonNull(on, "MetricResult on is required");
    }

    /** Calendar days from {@link #date()} to {@link #on()}: a Friday point asked for on Monday is 3. */
    public long ageDays() {
        return ChronoUnit.DAYS.between(date, on);
    }
}
