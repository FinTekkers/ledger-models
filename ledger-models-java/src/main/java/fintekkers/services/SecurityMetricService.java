package fintekkers.services;

import common.models.security.metric.MetricResult;
import common.models.security.metric.MetricSeries;
import common.models.security.metric.MetricSeries.MetricPoint;
import common.models.security.metric.SecurityMetricException;
import common.models.security.metric.SecurityMetricServiceException;
import common.models.security.metric.SecurityMetrics;
import fintekkers.models.security.SecurityMetricTypeProto;
import fintekkers.requests.security_metric.CreateSecurityMetricRequestProto;
import fintekkers.requests.security_metric.CreateSecurityMetricResponseProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto;
import fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto;
import fintekkers.requests.security_metric.SearchSecurityMetricRequestProto;
import fintekkers.requests.security_metric.SearchSecurityMetricResponseProto;
import fintekkers.services.security_metric_service.SecurityMetricGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Client for the SecurityMetric service (LM-485): shares outstanding, NAV per
 * share and total net assets of a security, by date. Mirrors the shape of
 * {@link SecurityService}.
 *
 * <p>The default endpoint comes from {@link ServiceAddress} for the price
 * service: the broker when {@code BROKER_HOST} is set, else
 * {@code PRICE_SERVICE_HOST/_PORT}, else {@code API_URL}, else
 * {@code localhost}, on the price port.
 *
 * <p>A missing value is {@code null}, never 0. Caller mistakes throw a
 * {@link SecurityMetricException} before any call; service failures throw a
 * {@link SecurityMetricServiceException} naming {@code host:port} and the
 * gRPC status ({@link SecurityMetricServiceException.ServiceUnavailable} when
 * the service cannot be reached).
 */
public class SecurityMetricService {

    /** The three SecurityMetric RPCs. Install one with {@link #setFetcher(Fetcher)} to replace gRPC. */
    public interface Fetcher {
        GetLatestSecurityMetricResponseProto getLatest(GetLatestSecurityMetricRequestProto request);

        /** The Search responses, one chunk of points each, in order. */
        Iterator<SearchSecurityMetricResponseProto> search(SearchSecurityMetricRequestProto request);

        CreateSecurityMetricResponseProto createOrUpdate(CreateSecurityMetricRequestProto request);
    }

    /** Deadline of each gRPC call made by the default fetcher. */
    static final Duration DEFAULT_DEADLINE = Duration.ofSeconds(30);

    private static volatile SecurityMetricService defaultInstance;
    private static volatile Fetcher fetcher;
    private static volatile Duration deadline = DEFAULT_DEADLINE;

    private final Endpoint endpoint;
    private final ManagedChannel channel;
    private final Fetcher grpcFetcher;

    public SecurityMetricService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        this.channel = builder.build();
        this.endpoint = new Endpoint(url, port, isHttp);
        this.grpcFetcher = new GrpcFetcher(SecurityMetricGrpc.newBlockingStub(channel), url + ":" + port);
    }

    static SecurityMetricService fromEnv(Function<String, String> env) {
        Endpoint e = ServiceAddress.resolve(ServiceAddress.Service.PRICE, env);
        return new SecurityMetricService(e.url(), e.port(), e.isHttp());
    }

    /**
     * Built on first call, not at class load, so a bad environment value
     * fails every call with the message naming the variable. Used by
     * {@code Security.getMetric} and its shortcuts.
     */
    public static SecurityMetricService getInstance() {
        SecurityMetricService instance = defaultInstance;
        if (instance == null) {
            synchronized (SecurityMetricService.class) {
                instance = defaultInstance;
                if (instance == null) {
                    instance = fromEnv(System::getenv);
                    defaultInstance = instance;
                }
            }
        }
        return instance;
    }

    /** Tests only: makes {@code instance} what {@link #getInstance()} returns. */
    static void setInstanceForTests(SecurityMetricService instance) {
        synchronized (SecurityMetricService.class) {
            SecurityMetricService previous = defaultInstance;
            defaultInstance = instance;
            if (previous != null && previous != instance) previous.shutdown();
        }
    }

    /** Tests only: drops the default instance, the installed fetcher and any test deadline. */
    static void resetForTests() {
        setInstanceForTests(null);
        fetcher = null;
        deadline = DEFAULT_DEADLINE;
    }

    /** Tests only: the deadline of each default-fetcher gRPC call; {@code null} restores 30 seconds. */
    static void setDeadlineForTests(Duration d) {
        deadline = d == null ? DEFAULT_DEADLINE : d;
    }

    /**
     * Replaces the gRPC calls of every instance with {@code f} (canned
     * responses in tests, an in-process service). {@code null} restores
     * gRPC.
     */
    public static void setFetcher(Fetcher f) {
        fetcher = f;
    }

    /** The installed fetcher, or {@code null} when calls go over gRPC. */
    public static Fetcher getFetcher() {
        return fetcher;
    }

    public Endpoint getEndpoint() {
        return endpoint;
    }

    void shutdown() {
        channel.shutdownNow();
    }

    private Fetcher activeFetcher() {
        Fetcher f = fetcher;
        return f != null ? f : grpcFetcher;
    }

    /** {@link #get(SecurityMetricTypeProto, Collection, LocalDate)} on today's local date. */
    public Map<UUID, MetricResult> get(SecurityMetricTypeProto metric, Collection<UUID> securityIds) {
        return get(metric, securityIds, LocalDate.now());
    }

    /**
     * The latest value on or before {@code on} of {@code metric} for each
     * security, in one GetLatest call. Every given UUID is a key; its value
     * is {@code null} when the service has none. No UUIDs: an empty map and
     * no call.
     */
    public Map<UUID, MetricResult> get(SecurityMetricTypeProto metric, Collection<UUID> securityIds, LocalDate on) {
        SecurityMetrics.checkMetric(metric);
        if (securityIds.isEmpty()) return Map.of();
        GetLatestSecurityMetricRequestProto request = SecurityMetrics.buildGetLatest(metric, securityIds, on);
        GetLatestSecurityMetricResponseProto response = activeFetcher().getLatest(request);
        return SecurityMetrics.mapLatest(response, metric, securityIds, on);
    }

    /** {@link #getHistory(SecurityMetricTypeProto, UUID, LocalDate, LocalDate)} up to today's local date. */
    public MetricSeries getHistory(SecurityMetricTypeProto metric, UUID securityId, LocalDate from) {
        return getHistory(metric, securityId, from, LocalDate.now());
    }

    /** Every point of {@code metric} from {@code from} to {@code to} inclusive, ascending, in one Search call. */
    public MetricSeries getHistory(SecurityMetricTypeProto metric, UUID securityId, LocalDate from, LocalDate to) {
        SearchSecurityMetricRequestProto request = SecurityMetrics.buildSearch(metric, securityId, from, to);
        return SecurityMetrics.mergeChunks(activeFetcher().search(request), securityId, metric);
    }

    /** {@link #record(SecurityMetricTypeProto, UUID, List)} from a map of date to value. */
    public ZonedDateTime record(SecurityMetricTypeProto metric, UUID securityId, Map<LocalDate, BigDecimal> points) {
        return store(metric, securityId, () -> SecurityMetrics.validateRecord(metric, points));
    }

    /**
     * Stores points of {@code metric}, checked before any call
     * ({@link SecurityMetricException.InvalidMetricPoints} lists every bad
     * point), in CreateOrUpdate calls of at most
     * {@link SecurityMetrics#RECORD_CHUNK_SIZE} points.
     *
     * @return the as_of the service stamped on the last call
     */
    public ZonedDateTime record(SecurityMetricTypeProto metric, UUID securityId, List<MetricPoint> points) {
        return store(metric, securityId, () -> SecurityMetrics.validateRecord(metric, points));
    }

    private ZonedDateTime store(SecurityMetricTypeProto metric, UUID securityId, Supplier<List<MetricPoint>> validate) {
        SecurityMetrics.checkMetric(metric);
        if (securityId == null) throw new SecurityMetricException.MissingSecurityId();
        List<MetricPoint> valid = validate.get();
        Fetcher f = activeFetcher();
        CreateSecurityMetricResponseProto last = null;
        int stored = 0;
        for (List<MetricPoint> chunk : SecurityMetrics.chunkRecord(valid, SecurityMetrics.RECORD_CHUNK_SIZE)) {
            CreateSecurityMetricRequestProto request = SecurityMetrics.buildCreate(metric, securityId, chunk);
            try {
                last = f.createOrUpdate(request);
            } catch (SecurityMetricServiceException e) {
                if (stored == 0) throw e;
                String message = e.getMessage() + "; " + stored + " points already stored";
                throw e instanceof SecurityMetricServiceException.ServiceUnavailable
                        ? new SecurityMetricServiceException.ServiceUnavailable(message, e)
                        : new SecurityMetricServiceException(message, e.getStatusCode(), e);
            }
            stored += chunk.size();
        }
        if (last == null || !last.hasSeries() || !last.getSeries().hasAsOf()) {
            throw new SecurityMetricServiceException("SecurityMetric CreateOrUpdate at " + address()
                    + " returned no series.as_of");
        }
        return ProtoSerializationUtil.deserializeTimestamp(last.getSeries().getAsOf(), "series.as_of");
    }

    private String address() {
        return endpoint.url() + ":" + endpoint.port();
    }

    /** gRPC calls with a deadline; status errors become SecurityMetricServiceException naming the address. */
    private static final class GrpcFetcher implements Fetcher {
        private final SecurityMetricGrpc.SecurityMetricBlockingStub stub;
        private final String address;

        GrpcFetcher(SecurityMetricGrpc.SecurityMetricBlockingStub stub, String address) {
            this.stub = stub;
            this.address = address;
        }

        private SecurityMetricGrpc.SecurityMetricBlockingStub withDeadline() {
            return stub.withDeadlineAfter(deadline.toMillis(), TimeUnit.MILLISECONDS);
        }

        @Override
        public GetLatestSecurityMetricResponseProto getLatest(GetLatestSecurityMetricRequestProto request) {
            try {
                return withDeadline().getLatest(request);
            } catch (StatusRuntimeException e) {
                throw error("GetLatest", e);
            }
        }

        /** Reads the whole stream inside the deadline so a failure mid-stream is mapped too. */
        @Override
        public Iterator<SearchSecurityMetricResponseProto> search(SearchSecurityMetricRequestProto request) {
            try {
                List<SearchSecurityMetricResponseProto> chunks = new ArrayList<>();
                withDeadline().search(request).forEachRemaining(chunks::add);
                return chunks.iterator();
            } catch (StatusRuntimeException e) {
                throw error("Search", e);
            }
        }

        @Override
        public CreateSecurityMetricResponseProto createOrUpdate(CreateSecurityMetricRequestProto request) {
            try {
                return withDeadline().createOrUpdate(request);
            } catch (StatusRuntimeException e) {
                throw error("CreateOrUpdate", e);
            }
        }

        private SecurityMetricServiceException error(String rpc, StatusRuntimeException e) {
            Status status = e.getStatus();
            String details = status.getDescription() == null ? "" : " (" + status.getDescription() + ")";
            if (status.getCode() == Status.Code.UNAVAILABLE) {
                return new SecurityMetricServiceException.ServiceUnavailable(
                        "SecurityMetric service unreachable at " + address + details, e);
            }
            return new SecurityMetricServiceException(
                    "SecurityMetric " + rpc + " failed at " + address + ": " + status.getCode() + details,
                    status.getCode().name(), e);
        }
    }
}
