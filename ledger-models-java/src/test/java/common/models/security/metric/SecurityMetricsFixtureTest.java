package common.models.security.metric;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.models.security.metric.MetricSeries.MetricPoint;
import common.models.security.metric.SecurityMetricException.InvalidMetricPoints;
import common.models.security.metric.SecurityMetricException.Violation;
import common.util.ObjectTypes;
import fintekkers.models.security.SecurityMetricPointProto;
import fintekkers.models.security.SecurityMetricSeriesProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.security_metric.CreateSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import fintekkers.requests.util.RequestOperationTypeProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-485: the pure SecurityMetric rules against the cases every language
 * shares in {@code test-fixtures/security-metric/cases.json}.
 */
class SecurityMetricsFixtureTest {

    private static final Path FIXTURE = Path.of("..", "test-fixtures", "security-metric", "cases.json");
    private static final UUID SPY = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID QQQ = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private static JsonObject fixture() throws IOException {
        return JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject();
    }

    private static List<MetricPoint> points(JsonArray array) {
        List<MetricPoint> out = new ArrayList<>();
        for (JsonElement el : array) {
            JsonArray p = el.getAsJsonArray();
            BigDecimal value = p.get(1).isJsonNull() ? null : new BigDecimal(p.get(1).getAsString());
            out.add(new MetricPoint(LocalDate.parse(p.get(0).getAsString()), value));
        }
        return out;
    }

    private static SecurityMetricSeriesProto series(UUID id, SecurityMetricTypeProto metric, List<MetricPoint> points) {
        SecurityMetricSeriesProto.Builder b = ObjectTypes.stamp(SecurityMetricSeriesProto.newBuilder(),
                        ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
                .setSecurityId(ProtoSerializationUtil.serializeUUID(id))
                .setMetric(metric);
        for (MetricPoint p : points) {
            b.addPoints(SecurityMetricPointProto.newBuilder()
                    .setObservationDate(ProtoSerializationUtil.serializeLocalDate(p.date()))
                    .setValue(ProtoSerializationUtil.serializeBigDecimal(p.value())));
        }
        return b.build();
    }

    @Test
    void latestCases() throws IOException {
        int ran = 0;
        SecurityMetricTypeProto metric = SecurityMetricTypeProto.SHARES_OUTSTANDING;
        for (JsonElement el : fixture().getAsJsonArray("latest")) {
            JsonObject c = el.getAsJsonObject();
            String name = c.get("name").getAsString();
            LocalDate on = LocalDate.parse(c.get("on").getAsString());
            GetLatestSecurityMetricResponseProto.Builder response = ObjectTypes.stamp(
                    GetLatestSecurityMetricResponseProto.newBuilder(),
                    ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE);
            // Another security's series comes first: matching is by security_id, not position.
            response.addSeries(series(QQQ, metric, List.of(new MetricPoint(on, new BigDecimal("999")))));
            if (!c.get("series").isJsonNull()) {
                response.addSeries(series(SPY, metric, points(c.getAsJsonArray("series"))));
            }
            // A series for another metric is ignored.
            response.addSeries(series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE,
                    List.of(new MetricPoint(on, new BigDecimal("1")))));

            Map<UUID, MetricResult> result = SecurityMetrics.mapLatest(response.build(), metric, List.of(SPY), on);

            assertEquals(List.of(SPY), new ArrayList<>(result.keySet()), name);
            MetricResult r = result.get(SPY);
            if (c.get("expected").isJsonNull()) {
                assertNull(r, name);
            } else {
                JsonObject expected = c.getAsJsonObject("expected");
                assertNotNull(r, name);
                String value = expected.get("value").getAsString();
                assertEquals(0, new BigDecimal(value).compareTo(r.value()), name);
                assertEquals(value, r.value().toPlainString(), name);
                assertEquals(LocalDate.parse(expected.get("date").getAsString()), r.date(), name);
                assertEquals(on, r.on(), name);
                assertEquals(expected.get("ageDays").getAsLong(), r.ageDays(), name);
            }
            ran++;
        }
        assertTrue(ran >= 1, "no latest cases ran");
    }

    @Test
    void mergeCases() throws IOException {
        int ran = 0;
        SecurityMetricTypeProto metric = SecurityMetricTypeProto.NAV_PER_SHARE;
        for (JsonElement el : fixture().getAsJsonArray("merge")) {
            JsonObject c = el.getAsJsonObject();
            String name = c.get("name").getAsString();
            List<SearchSecurityMetricResponseProto> chunks = new ArrayList<>();
            for (JsonElement chunk : c.getAsJsonArray("chunks")) {
                chunks.add(ObjectTypes.stamp(SearchSecurityMetricResponseProto.newBuilder(),
                                ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
                        .setSeries(series(SPY, metric, points(chunk.getAsJsonArray())))
                        .build());
            }
            if (c.has("error")) {
                SecurityMetricServiceException e = assertThrows(SecurityMetricServiceException.class,
                        () -> SecurityMetrics.mergeChunks(chunks, SPY, metric), name);
                assertTrue(e.getMessage().contains(c.get("error").getAsString()), name + ": " + e.getMessage());
            } else {
                MetricSeries series = SecurityMetrics.mergeChunks(chunks, SPY, metric);
                List<MetricPoint> expected = points(c.getAsJsonArray("expected"));
                assertEquals(expected, series.points(), name);
                assertEquals(SPY, series.securityId(), name);
                assertEquals(metric, series.metric(), name);
                assertEquals(expected.isEmpty() ? null : expected.get(expected.size() - 1), series.latest(), name);
            }
            ran++;
        }
        assertTrue(ran >= 1, "no merge cases ran");
    }

    @Test
    void recordCases() throws IOException {
        int ran = 0;
        for (JsonElement el : fixture().getAsJsonArray("record")) {
            JsonObject c = el.getAsJsonObject();
            String name = c.get("name").getAsString();
            SecurityMetricTypeProto metric = SecurityMetricTypeProto.valueOf(c.get("metric").getAsString());
            int chunkSize = c.get("chunkSize").getAsInt();
            List<MetricPoint> input = points(c.getAsJsonArray("points"));

            if (c.has("violations")) {
                InvalidMetricPoints e = assertThrows(InvalidMetricPoints.class,
                        () -> SecurityMetrics.validateRecord(metric, input), name);
                List<String[]> actual = new ArrayList<>();
                for (Violation v : e.getViolations()) {
                    actual.add(new String[]{v.date() == null ? null : v.date().toString(), v.reason()});
                }
                JsonArray expected = c.getAsJsonArray("violations");
                assertEquals(expected.size(), actual.size(), name + ": " + e.getMessage());
                for (int i = 0; i < expected.size(); i++) {
                    JsonObject v = expected.get(i).getAsJsonObject();
                    assertEquals(v.get("date").isJsonNull() ? null : v.get("date").getAsString(), actual.get(i)[0], name);
                    assertEquals(v.get("reason").getAsString(), actual.get(i)[1], name);
                    assertTrue(e.getMessage().contains(v.get("reason").getAsString()), e.getMessage());
                }
                assertTrue(e.getMessage().startsWith("invalid " + metric + " points: "), e.getMessage());
                ran++;
                continue;
            }

            List<List<MetricPoint>> chunks = SecurityMetrics.chunkRecord(SecurityMetrics.validateRecord(metric, input), chunkSize);
            JsonArray expectedChunks = c.getAsJsonArray("expectedChunks");
            assertEquals(expectedChunks.size(), chunks.size(), name);
            List<String> wireValues = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                CreateSecurityMetricRequestProto request = SecurityMetrics.buildCreate(metric, SPY, chunks.get(i));
                assertEquals(ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_REQUEST, ObjectTypes.readType(request));
                assertEquals(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES, ObjectTypes.readType(request.getSeries()));
                assertEquals(RequestOperationTypeProto.CREATE, request.getOperationType());
                assertEquals(metric, request.getSeries().getMetric());
                assertEquals(SPY, ProtoSerializationUtil.deserializeUUID(request.getSeries().getSecurityId()));
                List<String> dates = new ArrayList<>();
                for (SecurityMetricPointProto p : request.getSeries().getPointsList()) {
                    dates.add(ProtoSerializationUtil.deserializeRequiredLocalDate(p.getObservationDate(), "d").toString());
                    BigDecimal wire = new BigDecimal(new BigInteger(p.getValue().getUnscaledValue().toByteArray()),
                            p.getValue().getScale());
                    if (metric == SecurityMetricTypeProto.SHARES_OUTSTANDING) {
                        assertEquals(0, p.getValue().getScale(), name + ": share counts go at scale 0");
                    }
                    wireValues.add(wire.toPlainString());
                }
                List<String> expectedDates = new ArrayList<>();
                expectedChunks.get(i).getAsJsonArray().forEach(d -> expectedDates.add(d.getAsString()));
                assertEquals(expectedDates, dates, name);
            }
            List<String> expectedValues = new ArrayList<>();
            c.getAsJsonArray("expectedValues").forEach(v -> expectedValues.add(v.getAsString()));
            assertEquals(expectedValues, wireValues, name);
            ran++;
        }
        assertTrue(ran >= 1, "no record cases ran");
    }

    @Test
    void getLatestRequestIsStampedAndDeduped() {
        LocalDate on = LocalDate.of(2026, 11, 23);
        GetLatestSecurityMetricRequestProto request = SecurityMetrics.buildGetLatest(
                SecurityMetricTypeProto.NAV_PER_SHARE, List.of(SPY, QQQ, SPY), on);
        assertEquals(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST, ObjectTypes.readType(request));
        assertTrue(ObjectTypes.readVersion(request).isPresent());
        List<UUIDProto> expected = List.of(ProtoSerializationUtil.serializeUUID(SPY), ProtoSerializationUtil.serializeUUID(QQQ));
        assertEquals(expected, request.getSecurityIdsList());
        assertEquals(List.of(SecurityMetricTypeProto.NAV_PER_SHARE), request.getMetricsList());
        assertEquals(ProtoSerializationUtil.serializeLocalDate(on), request.getDate());
    }

    @Test
    void searchRequestIsStampedAndRejectsFromAfterTo() {
        SearchSecurityMetricRequestProto request = SecurityMetrics.buildSearch(SecurityMetricTypeProto.TOTAL_NET_ASSETS,
                SPY, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 20));
        assertEquals(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST, ObjectTypes.readType(request));
        assertEquals(ProtoSerializationUtil.serializeUUID(SPY), request.getSecurityId());
        assertEquals(List.of(SecurityMetricTypeProto.TOTAL_NET_ASSETS), request.getMetricsList());
        assertEquals(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2026, 11, 1)), request.getStartDate());
        assertEquals(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2026, 11, 20)), request.getEndDate());

        SecurityMetricException e = assertThrows(SecurityMetricException.class, () -> SecurityMetrics.buildSearch(
                SecurityMetricTypeProto.TOTAL_NET_ASSETS, SPY, LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 19)));
        assertEquals("from date 2026-11-20 is after to date 2026-11-19", e.getMessage());
    }

    @Test
    void unknownMetricIsNamed() {
        SecurityMetricException.UnknownMetric e = assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetrics.checkMetric(SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC));
        assertEquals("unknown security metric: UNKNOWN_SECURITY_METRIC", e.getMessage());
        assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetrics.checkMetric(SecurityMetricTypeProto.UNRECOGNIZED));
        assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetrics.validateRecord(SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC, List.of()));
    }

    @Test
    void invalidPointsMessageListsEveryProblemAndMapInputWorks() {
        List<MetricPoint> bad = List.of(new MetricPoint(LocalDate.of(2026, 11, 18), new BigDecimal("1.5")),
                new MetricPoint(LocalDate.of(2026, 11, 19), new BigDecimal("100")),
                new MetricPoint(LocalDate.of(2026, 11, 19), new BigDecimal("101")));
        InvalidMetricPoints e = assertThrows(InvalidMetricPoints.class,
                () -> SecurityMetrics.validateRecord(SecurityMetricTypeProto.SHARES_OUTSTANDING, bad));
        assertEquals("invalid SHARES_OUTSTANDING points: 2026-11-18: fractional share count (1.5); "
                + "2026-11-19: duplicate date", e.getMessage());

        Map<LocalDate, BigDecimal> map = new LinkedHashMap<>();
        map.put(LocalDate.of(2026, 11, 20), new BigDecimal("2.00"));
        map.put(LocalDate.of(2026, 11, 19), new BigDecimal("1"));
        List<MetricPoint> valid = SecurityMetrics.validateRecord(SecurityMetricTypeProto.SHARES_OUTSTANDING, map);
        assertEquals(List.of(new MetricPoint(LocalDate.of(2026, 11, 19), new BigDecimal("1")),
                new MetricPoint(LocalDate.of(2026, 11, 20), new BigDecimal("2"))), valid);
    }

    @Test
    void seriesViewsAndAbsentLatest() {
        MetricSeries empty = new MetricSeries(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, null, List.of());
        assertNull(empty.latest());
        assertNull(empty.asOf());
        assertTrue(empty.asDict().isEmpty());

        MetricPoint a = new MetricPoint(LocalDate.of(2026, 11, 19), new BigDecimal("1.10"));
        MetricPoint b = new MetricPoint(LocalDate.of(2026, 11, 20), new BigDecimal("0"));
        MetricSeries s = new MetricSeries(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, null, List.of(a, b));
        assertEquals(b, s.latest());
        assertEquals(List.of(a.date(), b.date()), new ArrayList<>(s.asDict().keySet()));
        assertEquals("1.10", s.asDict().get(a.date()).toPlainString());
        assertFalse(s.asDict().isEmpty());
        assertEquals(3, new MetricResult(BigDecimal.ONE, LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 23)).ageDays());
    }
}
