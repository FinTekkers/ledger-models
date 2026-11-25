package fintekkers.services;

import common.models.security.Security;
import common.models.security.metric.MetricResult;
import common.models.security.metric.MetricSeries;
import common.models.security.metric.MetricSeries.MetricPoint;
import common.models.security.metric.SecurityMetricException;
import common.models.security.metric.SecurityMetricException.InvalidMetricPoints;
import common.models.security.metric.SecurityMetricServiceException;
import common.models.security.metric.SecurityMetrics;
import common.util.ObjectTypes;
import fintekkers.models.security.SecurityMetricPointProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.requests.security_metric.CreateSecurityMetricRequestProto;
import fintekkers.requests.security_metric.CreateSecurityMetricResponseProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.ServerSocket;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static fintekkers.services.FakeSecurityMetricServer.SPY;
import static fintekkers.models.security.SecurityMetricTypeProto.EXPENSE_RATIO;
import static fintekkers.models.security.SecurityMetricTypeProto.NAV_PER_SHARE;
import static fintekkers.models.security.SecurityMetricTypeProto.SHARES_OUTSTANDING;
import static fintekkers.models.security.SecurityMetricTypeProto.TOTAL_NET_ASSETS;
import static fintekkers.models.security.SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-485: SecurityMetricService and the Security metric helpers through the
 * real gRPC stack against {@link FakeSecurityMetricServer}. The default
 * service is built from an injected environment and installed as the
 * singleton, so {@code security.getMetric} goes through it.
 */
class SecurityMetricServiceTest {

    private static final LocalDate MONDAY = LocalDate.of(2026, 11, 23);
    private static final LocalDate FRIDAY = LocalDate.of(2026, 11, 20);

    private FakeSecurityMetricServer fake;
    private Security.Fetcher previousSecurityFetcher;

    @BeforeEach
    void setUp() throws IOException {
        fake = new FakeSecurityMetricServer();
        // A link-mode security must not be hydrated to read its metrics.
        previousSecurityFetcher = Security.getFetcher();
        Security.setFetcher((uuid, asOf) -> {
            throw new AssertionError("security metrics must not hydrate the security " + uuid);
        });
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        SecurityMetricService.resetForTests();
        Security.setFetcher(previousSecurityFetcher);
        fake.close();
    }

    private static SecurityMetricService installFromEnv(int port) {
        SecurityMetricService service = SecurityMetricService.fromEnv(
                Map.of("PRICE_SERVICE_HOST", "127.0.0.1", "PRICE_SERVICE_PORT", String.valueOf(port))::get);
        SecurityMetricService.setInstanceForTests(service);
        return service;
    }

    private static Security security(UUID id) {
        return new Security(Security.linkOfLatest(id));
    }

    // 1
    @Test
    void defaultFetcherJourneyFromInjectedEnv() {
        SecurityMetricService service = installFromEnv(fake.port());
        assertNull(SecurityMetricService.getFetcher());
        assertEquals(new Endpoint("127.0.0.1", fake.port(), true), service.getEndpoint());
        assertTrue(SecurityMetricService.getInstance() == service);
        Security spy = security(SPY);

        MetricResult viaMetric = spy.getMetric(SHARES_OUTSTANDING, MONDAY);
        assertEquals(1, fake.getLatestCalls.get());
        MetricResult viaShortcut = spy.sharesOutstanding(MONDAY);
        assertEquals(2, fake.getLatestCalls.get());

        assertEquals(viaMetric, viaShortcut);
        assertEquals(new BigDecimal("15210000000"), viaMetric.value());
        assertEquals(FRIDAY, viaMetric.date());
        assertEquals(MONDAY, viaMetric.on());
        assertEquals(3, viaMetric.ageDays());
        assertTrue(spy.isLink(), "the security stays a link");

        GetLatestSecurityMetricRequestProto request = fake.getLatestRequests.get(0);
        assertEquals(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST, ObjectTypes.readType(request));
        assertEquals(List.of(ProtoSerializationUtil.serializeUUID(SPY)), request.getSecurityIdsList());
        assertEquals(List.of(SHARES_OUTSTANDING), request.getMetricsList());
    }

    @Test
    void genericGetMetricReturnsTheExpenseRatioInForceBetweenTwoChanges() {
        // LM-491: a sparse series, one point per change; GetLatest gives the ratio in force.
        installFromEnv(fake.port());
        UUID fund = UUID.randomUUID();
        fake.seed(fund, EXPENSE_RATIO, LocalDate.of(2018, 1, 1), "0.0945");
        fake.seed(fund, EXPENSE_RATIO, LocalDate.of(2026, 7, 1), "0.0900");
        LocalDate between = LocalDate.of(2026, 3, 31);

        MetricResult result = security(fund).getMetric(EXPENSE_RATIO, between);

        assertEquals(new BigDecimal("0.0945"), result.value());
        assertEquals(LocalDate.of(2018, 1, 1), result.date());
        assertEquals(between, result.on());
        assertEquals(List.of(EXPENSE_RATIO), fake.getLatestRequests.get(0).getMetricsList());
    }

    // 2
    @Test
    void omittedOnIsTheDateSentToTheService() {
        installFromEnv(fake.port());
        UUID old = UUID.randomUUID();
        fake.seed(old, NAV_PER_SHARE, LocalDate.of(2000, 1, 3), "101.25");

        MetricResult result = security(old).getMetric(NAV_PER_SHARE);

        assertEquals(1, fake.getLatestCalls.get());
        LocalDate recorded = ProtoSerializationUtil.deserializeRequiredLocalDate(
                fake.getLatestRequests.get(0).getDate(), "date");
        assertEquals(recorded, result.on());
        assertEquals(ChronoUnit.DAYS.between(result.date(), recorded), result.ageDays());
        assertEquals("101.25", result.value().toPlainString());

        MetricResult shortcut = security(old).navPerShare();
        LocalDate recorded2 = ProtoSerializationUtil.deserializeRequiredLocalDate(
                fake.getLatestRequests.get(1).getDate(), "date");
        assertEquals(recorded2, shortcut.on());
    }

    // 3
    @Test
    void historyJoinsThreeChunksAndKeepsTheGap() {
        installFromEnv(fake.port());
        UUID fund = UUID.randomUUID();
        String[][] seeded = {{"2026-11-16", "500.10"}, {"2026-11-17", "501.20"}, {"2026-11-18", "502.30"},
                {"2026-11-20", "504.50"}, {"2026-11-23", "505.60"}};
        TreeMap<LocalDate, BigDecimal> expected = new TreeMap<>();
        for (String[] p : seeded) {
            fake.seed(fund, NAV_PER_SHARE, LocalDate.parse(p[0]), p[1]);
            expected.put(LocalDate.parse(p[0]), new BigDecimal(p[1]));
        }

        MetricSeries series = security(fund).navPerShareHistory(LocalDate.of(2026, 11, 1), MONDAY);

        assertEquals(1, fake.searchCalls.get());
        assertEquals(fund, series.securityId());
        assertEquals(NAV_PER_SHARE, series.metric());
        assertEquals(FakeSecurityMetricServer.AS_OF_BASE, series.asOf());
        List<LocalDate> dates = new ArrayList<>();
        series.points().forEach(p -> dates.add(p.date()));
        assertEquals(new ArrayList<>(expected.keySet()), dates);
        assertFalse(dates.contains(LocalDate.of(2026, 11, 19)), "the gap stays a gap");
        assertEquals(new MetricPoint(MONDAY, new BigDecimal("505.60")), series.latest());
        assertEquals(expected, series.asDict());
        assertEquals("505.60", series.latest().value().toPlainString());

        MetricSeries viaGeneric = security(fund).getMetricHistory(NAV_PER_SHARE, LocalDate.of(2026, 11, 17), FRIDAY);
        assertEquals(3, viaGeneric.points().size());

        SecurityMetricException e = assertThrows(SecurityMetricException.class,
                () -> security(fund).navPerShareHistory(MONDAY, FRIDAY));
        assertEquals("from date 2026-11-23 is after to date 2026-11-20", e.getMessage());
        assertEquals(2, fake.searchCalls.get());
    }

    // 4
    @Test
    void batchGetMatchesBySecurityIdAndKeepsTheUnknownAsAbsent() {
        SecurityMetricService service = installFromEnv(fake.port());
        UUID qqq = UUID.randomUUID();
        UUID unknown = UUID.randomUUID();
        fake.seed(qqq, SHARES_OUTSTANDING, LocalDate.of(2026, 11, 18), "566950000");

        Map<UUID, MetricResult> result = service.get(SHARES_OUTSTANDING, List.of(SPY, qqq, unknown), MONDAY);

        assertEquals(1, fake.getLatestCalls.get());
        assertEquals(List.of(SPY, qqq, unknown), new ArrayList<>(result.keySet()));
        assertEquals(new BigDecimal("15210000000"), result.get(SPY).value());
        assertEquals(FRIDAY, result.get(SPY).date());
        assertEquals(new BigDecimal("566950000"), result.get(qqq).value());
        assertEquals(LocalDate.of(2026, 11, 18), result.get(qqq).date());
        assertTrue(result.containsKey(unknown));
        assertNull(result.get(unknown));

        assertTrue(service.get(SHARES_OUTSTANDING, List.of(), MONDAY).isEmpty());
        assertEquals(1, fake.getLatestCalls.get(), "no call for no UUIDs");
    }

    // 5
    @Test
    void recordSendsExactDecimalsAndChunks() {
        SecurityMetricService service = installFromEnv(fake.port());
        UUID fund = UUID.randomUUID();

        ZonedDateTime first = service.record(SHARES_OUTSTANDING, fund, Map.of(FRIDAY, new BigDecimal("15204137000")));

        assertEquals(1, fake.createCalls.get());
        CreateSecurityMetricRequestProto request = fake.createRequests.get(0);
        assertEquals(ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_REQUEST, ObjectTypes.readType(request));
        SecurityMetricPointProto point = request.getSeries().getPoints(0);
        assertEquals(new BigInteger("15204137000"), new BigInteger(point.getValue().getUnscaledValue().toByteArray()));
        assertEquals(0, point.getValue().getScale());
        assertEquals(ProtoSerializationUtil.serializeLocalDate(FRIDAY), point.getObservationDate());
        assertEquals(fake.stampedAsOfs.get(0), first);

        int n = SecurityMetrics.RECORD_CHUNK_SIZE + 1;
        List<MetricPoint> points = new ArrayList<>();
        LocalDate start = LocalDate.of(2000, 1, 1);
        for (int i = n - 1; i >= 0; i--) {   // given descending: sent ascending
            points.add(new MetricPoint(start.plusDays(i), BigDecimal.valueOf(1_000_000L + i)));
        }
        ZonedDateTime last = service.record(SHARES_OUTSTANDING, fund, points);

        assertEquals(3, fake.createCalls.get());
        List<CreateSecurityMetricRequestProto> chunks = fake.createRequests.subList(1, 3);
        assertEquals(SecurityMetrics.RECORD_CHUNK_SIZE, chunks.get(0).getSeries().getPointsCount());
        assertEquals(1, chunks.get(1).getSeries().getPointsCount());
        List<LocalDate> sent = new ArrayList<>();
        for (CreateSecurityMetricRequestProto c : chunks) {
            assertEquals(ProtoSerializationUtil.serializeUUID(fund), c.getSeries().getSecurityId());
            assertEquals(SHARES_OUTSTANDING, c.getSeries().getMetric());
            for (SecurityMetricPointProto p : c.getSeries().getPointsList()) {
                LocalDate d = ProtoSerializationUtil.deserializeRequiredLocalDate(p.getObservationDate(), "d");
                assertEquals(BigDecimal.valueOf(1_000_000L + ChronoUnit.DAYS.between(start, d)),
                        ProtoSerializationUtil.deserializeBigDecimal(p.getValue()));
                sent.add(d);
            }
        }
        assertEquals(n, sent.size());
        for (int i = 0; i < n; i++) assertEquals(start.plusDays(i), sent.get(i));
        assertEquals(fake.stampedAsOfs.get(2), last);
        assertNotEquals(fake.stampedAsOfs.get(1), last);
    }

    // 6
    @Test
    void fractionalSharesAndDuplicateDatesAreRejectedBeforeAnyCall() {
        SecurityMetricService service = installFromEnv(fake.port());

        InvalidMetricPoints fractional = assertThrows(InvalidMetricPoints.class,
                () -> service.record(SHARES_OUTSTANDING, SPY, Map.of(FRIDAY, new BigDecimal("1.5"))));
        assertEquals(List.of(new SecurityMetricException.Violation(FRIDAY, "fractional share count")),
                fractional.getViolations());
        assertTrue(fractional.getMessage().contains("2026-11-20: fractional share count (1.5)"), fractional.getMessage());

        InvalidMetricPoints duplicate = assertThrows(InvalidMetricPoints.class,
                () -> service.record(NAV_PER_SHARE, SPY, List.of(new MetricPoint(FRIDAY, new BigDecimal("1")),
                        new MetricPoint(FRIDAY, new BigDecimal("2")))));
        assertEquals(List.of(new SecurityMetricException.Violation(FRIDAY, "duplicate date")),
                duplicate.getViolations());

        assertEquals(0, fake.createCalls.get());
    }

    // 7
    @Test
    void unreachableServiceNamesTheAddress() throws IOException {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0, 1, java.net.InetAddress.getByName("127.0.0.1"))) {
            closedPort = socket.getLocalPort();
        }
        installFromEnv(closedPort);
        SecurityMetricService.setDeadlineForTests(Duration.ofSeconds(5));

        SecurityMetricServiceException.ServiceUnavailable e = assertThrows(
                SecurityMetricServiceException.ServiceUnavailable.class,
                () -> security(SPY).getMetric(SHARES_OUTSTANDING, MONDAY));
        assertTrue(e.getMessage().contains("127.0.0.1:" + closedPort), e.getMessage());
        assertTrue(e.getMessage().startsWith("SecurityMetric service unreachable at 127.0.0.1:" + closedPort),
                e.getMessage());
        assertEquals("UNAVAILABLE", e.getStatusCode());
    }

    // 9
    @Test
    void noValueIsNullThroughTheRealStack() {
        installFromEnv(fake.port());
        Security spy = security(SPY);

        // SPY is known but has no point on or before 2026-11-01, and no NAV at all.
        assertNull(spy.getMetric(SHARES_OUTSTANDING, LocalDate.of(2026, 11, 1)));
        assertNull(spy.sharesOutstanding(LocalDate.of(2026, 11, 1)));
        assertNull(spy.navPerShare(MONDAY));
        // Unknown security: no series at all.
        assertNull(security(UUID.randomUUID()).totalNetAssets(MONDAY));
        assertEquals(4, fake.getLatestCalls.get());

        MetricSeries empty = spy.totalNetAssetsHistory(LocalDate.of(2026, 11, 1), MONDAY);
        assertTrue(empty.points().isEmpty());
        assertNull(empty.latest());
    }

    // 10
    @Test
    void missingSecurityIdAndUnknownMetricAreNamed() {
        installFromEnv(fake.port());
        Security noId = new Security(Security.linkOfLatest(SPY)) {
            {
                id = null;
            }
        };

        SecurityMetricException.MissingSecurityId missing = assertThrows(
                SecurityMetricException.MissingSecurityId.class, () -> noId.getMetric(SHARES_OUTSTANDING, MONDAY));
        assertEquals("security has no UUID: cannot fetch its metrics", missing.getMessage());
        assertThrows(SecurityMetricException.MissingSecurityId.class, noId::sharesOutstanding);
        assertThrows(SecurityMetricException.MissingSecurityId.class, () -> noId.navPerShareHistory(FRIDAY));

        SecurityMetricException.UnknownMetric unknown = assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> security(SPY).getMetric(UNKNOWN_SECURITY_METRIC, MONDAY));
        assertTrue(unknown.getMessage().contains("UNKNOWN_SECURITY_METRIC"), unknown.getMessage());
        assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetricService.getInstance().get(UNKNOWN_SECURITY_METRIC, List.of()));
        assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetricService.getInstance().getHistory(UNKNOWN_SECURITY_METRIC, SPY, FRIDAY));
        assertThrows(SecurityMetricException.UnknownMetric.class,
                () -> SecurityMetricService.getInstance().record(UNKNOWN_SECURITY_METRIC, SPY, Map.of()));
        assertInstanceOf(IllegalArgumentException.class, unknown);

        assertEquals(0, fake.getLatestCalls.get() + fake.searchCalls.get() + fake.createCalls.get());
    }

    @Test
    void serviceErrorsNameTheAddressAndStatus() throws IOException {
        // A service with no RPCs implemented answers UNIMPLEMENTED.
        io.grpc.Server failing = io.grpc.netty.NettyServerBuilder
                .forAddress(new java.net.InetSocketAddress("127.0.0.1", 0))
                .addService(new fintekkers.services.security_metric_service.SecurityMetricGrpc.SecurityMetricImplBase() {
                })
                .build().start();
        try {
            SecurityMetricService service = installFromEnv(failing.getPort());
            SecurityMetricServiceException e = assertThrows(SecurityMetricServiceException.class,
                    () -> service.get(TOTAL_NET_ASSETS, List.of(SPY), MONDAY));
            assertTrue(e.getMessage().startsWith("SecurityMetric GetLatest failed at 127.0.0.1:" + failing.getPort()
                    + ": UNIMPLEMENTED"), e.getMessage());
            assertEquals("UNIMPLEMENTED", e.getStatusCode());
            SecurityMetricServiceException s = assertThrows(SecurityMetricServiceException.class,
                    () -> service.getHistory(TOTAL_NET_ASSETS, SPY, FRIDAY, MONDAY));
            assertTrue(s.getMessage().contains("Search failed at 127.0.0.1:" + failing.getPort()), s.getMessage());
        } finally {
            failing.shutdownNow();
        }
    }

    @Test
    void installedFetcherReplacesGrpcAndNullRestoresIt() {
        installFromEnv(fake.port());
        AtomicInteger calls = new AtomicInteger();
        SecurityMetricService.Fetcher canned = new SecurityMetricService.Fetcher() {
            @Override
            public GetLatestSecurityMetricResponseProto getLatest(GetLatestSecurityMetricRequestProto request) {
                calls.incrementAndGet();
                return GetLatestSecurityMetricResponseProto.getDefaultInstance();
            }

            @Override
            public Iterator<SearchSecurityMetricResponseProto> search(SearchSecurityMetricRequestProto request) {
                calls.incrementAndGet();
                return List.<SearchSecurityMetricResponseProto>of().iterator();
            }

            @Override
            public CreateSecurityMetricResponseProto createOrUpdate(CreateSecurityMetricRequestProto request) {
                calls.incrementAndGet();
                throw new SecurityMetricServiceException("SecurityMetric CreateOrUpdate failed at test: INTERNAL");
            }
        };
        SecurityMetricService.setFetcher(canned);
        assertTrue(SecurityMetricService.getFetcher() == canned);

        assertNull(security(SPY).sharesOutstanding(MONDAY));
        assertTrue(security(SPY).sharesOutstandingHistory(FRIDAY, MONDAY).points().isEmpty());
        assertEquals(2, calls.get());
        assertEquals(0, fake.getLatestCalls.get());

        SecurityMetricService.setFetcher(null);
        assertEquals(new BigDecimal("15210000000"), security(SPY).sharesOutstanding(MONDAY).value());
        assertEquals(1, fake.getLatestCalls.get());
    }

    @Test
    void laterChunkFailureSaysHowManyPointsWereStored() {
        installFromEnv(fake.port());
        AtomicInteger creates = new AtomicInteger();
        SecurityMetricService.setFetcher(new SecurityMetricService.Fetcher() {
            @Override
            public GetLatestSecurityMetricResponseProto getLatest(GetLatestSecurityMetricRequestProto request) {
                throw new AssertionError();
            }

            @Override
            public Iterator<SearchSecurityMetricResponseProto> search(SearchSecurityMetricRequestProto request) {
                throw new AssertionError();
            }

            @Override
            public CreateSecurityMetricResponseProto createOrUpdate(CreateSecurityMetricRequestProto request) {
                if (creates.incrementAndGet() == 2) {
                    throw new SecurityMetricServiceException.ServiceUnavailable(
                            "SecurityMetric service unreachable at 127.0.0.1:8083", null);
                }
                return CreateSecurityMetricResponseProto.getDefaultInstance();
            }
        });
        List<MetricPoint> points = new ArrayList<>();
        for (int i = 0; i < SecurityMetrics.RECORD_CHUNK_SIZE + 1; i++) {
            points.add(new MetricPoint(LocalDate.of(2000, 1, 1).plusDays(i), BigDecimal.ONE));
        }
        SecurityMetricServiceException.ServiceUnavailable e = assertThrows(
                SecurityMetricServiceException.ServiceUnavailable.class,
                () -> SecurityMetricService.getInstance().record(TOTAL_NET_ASSETS, SPY, points));
        assertTrue(e.getMessage().contains("127.0.0.1:8083"), e.getMessage());
        assertTrue(e.getMessage().endsWith(SecurityMetrics.RECORD_CHUNK_SIZE + " points already stored"), e.getMessage());
    }

    @Test
    void portWithoutHostFallsBackAndBrokerWins() {
        SecurityMetricService broker = SecurityMetricService.fromEnv(Map.of("BROKER_HOST", "broker.example:9000",
                "PRICE_SERVICE_HOST", "127.0.0.1")::get);
        assertEquals(new Endpoint("broker.example", 9000, false), broker.getEndpoint());
        broker.shutdown();
        SecurityMetricService price = SecurityMetricService.fromEnv(Map.of("PRICE_SERVICE_HOST", "localhost")::get);
        assertEquals(new Endpoint("localhost", ServiceAddress.PRICE_PORT, true), price.getEndpoint());
        price.shutdown();
    }
}
