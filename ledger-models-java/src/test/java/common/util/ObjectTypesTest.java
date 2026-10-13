package common.util;

import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import common.models.security.Tenor;
import common.models.security.TenorType;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.VersionProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.services.PortfolioService;
import fintekkers.services.SecurityService;
import fintekkers.services.TransactionService;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.position.PositionSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.TenorSerializer;
import testutil.DummyEquityObjects;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Object type and version (LM-297, LM-318): {@code stamp} writes
 * {@code object_type = 1} and {@code version = 2} (0.0.1), and bytes from
 * earlier releases are not readable.
 */
class ObjectTypesTest {

    /** A PriceProto written by ledger-models v0.4.33: object_class / version strings in fields 1 and 2. */
    private static final Path OLD_PRICE = Path.of("..", "ledger-models-protos", "fixtures", "legacy_v0433", "price.bin");

    private static final VersionProto V_0_0_1 = VersionProto.newBuilder().setPatch(1).build();

    // ---- stamp round-trips (metric 2) ----

    @Test
    void stampedPriceRoundTripsTypeAndVersion() throws InvalidProtocolBufferException {
        PriceProto price = ObjectTypes.stamp(PriceProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE).build();
        PriceProto reread = PriceProto.parseFrom(price.toByteArray());

        assertEquals(ObjectTypeProto.OBJECT_TYPE_PRICE, ObjectTypes.readType(reread));
        assertEquals(Optional.of(V_0_0_1), ObjectTypes.readVersion(reread));
        assertEquals(List.of(0, 0, 1), List.of(reread.getVersion().getMajor(), reread.getVersion().getMinor(), reread.getVersion().getPatch()));
        // Nothing at the removed fields 1001-1004.
        assertTrue(reread.getUnknownFields().asMap().isEmpty(), reread.getUnknownFields().toString());
    }

    @Test
    void anUnstampedMessageReadsAsUnknownAndAbsent() throws InvalidProtocolBufferException {
        PriceProto price = PriceProto.parseFrom(PriceProto.getDefaultInstance().toByteArray());
        assertEquals(ObjectTypeProto.OBJECT_TYPE_UNKNOWN, ObjectTypes.readType(price));
        assertEquals(Optional.empty(), ObjectTypes.readVersion(price));
    }

    @Test
    void aNewerObjectTypeReadsAsUnrecognized() {
        PriceProto price = PriceProto.newBuilder().setObjectTypeValue(9999).build();
        assertEquals(ObjectTypeProto.UNRECOGNIZED, ObjectTypes.readType(price));
    }

    // ---- Old bytes are not readable (metric 3) ----

    @Test
    void bytesFromV0433AreNotReadable() throws IOException {
        byte[] old = Files.readAllBytes(OLD_PRICE);
        // Field 2 held the string "0.0.1", which does not parse as a VersionProto.
        assertThrows(InvalidProtocolBufferException.class, () -> PriceProto.parseFrom(old));
    }

    // ---- Every library writer stamps the new form (metric 2) ----

    /** A channel that records the request of a unary call, then fails it. */
    private static final class CapturingChannel extends Channel {
        final AtomicReference<Object> request = new AtomicReference<>();

        @Override
        public <Q, R> ClientCall<Q, R> newCall(MethodDescriptor<Q, R> method, CallOptions options) {
            return new ClientCall<>() {
                @Override
                public void start(Listener<R> listener, Metadata headers) {
                }

                @Override
                public void request(int n) {
                }

                @Override
                public void cancel(String message, Throwable cause) {
                }

                @Override
                public void halfClose() {
                }

                @Override
                public void sendMessage(Q message) {
                    request.set(message);
                    throw new IllegalStateException("captured");
                }
            };
        }

        @Override
        public String authority() {
            return "capture";
        }
    }

    private static Message captured(Object service, String stubField, Class<?> grpc, Runnable call) {
        try {
            CapturingChannel channel = new CapturingChannel();
            Object stub = grpc.getMethod("newBlockingStub", Channel.class).invoke(null, channel);
            Field f = service.getClass().getDeclaredField(stubField);
            f.setAccessible(true);
            f.set(service, stub);
            assertThrows(RuntimeException.class, call::run);
            assertNotNull(channel.request.get());
            return (Message) channel.request.get();
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
    }

    private static Message linkResolverSecurityRequest() {
        List<QuerySecurityRequestProto> seen = new ArrayList<>();
        LinkResolver resolver = new LinkResolver(r -> {
            seen.add(r);
            return QuerySecurityResponseProto.getDefaultInstance();
        }, r -> QueryPortfolioResponseProto.getDefaultInstance());
        // Nothing comes back, so the resolver reports the UUID as not found.
        assertThrows(IllegalStateException.class, () -> resolver.getSecurity(UUID.randomUUID()));
        return seen.get(0);
    }

    private static Message linkResolverPortfolioRequest() {
        List<QueryPortfolioRequestProto> seen = new ArrayList<>();
        LinkResolver resolver = new LinkResolver(r -> QuerySecurityResponseProto.getDefaultInstance(), r -> {
            seen.add(r);
            return QueryPortfolioResponseProto.getDefaultInstance();
        });
        assertThrows(IllegalStateException.class, () -> resolver.getPortfolio(UUID.randomUUID()));
        return seen.get(0);
    }

    static Stream<Arguments> libraryWriters() {
        ZonedDateTime now = ZonedDateTime.now();
        return Stream.of(
                Arguments.of("PriceSerializer", (Supplier<MessageOrBuilder>) () ->
                        PriceSerializer.getInstance().serialize(DummyEquityObjects.getDummyPrice()),
                        ObjectTypeProto.OBJECT_TYPE_PRICE),
                Arguments.of("PortfolioSerializer", (Supplier<MessageOrBuilder>) () ->
                        PortfolioSerializer.getInstance().serialize(DummyEquityObjects.getDummyPortfolio()),
                        ObjectTypeProto.OBJECT_TYPE_PORTFOLIO),
                Arguments.of("Portfolio", (Supplier<MessageOrBuilder>) () ->
                        DummyEquityObjects.getDummyPortfolio().getProto(),
                        ObjectTypeProto.OBJECT_TYPE_PORTFOLIO),
                Arguments.of("PositionSerializer", (Supplier<MessageOrBuilder>) () ->
                        PositionSerializer.getInstance().serialize(DummyEquityObjects.getDummyPosition()),
                        ObjectTypeProto.OBJECT_TYPE_POSITION),
                Arguments.of("IdentifierSerializer", (Supplier<MessageOrBuilder>) () ->
                        IdentifierSerializer.getInstance().serialize(new Identifier(IdentifierType.CUSIP, "X")),
                        ObjectTypeProto.OBJECT_TYPE_IDENTIFIER),
                Arguments.of("TenorSerializer", (Supplier<MessageOrBuilder>) () ->
                        TenorSerializer.getInstance().serialize(new Tenor(TenorType.TERM, "1Y")),
                        ObjectTypeProto.OBJECT_TYPE_TENOR),
                Arguments.of("Strategy", (Supplier<MessageOrBuilder>) () ->
                        new Strategy(UUID.randomUUID(), "S", null, now).getProto(),
                        ObjectTypeProto.OBJECT_TYPE_STRATEGY),
                Arguments.of("StrategyAllocation", (Supplier<MessageOrBuilder>) () ->
                        new StrategyAllocation(UUID.randomUUID(), now).getProto(),
                        ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION),
                Arguments.of("Transaction", (Supplier<MessageOrBuilder>) () ->
                        DummyEquityObjects.getDummyTransaction().getRawProto(),
                        ObjectTypeProto.OBJECT_TYPE_TRANSACTION),
                Arguments.of("SecurityService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            SecurityService s = new SecurityService("localhost", 1, true);
                            return captured(s, "stub", fintekkers.services.security_service.SecurityGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST),
                Arguments.of("PortfolioService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            PortfolioService s = new PortfolioService("localhost", 1, true);
                            return captured(s, "portfolioGrpc", fintekkers.services.portfolio_service.PortfolioGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST),
                Arguments.of("TransactionService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            TransactionService s = new TransactionService("localhost", 1, true);
                            return captured(s, "stub", fintekkers.services.transaction_service.TransactionGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST),
                Arguments.of("LinkResolver securities", (Supplier<MessageOrBuilder>) ObjectTypesTest::linkResolverSecurityRequest,
                        ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST),
                Arguments.of("LinkResolver portfolios", (Supplier<MessageOrBuilder>) ObjectTypesTest::linkResolverPortfolioRequest,
                        ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("libraryWriters")
    void writerStampsTypeAndSchemaVersion(String writer, Supplier<MessageOrBuilder> build, ObjectTypeProto type) {
        MessageOrBuilder message = build.get();
        assertEquals(type, ObjectTypes.readType(message), writer);
        assertEquals(Optional.of(ObjectTypes.SCHEMA_VERSION), ObjectTypes.readVersion(message), writer);
        assertEquals(V_0_0_1, ObjectTypes.SCHEMA_VERSION, writer);
    }

    @Test
    void stampOnAMessageWithoutObjectTypeFails() {
        assertThrows(IllegalArgumentException.class,
                () -> ObjectTypes.stamp(fintekkers.models.util.Uuid.UUIDProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_UNKNOWN));
    }

    @Test
    void stampKeepsTheBuilderType() {
        PortfolioProto.Builder b = ObjectTypes.stamp(PortfolioProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO);
        assertEquals(V_0_0_1, b.getVersion());
        assertEquals(ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, b.getObjectType());
    }
}
