package common.models.security.metric;

import java.time.LocalDate;
import java.util.List;

/**
 * A caller mistake in a security metric call (LM-485): raised before any
 * service call is made. Service failures are
 * {@link SecurityMetricServiceException}.
 */
public class SecurityMetricException extends IllegalArgumentException {

    public SecurityMetricException(String message) {
        super(message);
    }

    /** The security has no UUID, so its metrics cannot be asked for. */
    public static class MissingSecurityId extends SecurityMetricException {
        public MissingSecurityId() {
            super("security has no UUID: cannot fetch its metrics");
        }
    }

    /** The metric is UNKNOWN_SECURITY_METRIC, unset, or a value this build does not know. */
    public static class UnknownMetric extends SecurityMetricException {
        public UnknownMetric(String metric) {
            super("unknown security metric: " + metric);
        }
    }

    /** One rejected point: its date ({@code null} for the whole input) and the reason. */
    public record Violation(LocalDate date, String reason) {
        @Override
        public String toString() {
            return (date == null ? "" : date + ": ") + reason;
        }
    }

    /** Points given to record that cannot be stored. Lists every bad point, in input order. */
    public static class InvalidMetricPoints extends SecurityMetricException {
        private final List<Violation> violations;

        public InvalidMetricPoints(String message, List<Violation> violations) {
            super(message);
            this.violations = List.copyOf(violations);
        }

        public List<Violation> getViolations() {
            return violations;
        }
    }
}
