package common.models.security.metric;

import common.models.security.metric.MetricSeries.MetricPoint;
import common.models.security.metric.SecurityMetricException.InvalidMetricPoints;
import common.models.security.metric.SecurityMetricException.UnknownMetric;
import common.models.security.metric.SecurityMetricException.Violation;
import common.util.ObjectTypes;
import fintekkers.models.security.SecurityMetricPointProto;
import fintekkers.models.security.SecurityMetricSeriesProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.requests.security_metric.CreateSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import fintekkers.requests.util.RequestOperationTypeProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The pure rules of the security metric helpers (LM-485): request building,
 * response mapping and record validation. No I/O; {@code SecurityMetricService}
 * makes the calls. The same rules are checked in every language against
 * {@code test-fixtures/security-metric/cases.json}.
 */
public final class SecurityMetrics {

    /** Most points sent in one CreateOrUpdate request. */
    public static final int RECORD_CHUNK_SIZE = 5000;

    private SecurityMetrics() {
    }

    /**
     * @throws UnknownMetric when {@code metric} is null, UNKNOWN_SECURITY_METRIC or UNRECOGNIZED
     */
    public static void checkMetric(SecurityMetricTypeProto metric) {
        if (metric == null || metric == SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC
                || metric == SecurityMetricTypeProto.UNRECOGNIZED) {
            throw new UnknownMetric(String.valueOf(metric));
        }
    }

    /** The UUIDs without repeats, first occurrence order kept. */
    public static List<UUID> dedupe(Collection<UUID> uuids) {
        Set<UUID> seen = new LinkedHashSet<>();
        for (UUID id : uuids) {
            if (id == null) throw new SecurityMetricException.MissingSecurityId();
            seen.add(id);
        }
        return new ArrayList<>(seen);
    }

    /** GetLatest for {@code metric} of each UUID (repeats dropped), latest point on or before {@code on}. */
    public static GetLatestSecurityMetricRequestProto buildGetLatest(SecurityMetricTypeProto metric,
                                                                     Collection<UUID> uuids, LocalDate on) {
        checkMetric(metric);
        requireDate(on, "on");
        GetLatestSecurityMetricRequestProto.Builder b = ObjectTypes.stamp(
                GetLatestSecurityMetricRequestProto.newBuilder(),
                ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST);
        for (UUID id : dedupe(uuids)) b.addSecurityIds(ProtoSerializationUtil.serializeUUID(id));
        return b.addMetrics(metric)
                .setDate(ProtoSerializationUtil.serializeLocalDate(on))
                .build();
    }

    /**
     * Each requested UUID to its latest value, or to {@code null} when there
     * is none. Every requested UUID is a key. Series are matched by
     * security_id, not by position; series for another metric or an
     * unrequested security are ignored.
     */
    public static Map<UUID, MetricResult> mapLatest(GetLatestSecurityMetricResponseProto response,
                                                    SecurityMetricTypeProto metric,
                                                    Collection<UUID> uuids, LocalDate on) {
        Map<UUID, MetricResult> out = new LinkedHashMap<>();
        for (UUID id : dedupe(uuids)) out.put(id, null);
        for (SecurityMetricSeriesProto series : response.getSeriesList()) {
            if (series.getMetric() != metric || !series.hasSecurityId()) continue;
            UUID id = ProtoSerializationUtil.deserializeUUID(series.getSecurityId());
            if (id == null || !out.containsKey(id) || series.getPointsCount() == 0) continue;
            SecurityMetricPointProto last = series.getPoints(series.getPointsCount() - 1);
            out.put(id, new MetricResult(value(last, "GetLatest"), date(last, "GetLatest"), on));
        }
        return Collections.unmodifiableMap(out);
    }

    /**
     * Search for {@code metric} of {@code uuid} from {@code from} to {@code to}, inclusive.
     *
     * @throws SecurityMetricException when {@code from} is after {@code to}
     */
    public static SearchSecurityMetricRequestProto buildSearch(SecurityMetricTypeProto metric, UUID uuid,
                                                               LocalDate from, LocalDate to) {
        checkMetric(metric);
        if (uuid == null) throw new SecurityMetricException.MissingSecurityId();
        requireDate(from, "from");
        requireDate(to, "to");
        if (from.isAfter(to)) {
            throw new SecurityMetricException("from date " + from + " is after to date " + to);
        }
        return ObjectTypes.stamp(SearchSecurityMetricRequestProto.newBuilder(),
                        ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
                .setSecurityId(ProtoSerializationUtil.serializeUUID(uuid))
                .addMetrics(metric)
                .setStartDate(ProtoSerializationUtil.serializeLocalDate(from))
                .setEndDate(ProtoSerializationUtil.serializeLocalDate(to))
                .build();
    }

    /** {@link #mergeChunks(Iterator, UUID, SecurityMetricTypeProto)} over a collection of chunks. */
    public static MetricSeries mergeChunks(Iterable<SearchSecurityMetricResponseProto> chunks,
                                           UUID securityId, SecurityMetricTypeProto metric) {
        return mergeChunks(chunks.iterator(), securityId, metric);
    }

    /**
     * Joins the points of consecutive Search responses. No responses, or only
     * empty ones, is an empty series. Gaps stay gaps.
     *
     * @throws SecurityMetricServiceException when a date is not after the one before it
     */
    public static MetricSeries mergeChunks(Iterator<SearchSecurityMetricResponseProto> chunks,
                                           UUID securityId, SecurityMetricTypeProto metric) {
        List<MetricPoint> points = new ArrayList<>();
        ZonedDateTime asOf = null;
        LocalDate previous = null;
        while (chunks.hasNext()) {
            SearchSecurityMetricResponseProto chunk = chunks.next();
            if (!chunk.hasSeries()) continue;
            SecurityMetricSeriesProto series = chunk.getSeries();
            if (asOf == null && series.hasAsOf()) {
                asOf = ProtoSerializationUtil.deserializeTimestamp(series.getAsOf(), "series.as_of");
            }
            for (SecurityMetricPointProto p : series.getPointsList()) {
                LocalDate date = date(p, "Search");
                if (previous != null && !date.isAfter(previous)) {
                    throw new SecurityMetricServiceException("Search returned " + date + " after " + previous
                            + ": dates must be strictly ascending");
                }
                points.add(new MetricPoint(date, value(p, "Search")));
                previous = date;
            }
        }
        return new MetricSeries(securityId, metric, asOf, points);
    }

    /** {@link #validateRecord(SecurityMetricTypeProto, List)} over a map of date to value. */
    public static List<MetricPoint> validateRecord(SecurityMetricTypeProto metric, Map<LocalDate, BigDecimal> points) {
        List<MetricPoint> list = new ArrayList<>(points.size());
        for (Map.Entry<LocalDate, BigDecimal> e : points.entrySet()) {
            list.add(new MetricPoint(e.getKey(), e.getValue()));
        }
        return validateRecord(metric, list);
    }

    /**
     * Checks points before they are recorded and returns them ascending by
     * date. SHARES_OUTSTANDING values come back at scale 0
     * ({@code 15204137000.00} becomes {@code 15204137000}).
     *
     * @throws UnknownMetric        when the metric is not a known metric
     * @throws InvalidMetricPoints  listing every bad point: no points, missing
     *                              value, fractional share count, duplicate date
     */
    public static List<MetricPoint> validateRecord(SecurityMetricTypeProto metric, List<MetricPoint> points) {
        checkMetric(metric);
        List<Violation> violations = new ArrayList<>();
        List<String> details = new ArrayList<>();
        List<MetricPoint> accepted = new ArrayList<>(points.size());
        if (points.isEmpty()) {
            violations.add(new Violation(null, "no points"));
            details.add("no points");
        }
        boolean shares = metric == SecurityMetricTypeProto.SHARES_OUTSTANDING;
        Set<LocalDate> seen = new HashSet<>();
        for (MetricPoint p : points) {
            BigDecimal value = p.value();
            if (value == null) {
                violations.add(new Violation(p.date(), "missing value"));
                details.add(p.date() + ": missing value");
            } else if (shares) {
                if (!isIntegral(value)) {
                    violations.add(new Violation(p.date(), "fractional share count"));
                    details.add(p.date() + ": fractional share count (" + value.toPlainString() + ")");
                } else {
                    value = value.setScale(0);
                }
            }
            if (!seen.add(p.date())) {
                violations.add(new Violation(p.date(), "duplicate date"));
                details.add(p.date() + ": duplicate date");
            }
            accepted.add(new MetricPoint(p.date(), value));
        }
        if (!violations.isEmpty()) {
            throw new InvalidMetricPoints("invalid " + metric + " points: " + String.join("; ", details), violations);
        }
        accepted.sort(Comparator.comparing(MetricPoint::date));
        return accepted;
    }

    /** Consecutive lists of at most {@code chunkSize} points. */
    public static List<List<MetricPoint>> chunkRecord(List<MetricPoint> points, int chunkSize) {
        if (chunkSize < 1) throw new IllegalArgumentException("chunk size must be at least 1, got " + chunkSize);
        List<List<MetricPoint>> chunks = new ArrayList<>();
        for (int i = 0; i < points.size(); i += chunkSize) {
            chunks.add(List.copyOf(points.subList(i, Math.min(points.size(), i + chunkSize))));
        }
        return chunks;
    }

    /** CreateOrUpdate (operation CREATE) storing {@code chunk} for {@code metric} of {@code uuid}. */
    public static CreateSecurityMetricRequestProto buildCreate(SecurityMetricTypeProto metric, UUID uuid,
                                                               List<MetricPoint> chunk) {
        checkMetric(metric);
        if (uuid == null) throw new SecurityMetricException.MissingSecurityId();
        SecurityMetricSeriesProto.Builder series = ObjectTypes.stamp(SecurityMetricSeriesProto.newBuilder(),
                        ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
                .setSecurityId(ProtoSerializationUtil.serializeUUID(uuid))
                .setMetric(metric);
        for (MetricPoint p : chunk) {
            series.addPoints(SecurityMetricPointProto.newBuilder()
                    .setObservationDate(ProtoSerializationUtil.serializeLocalDate(p.date()))
                    .setValue(ProtoSerializationUtil.serializeBigDecimal(p.value())));
        }
        return ObjectTypes.stamp(CreateSecurityMetricRequestProto.newBuilder(),
                        ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_REQUEST)
                .setOperationType(RequestOperationTypeProto.CREATE)
                .setSeries(series)
                .build();
    }

    private static boolean isIntegral(BigDecimal value) {
        return value.signum() == 0 || value.stripTrailingZeros().scale() <= 0;
    }

    private static void requireDate(LocalDate date, String name) {
        if (date == null) throw new SecurityMetricException(name + " date is required");
    }

    private static LocalDate date(SecurityMetricPointProto p, String rpc) {
        if (ProtoSerializationUtil.isUnsetLocalDate(p.getObservationDate())) {
            throw new SecurityMetricServiceException(rpc + " returned a point with no observation_date");
        }
        return ProtoSerializationUtil.deserializeRequiredLocalDate(p.getObservationDate(), "point.observation_date");
    }

    private static BigDecimal value(SecurityMetricPointProto p, String rpc) {
        if (!p.hasValue() || ProtoSerializationUtil.isUnsetDecimal(p.getValue())) {
            throw new SecurityMetricServiceException(rpc + " returned a point with no value on "
                    + date(p, rpc));
        }
        return ProtoSerializationUtil.deserializeBigDecimal(p.getValue());
    }
}
