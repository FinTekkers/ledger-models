package fintekkers.services;

import common.util.ObjectTypes;
import fintekkers.models.security.SecurityMetricPointProto;
import fintekkers.models.security.SecurityMetricSeriesProto;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.security_metric.CreateSecurityMetricRequestProto;
import fintekkers.requests.security_metric.CreateSecurityMetricResponseProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import fintekkers.services.security_metric_service.SecurityMetricGrpc;
import io.grpc.Server;
import io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tests only (LM-485): an in-memory SecurityMetric gRPC service on
 * 127.0.0.1, a free port. Counts calls per RPC and keeps every request.
 *
 * <ul>
 *   <li>GetLatest answers in REVERSE request order and omits a security it
 *       holds nothing for; a known security with no point on or before the
 *       date gets a zero-point series.</li>
 *   <li>Search streams the range in chunks of 2 points, or one zero-point
 *       message.</li>
 *   <li>CreateOrUpdate stores the points and stamps a distinct as_of per
 *       call: 2026-11-23T21:00:00Z plus the call count in seconds.</li>
 * </ul>
 */
final class FakeSecurityMetricServer implements AutoCloseable {

    static final UUID SPY = UUID.fromString("00000000-0000-0000-0000-00000000005a");
    static final ZonedDateTime AS_OF_BASE = ZonedDateTime.of(2026, 11, 23, 21, 0, 0, 0, ZoneOffset.UTC);

    final AtomicInteger getLatestCalls = new AtomicInteger();
    final AtomicInteger searchCalls = new AtomicInteger();
    final AtomicInteger createCalls = new AtomicInteger();
    final List<GetLatestSecurityMetricRequestProto> getLatestRequests = new CopyOnWriteArrayList<>();
    final List<SearchSecurityMetricRequestProto> searchRequests = new CopyOnWriteArrayList<>();
    final List<CreateSecurityMetricRequestProto> createRequests = new CopyOnWriteArrayList<>();
    final List<ZonedDateTime> stampedAsOfs = new CopyOnWriteArrayList<>();

    private final Map<UUID, Map<SecurityMetricTypeProto, TreeMap<LocalDate, BigDecimal>>> store = new ConcurrentHashMap<>();
    private final Server server;

    FakeSecurityMetricServer() throws IOException {
        seed(SPY, SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2026, 11, 19), "15204137000");
        seed(SPY, SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2026, 11, 20), "15210000000");
        server = NettyServerBuilder.forAddress(new InetSocketAddress("127.0.0.1", 0))
                .addService(new Service())
                .build()
                .start();
    }

    int port() {
        return server.getPort();
    }

    synchronized void seed(UUID security, SecurityMetricTypeProto metric, LocalDate date, String value) {
        store.computeIfAbsent(security, k -> new EnumMap<>(SecurityMetricTypeProto.class))
                .computeIfAbsent(metric, k -> new TreeMap<>())
                .put(date, new BigDecimal(value));
    }

    @Override
    public void close() throws InterruptedException {
        server.shutdownNow();
        server.awaitTermination(5, TimeUnit.SECONDS);
    }

    private synchronized NavigableMap<LocalDate, BigDecimal> points(UUID security, SecurityMetricTypeProto metric) {
        Map<SecurityMetricTypeProto, TreeMap<LocalDate, BigDecimal>> byMetric = store.get(security);
        TreeMap<LocalDate, BigDecimal> points = byMetric == null ? null : byMetric.get(metric);
        return points == null ? new TreeMap<>() : new TreeMap<>(points);
    }

    private static SecurityMetricSeriesProto.Builder header(UUIDProto security, SecurityMetricTypeProto metric) {
        return ObjectTypes.stamp(SecurityMetricSeriesProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES)
                .setSecurityId(security)
                .setMetric(metric)
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF_BASE));
    }

    private static SecurityMetricPointProto point(Entry<LocalDate, BigDecimal> e) {
        return SecurityMetricPointProto.newBuilder()
                .setObservationDate(ProtoSerializationUtil.serializeLocalDate(e.getKey()))
                .setValue(ProtoSerializationUtil.serializeBigDecimal(e.getValue()))
                .build();
    }

    private final class Service extends SecurityMetricGrpc.SecurityMetricImplBase {

        @Override
        public void getLatest(GetLatestSecurityMetricRequestProto request,
                              StreamObserver<GetLatestSecurityMetricResponseProto> out) {
            getLatestCalls.incrementAndGet();
            getLatestRequests.add(request);
            LocalDate on = ProtoSerializationUtil.deserializeRequiredLocalDate(request.getDate(), "date");
            GetLatestSecurityMetricResponseProto.Builder response = ObjectTypes.stamp(
                    GetLatestSecurityMetricResponseProto.newBuilder(),
                    ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_RESPONSE);
            List<UUIDProto> ids = new ArrayList<>(request.getSecurityIdsList());
            for (int i = ids.size() - 1; i >= 0; i--) {
                UUID id = ProtoSerializationUtil.deserializeUUID(ids.get(i));
                if (!store.containsKey(id)) continue;
                for (SecurityMetricTypeProto metric : request.getMetricsList()) {
                    SecurityMetricSeriesProto.Builder series = header(ids.get(i), metric);
                    Entry<LocalDate, BigDecimal> latest = points(id, metric).floorEntry(on);
                    if (latest != null) series.addPoints(point(latest));
                    response.addSeries(series);
                }
            }
            out.onNext(response.build());
            out.onCompleted();
        }

        @Override
        public void search(SearchSecurityMetricRequestProto request,
                           StreamObserver<SearchSecurityMetricResponseProto> out) {
            searchCalls.incrementAndGet();
            searchRequests.add(request);
            UUID id = ProtoSerializationUtil.deserializeUUID(request.getSecurityId());
            SecurityMetricTypeProto metric = request.getMetrics(0);
            LocalDate from = ProtoSerializationUtil.deserializeRequiredLocalDate(request.getStartDate(), "start_date");
            LocalDate to = ProtoSerializationUtil.deserializeRequiredLocalDate(request.getEndDate(), "end_date");
            List<Entry<LocalDate, BigDecimal>> range = new ArrayList<>(points(id, metric).subMap(from, true, to, true).entrySet());
            int i = 0;
            do {
                SecurityMetricSeriesProto.Builder series = header(request.getSecurityId(), metric);
                for (int j = i; j < Math.min(i + 2, range.size()); j++) series.addPoints(point(range.get(j)));
                out.onNext(ObjectTypes.stamp(SearchSecurityMetricResponseProto.newBuilder(),
                                ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_RESPONSE)
                        .setSeries(series)
                        .build());
                i += 2;
            } while (i < range.size());
            out.onCompleted();
        }

        @Override
        public void createOrUpdate(CreateSecurityMetricRequestProto request,
                                   StreamObserver<CreateSecurityMetricResponseProto> out) {
            int call = createCalls.incrementAndGet();
            createRequests.add(request);
            SecurityMetricSeriesProto series = request.getSeries();
            UUID id = ProtoSerializationUtil.deserializeUUID(series.getSecurityId());
            for (SecurityMetricPointProto p : series.getPointsList()) {
                synchronized (FakeSecurityMetricServer.this) {
                    store.computeIfAbsent(id, k -> new EnumMap<>(SecurityMetricTypeProto.class))
                            .computeIfAbsent(series.getMetric(), k -> new TreeMap<>())
                            .put(ProtoSerializationUtil.deserializeRequiredLocalDate(p.getObservationDate(), "observation_date"),
                                    ProtoSerializationUtil.deserializeBigDecimal(p.getValue()));
                }
            }
            ZonedDateTime asOf = AS_OF_BASE.plusSeconds(call);
            stampedAsOfs.add(asOf);
            out.onNext(ObjectTypes.stamp(CreateSecurityMetricResponseProto.newBuilder(),
                            ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_RESPONSE)
                    .setOperationType(request.getOperationType())
                    .setSeries(header(series.getSecurityId(), series.getMetric())
                            .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf)))
                    .build());
            out.onCompleted();
        }
    }
}
