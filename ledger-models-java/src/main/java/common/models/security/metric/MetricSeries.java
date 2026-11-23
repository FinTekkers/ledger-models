package common.models.security.metric;

import fintekkers.models.security.SecurityMetricTypeProto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

/**
 * The points of one security metric over a date range (LM-485), ascending by
 * date. Dates with no point are gaps: nothing is filled in.
 */
public final class MetricSeries {

    /** One (date, value) point. A {@code null} value is only allowed as input to record, where it is rejected. */
    public record MetricPoint(LocalDate date, BigDecimal value) {
        public MetricPoint {
            Objects.requireNonNull(date, "MetricPoint date is required");
        }
    }

    private final UUID securityId;
    private final SecurityMetricTypeProto metric;
    private final ZonedDateTime asOf;
    private final List<MetricPoint> points;

    public MetricSeries(UUID securityId, SecurityMetricTypeProto metric, ZonedDateTime asOf, List<MetricPoint> points) {
        this.securityId = securityId;
        this.metric = metric;
        this.asOf = asOf;
        this.points = List.copyOf(points);
    }

    public UUID securityId() {
        return securityId;
    }

    public SecurityMetricTypeProto metric() {
        return metric;
    }

    /** The as_of of the first response chunk that carried one, or {@code null} when none did. */
    public ZonedDateTime asOf() {
        return asOf;
    }

    /** The points, ascending by date. Unmodifiable. */
    public List<MetricPoint> points() {
        return points;
    }

    /** The last point, or {@code null} when the series is empty. */
    public MetricPoint latest() {
        return points.isEmpty() ? null : points.get(points.size() - 1);
    }

    /** The points as date to value, ascending. Unmodifiable. */
    public SortedMap<LocalDate, BigDecimal> asDict() {
        TreeMap<LocalDate, BigDecimal> out = new TreeMap<>();
        for (MetricPoint p : points) out.put(p.date(), p.value());
        return Collections.unmodifiableSortedMap(out);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MetricSeries other)) return false;
        return Objects.equals(securityId, other.securityId) && metric == other.metric
                && Objects.equals(asOf, other.asOf) && points.equals(other.points);
    }

    @Override
    public int hashCode() {
        return Objects.hash(securityId, metric, asOf, points);
    }

    @Override
    public String toString() {
        return "MetricSeries[" + securityId + " " + metric + " asOf=" + asOf + " points=" + points + "]";
    }
}
