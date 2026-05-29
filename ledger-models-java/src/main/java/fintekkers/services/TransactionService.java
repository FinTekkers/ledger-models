package fintekkers.services;

import fintekkers.models.transaction.TransactionProto;
import fintekkers.requests.transaction.QueryTransactionRequestProto;
import fintekkers.requests.transaction.QueryTransactionResponseProto;
import fintekkers.services.transaction_service.TransactionGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Thin gRPC client wrapper around the TransactionService stub. Mirrors the
 * shape of {@link SecurityService} / {@link PortfolioService}.
 *
 * <p>Default endpoint reads {@code API_URL} (default
 * {@code api.fintekkers.org}) with port {@code 8084}, matching the Python
 * {@code EnvConfig + ServiceType.TRANSACTION_SERVICE} convention.
 *
 * <p>Single shared instance behind {@link #getInstance()}; the underlying
 * gRPC channel is expensive to construct and intended to be reused for the
 * process lifetime.
 */
public class TransactionService {

    private static final TransactionService DEFAULT_INSTANCE = buildDefault();
    private final Endpoint endpoint;
    private final TransactionGrpc.TransactionBlockingStub stub;

    public TransactionService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        this.stub = TransactionGrpc.newBlockingStub(channel);
        this.endpoint = new Endpoint(url, port, isHttp);
    }

    private static TransactionService buildDefault() {
        String url = System.getenv().getOrDefault("API_URL", "api.fintekkers.org");
        int port = 8084;
        boolean isHttp = "localhost".equals(url) || "127.0.0.1".equals(url);
        return new TransactionService(url, port, isHttp);
    }

    public static TransactionService getInstance() {
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
     * {@code common.models.transaction.Transaction.defaultGrpcFetcher}
     * delegates to.
     */
    public TransactionProto getByUuid(UUID uuid, ZonedDateTime asOf) {
        QueryTransactionRequestProto.Builder reqB = QueryTransactionRequestProto.newBuilder()
                .setObjectClass("TransactionRequest")
                .setVersion("0.0.1")
                .addUuIds(ProtoSerializationUtil.serializeUUID(uuid));
        if (asOf != null) {
            reqB.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        }
        QueryTransactionResponseProto resp = stub.getByIds(reqB.build());
        return resp.getTransactionResponseCount() > 0 ? resp.getTransactionResponse(0) : null;
    }
}
