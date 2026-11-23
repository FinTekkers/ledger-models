package common.models.security;

import fintekkers.models.security.SecurityMetricTypeProto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Where {@link Security#getSecurityMetric} and
 * {@link Security#getSecurityMetricSeries} read dated metrics from (LM-482).
 * Production installs an adapter over the SecurityMetric gRPC service with
 * {@link Security#setMetricFetcher}; tests install a fake. There is no
 * default. See docs/adr/security_metric.md.
 */
public interface SecurityMetricFetcher {
    /**
     * The observation with the latest observation date on or before
     * {@code date}, or {@code null} when there is none.
     */
    SecurityMetricObservation latest(UUID securityId, SecurityMetricTypeProto metric, LocalDate date);

    /** The observations with observation date in {@code [from, to]}, inclusive. */
    List<SecurityMetricObservation> series(UUID securityId, SecurityMetricTypeProto metric,
                                           LocalDate from, LocalDate to);
}
