package common.models.security;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

/**
 * One dated security metric observation (LM-482): the value and the date it
 * is for. {@code observationDate} is the observation's own date, which may be
 * earlier than the date asked for. An unknown value has no observation: absent
 * is never 0, so {@code value} is never null. See docs/adr/security_metric.md.
 */
public record SecurityMetricObservation(BigDecimal value, LocalDate observationDate) {
    public SecurityMetricObservation {
        Objects.requireNonNull(value, "value is required: an unknown value has no observation");
        Objects.requireNonNull(observationDate, "observationDate is required");
    }
}
