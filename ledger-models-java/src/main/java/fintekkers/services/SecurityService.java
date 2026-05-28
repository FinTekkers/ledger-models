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

/**
 * Thin gRPC client wrapper around the SecurityService stub. Mirrors the
 * shape of {@link PortfolioService} / {@link ValuationService}.
 *
 * <p>Default endpoint reads {@code API_URL} (default
 * {@code api.fintekkers.org}) with port {@code 8082}, matching the Python
 * {@code EnvConfig + ServiceType.SECURITY_SERVICE} convention.
 *
 * <p>Single shared instance behind {@link #getInstance()}; the underlying
 * gRPC channel is expensive to construct and intended to be reused for the
 * process lifetime.
 */
public class SecurityService {

    private static final SecurityService DEFAULT_INSTANCE = buildDefault();
    private final Endpoint endpoint;
    private final SecurityGrpc.SecurityBlockingStub stub;

    public SecurityService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        this.stub = SecurityGrpc.newBlockingStub(channel);
        this.endpoint = new Endpoint(url, port, isHttp);
    }

    private static SecurityService buildDefault() {
        String url = System.getenv().getOrDefault("API_URL", "api.fintekkers.org");
        int port = 8082;
        boolean isHttp = "localhost".equals(url) || "127.0.0.1".equals(url);
        return new SecurityService(url, port, isHttp);
    }

    public static SecurityService getInstance() {
        return DEFAULT_INSTANCE;
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
