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
import java.util.function.Function;

/**
 * Thin gRPC client wrapper around the TransactionService stub. Mirrors the
 * shape of {@link SecurityService} / {@link PortfolioService}.
 *
 * <p>The default endpoint comes from {@link ServiceAddress}: the broker when
 * {@code BROKER_HOST} is set, else {@code LEDGER_SERVICE_HOST/_PORT}, else
 * {@code API_URL}, else {@code localhost}, on the ledger port.
 *
 * <p>Single shared instance behind {@link #getInstance()}, built on first
 * use; the underlying gRPC channel is expensive to construct and intended to
 * be reused for the process lifetime.
 */
public class TransactionService {

    private static volatile TransactionService defaultInstance;
    private final Endpoint endpoint;
    private final TransactionGrpc.TransactionBlockingStub stub;

    public TransactionService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        this.stub = TransactionGrpc.newBlockingStub(channel);
        this.endpoint = new Endpoint(url, port, isHttp);
    }

    static TransactionService fromEnv(Function<String, String> env) {
        Endpoint e = ServiceAddress.resolve(ServiceAddress.Service.TRANSACTION, env);
        return new TransactionService(e.url(), e.port(), e.isHttp());
    }

    /** Built on first call; see {@link SecurityService#getInstance()}. */
    public static TransactionService getInstance() {
        TransactionService instance = defaultInstance;
        if (instance == null) {
            synchronized (TransactionService.class) {
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
