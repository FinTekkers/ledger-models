package common.models.security;

import com.google.protobuf.ByteString;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Timestamp;
import fintekkers.models.security.SecurityMetricPointProto;
import fintekkers.models.security.SecurityMetricSeriesProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-484 — security metric series, GetLatest and Search messages round-trip
 * unchanged, with field-level checks after parse.
 *
 * An empty series (zero points: unknown) and a series with one point of value
 * 0 (a real zero) parse to different lengths and differ on the wire.
 */
class SecurityMetricRoundTripTest {

    private static final UUIDProto SPY = uuid((byte) 1);
    private static final UUIDProto QQQ = uuid((byte) 2);
    private static final LocalTimestampProto AS_OF = LocalTimestampProto.newBuilder()
            .setTimestamp(Timestamp.newBuilder().setSeconds(1_795_392_000L))
            .setTimeZone("UTC")
            .build();

    private static UUIDProto uuid(byte b) {
        byte[] raw = new byte[16];
        Arrays.fill(raw, b);
        return UUIDProto.newBuilder().setRawUuid(ByteString.copyFrom(raw)).build();
    }

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder().setYear(year).setMonth(month).setDay(day).build();
    }

    private static SecurityMetricPointProto point(LocalDateProto observationDate, String value) {
        return SecurityMetricPointProto.newBuilder()
                .setObservationDate(observationDate)
                .setValue(Decimals.decimal(value))
                .build();
    }

    private static SecurityMetricSeriesProto series(UUIDProto security, SecurityMetricTypeProto metric,
                                                    SecurityMetricPointProto... points) {
        return SecurityMetricSeriesProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
                .setSecurityId(security)
                .setMetric(metric)
                .setAsOf(AS_OF)
                .addAllPoints(Arrays.asList(points))
                .build();
    }

    private static List<String> points(SecurityMetricSeriesProto series) {
        return series.getPointsList().stream()
                .map(p -> p.getObservationDate().getYear() + "-" + p.getObservationDate().getMonth() + "-"
                        + p.getObservationDate().getDay() + "=" + Decimals.text(p.getValue()))
                .collect(Collectors.toList());
    }

    @Test
    void threePointSeriesRoundTripsInOrderWithExactDecimals() throws InvalidProtocolBufferException {
        SecurityMetricSeriesProto original = series(SPY, SecurityMetricTypeProto.SHARES_OUTSTANDING,
                point(date(2026, 9, 28), "15204137000"),
                point(date(2026, 9, 29), "15210000000"),
                point(date(2026, 9, 30), "15198250000"));

        SecurityMetricSeriesProto parsed = SecurityMetricSeriesProto.parseFrom(original.toByteArray());

        assertEquals(original, parsed);
        assertEquals(SPY, parsed.getSecurityId());
        assertEquals(SecurityMetricTypeProto.SHARES_OUTSTANDING, parsed.getMetric());
        assertEquals(AS_OF, parsed.getAsOf());
        assertEquals(List.of("2026-9-28=15204137000", "2026-9-29=15210000000", "2026-9-30=15198250000"),
                points(parsed));
    }

    @Test
    void emptySeriesIsNotAZeroValuedPoint() throws InvalidProtocolBufferException {
        SecurityMetricSeriesProto empty = series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE);
        SecurityMetricSeriesProto zero = series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE,
                point(date(2026, 11, 20), "0"));

        SecurityMetricSeriesProto parsedEmpty = SecurityMetricSeriesProto.parseFrom(empty.toByteArray());
        SecurityMetricSeriesProto parsedZero = SecurityMetricSeriesProto.parseFrom(zero.toByteArray());

        assertEquals(empty, parsedEmpty);
        assertEquals(zero, parsedZero);
        assertEquals(0, parsedEmpty.getPointsCount());
        assertEquals(1, parsedZero.getPointsCount());
        assertEquals(List.of("2026-11-20=0"), points(parsedZero));
        assertFalse(Arrays.equals(empty.toByteArray(), zero.toByteArray()));
    }

    @Test
    void getLatestRequestAndResponseRoundTrip() throws InvalidProtocolBufferException {
        GetLatestSecurityMetricRequestProto request = GetLatestSecurityMetricRequestProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST)
                .addSecurityIds(SPY)
                .addSecurityIds(QQQ)
                .addMetrics(SecurityMetricTypeProto.TOTAL_NET_ASSETS)
                .setDate(date(2026, 11, 20))
                .setAsOf(AS_OF)
                .build();
        GetLatestSecurityMetricResponseProto response = GetLatestSecurityMetricResponseProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE)
                .addSeries(series(SPY, SecurityMetricTypeProto.TOTAL_NET_ASSETS,
                        point(date(2026, 11, 19), "5100000000")))
                .addSeries(series(QQQ, SecurityMetricTypeProto.TOTAL_NET_ASSETS))
                .build();

        GetLatestSecurityMetricRequestProto parsedRequest =
                GetLatestSecurityMetricRequestProto.parseFrom(request.toByteArray());
        GetLatestSecurityMetricResponseProto parsedResponse =
                GetLatestSecurityMetricResponseProto.parseFrom(response.toByteArray());

        assertEquals(request, parsedRequest);
        assertEquals(List.of(SPY, QQQ), parsedRequest.getSecurityIdsList());
        assertEquals(List.of(SecurityMetricTypeProto.TOTAL_NET_ASSETS), parsedRequest.getMetricsList());
        assertEquals(date(2026, 11, 20), parsedRequest.getDate());
        assertEquals(AS_OF, parsedRequest.getAsOf());

        assertEquals(response, parsedResponse);
        assertEquals(2, parsedResponse.getSeriesCount());
        assertEquals(SPY, parsedResponse.getSeries(0).getSecurityId());
        assertEquals(List.of("2026-11-19=5100000000"), points(parsedResponse.getSeries(0)));
        assertEquals(QQQ, parsedResponse.getSeries(1).getSecurityId());
        assertEquals(SecurityMetricTypeProto.TOTAL_NET_ASSETS, parsedResponse.getSeries(1).getMetric());
        assertEquals(0, parsedResponse.getSeries(1).getPointsCount());
    }

    @Test
    void searchRequestAndResponseRoundTrip() throws InvalidProtocolBufferException {
        SearchSecurityMetricRequestProto request = SearchSecurityMetricRequestProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST)
                .setSecurityId(SPY)
                .addMetrics(SecurityMetricTypeProto.NAV_PER_SHARE)
                .addMetrics(SecurityMetricTypeProto.SHARES_OUTSTANDING)
                .setStartDate(date(2026, 11, 1))
                .setEndDate(date(2026, 11, 20))
                .setAsOf(AS_OF)
                .build();
        SearchSecurityMetricResponseProto response = SearchSecurityMetricResponseProto.newBuilder()
                .setObjectType(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
                .setSeries(series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE,
                        point(date(2026, 11, 19), "100.98"),
                        point(date(2026, 11, 20), "101.42")))
                .build();

        SearchSecurityMetricRequestProto parsedRequest =
                SearchSecurityMetricRequestProto.parseFrom(request.toByteArray());
        SearchSecurityMetricResponseProto parsedResponse =
                SearchSecurityMetricResponseProto.parseFrom(response.toByteArray());

        assertEquals(request, parsedRequest);
        assertEquals(SPY, parsedRequest.getSecurityId());
        assertEquals(List.of(SecurityMetricTypeProto.NAV_PER_SHARE, SecurityMetricTypeProto.SHARES_OUTSTANDING),
                parsedRequest.getMetricsList());
        assertEquals(date(2026, 11, 1), parsedRequest.getStartDate());
        assertEquals(date(2026, 11, 20), parsedRequest.getEndDate());
        assertEquals(AS_OF, parsedRequest.getAsOf());

        assertEquals(response, parsedResponse);
        assertEquals(SecurityMetricTypeProto.NAV_PER_SHARE, parsedResponse.getSeries().getMetric());
        assertEquals(List.of("2026-11-19=100.98", "2026-11-20=101.42"), points(parsedResponse.getSeries()));
    }

    @Test
    void sparseExpenseRatioSeriesRoundTripsWithExactDecimals() throws InvalidProtocolBufferException {
        // LM-491: one point per change, dated by the date the ratio takes effect.
        SecurityMetricSeriesProto original = series(SPY, SecurityMetricTypeProto.EXPENSE_RATIO,
                point(date(2018, 1, 1), "0.0945"),
                point(date(2026, 1, 1), "0.0900"));

        SecurityMetricSeriesProto parsed = SecurityMetricSeriesProto.parseFrom(original.toByteArray());

        assertEquals(original, parsed);
        assertEquals(SecurityMetricTypeProto.EXPENSE_RATIO, parsed.getMetric());
        assertEquals(4, parsed.getMetricValue());
        assertEquals(List.of("2018-1-1=0.0945", "2026-1-1=0.0900"), points(parsed));
    }
}
