package common.models.security;

import common.util.LinkCache;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.services.security_service.SecurityGrpc;
import io.grpc.Metadata;
import io.grpc.Server;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.ServerInterceptors;
import io.grpc.netty.NettyServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.net.InetSocketAddress;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Journey for LM-278: with only {@code BROKER_HOST} set, reading a linked
 * security through {@code Security.defaultGrpcFetcher} reaches the broker.
 * A fake Security service stands in for the broker on 127.0.0.1:18085.
 * Runs only in the {@code brokerEnvTest} Gradle task, which sets that env.
 */
@Tag("broker-env")
class SecurityBrokerJourneyTest {

    private static final List<QuerySecurityRequestProto> requests = new CopyOnWriteArrayList<>();
    private static final List<Metadata> headers = new CopyOnWriteArrayList<>();
    private static Server broker;

    @BeforeAll
    static void startFakeBroker() throws Exception {
        SecurityGrpc.SecurityImplBase security = new SecurityGrpc.SecurityImplBase() {
            @Override
            public void getByIds(QuerySecurityRequestProto request,
                                 StreamObserver<QuerySecurityResponseProto> responseObserver) {
                requests.add(request);
                SecurityProto full = SecurityProto.newBuilder()
                        .setUuid(request.getUuIds(0))
                        .setAsOf(ProtoSerializationUtil.serializeTimestamp(ZonedDateTime.now()))
                        .setProductType(ProductTypeProto.TREASURY_BOND)
                        .setIssuerName("US Treasury")
                        .build();
                responseObserver.onNext(QuerySecurityResponseProto.newBuilder()
                        .addSecurityResponse(full).build());
                responseObserver.onCompleted();
            }
        };
        ServerInterceptor captureHeaders = new ServerInterceptor() {
            @Override
            public <Q, R> ServerCall.Listener<Q> interceptCall(ServerCall<Q, R> call, Metadata md,
                                                               ServerCallHandler<Q, R> next) {
                headers.add(md);
                return next.startCall(call, md);
            }
        };
        broker = NettyServerBuilder.forAddress(new InetSocketAddress("127.0.0.1", 18085))
                .addService(ServerInterceptors.intercept(security, captureHeaders))
                .build()
                .start();
    }

    @AfterAll
    static void stopFakeBroker() throws InterruptedException {
        broker.shutdownNow();
        broker.awaitTermination(10, TimeUnit.SECONDS);
    }

    @Test
    void linkedSecurityHydratesThroughTheBroker() {
        UUID id = UUID.randomUUID();
        LinkCache.SECURITY.evict(id);
        Security.setFetcher(Security.defaultGrpcFetcher());
        try {
            Security linked = new Security(Security.linkOf(id, ZonedDateTime.now().minusHours(1)));

            assertEquals(ProductTypeProto.TREASURY_BOND, linked.getProductType());
            assertEquals("US Treasury", linked.getIssuer());

            assertEquals(1, requests.size(), "the broker gets exactly one GetByIds call");
            assertEquals(id, ProtoSerializationUtil.deserializeUUID(requests.get(0).getUuIds(0)));

            // Auth is unchanged by LM-278: the Java client adds no auth header.
            Metadata md = headers.get(0);
            assertFalse(md.containsKey(Metadata.Key.of("x-api-key", Metadata.ASCII_STRING_MARSHALLER)));
            assertFalse(md.containsKey(Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER)));
        } finally {
            LinkCache.SECURITY.evict(id);
        }
    }
}
