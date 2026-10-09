package fintekkers.services;

import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.services.security_service.SecurityGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.function.Function;

/**
 * Thin gRPC client wrapper around the SecurityService stub. Mirrors the
 * shape of {@link PortfolioService} / {@link ValuationService}.
 *
 * <p>The default endpoint comes from {@link ServiceAddress}: the broker when
 * {@code BROKER_HOST} is set, else {@code LEDGER_SERVICE_HOST/_PORT}, else
 * {@code API_URL}, else {@code localhost}, on the ledger port.
 *
 * <p>Single shared instance behind {@link #getInstance()}, built on first
 * use; the underlying gRPC channel is expensive to construct and intended to
 * be reused for the process lifetime.
 */
public class SecurityService {

    private static volatile SecurityService defaultInstance;
    private final Endpoint endpoint;
    private final SecurityGrpc.SecurityBlockingStub stub;

    public SecurityService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        this.stub = SecurityGrpc.newBlockingStub(channel);
        this.endpoint = new Endpoint(url, port, isHttp);
    }

    static SecurityService fromEnv(Function<String, String> env) {
        Endpoint e = ServiceAddress.resolve(ServiceAddress.Service.SECURITY, env);
        return new SecurityService(e.url(), e.port(), e.isHttp());
    }

    /**
     * Built on first call, not at class load, so a bad environment value
     * fails every call with the message naming the variable and does not
     * block the explicit constructor.
     */
    public static SecurityService getInstance() {
        SecurityService instance = defaultInstance;
        if (instance == null) {
            synchronized (SecurityService.class) {
                instance = defaultInstance;
                if (instance == null) {
                    instance = fromEnv(System::getenv);
                    defaultInstance = instance;
                }
            }
        }
        return instance;
    }

    public Endpoint getEndpoint() {
        return endpoint;
    }

    /**
     * Single-UUID resolution via the unary {@code GetByIds} RPC. When
     * {@code asOf} is set, returns the version of the record at that
     * timestamp; null means latest. Returns {@code null} when no record
     * exists for the UUID.
     *
     * <p>This is the surface the lazy-hydrate default fetcher in
     * {@code Security.defaultGrpcFetcher} delegates to.
     */
    public SecurityProto getByUuid(UUID uuid, ZonedDateTime asOf) {
        QuerySecurityRequestProto.Builder reqB = QuerySecurityRequestProto.newBuilder()
                .setObjectClass("SecurityRequest")
                .setVersion("0.0.1")
                .addUuIds(ProtoSerializationUtil.serializeUUID(uuid));
        if (asOf != null) {
            reqB.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        }
        QuerySecurityResponseProto resp = stub.getByIds(reqB.build());
        return resp.getSecurityResponseCount() > 0 ? resp.getSecurityResponse(0) : null;
    }
}
