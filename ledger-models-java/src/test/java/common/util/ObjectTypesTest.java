package common.util;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.protobuf.Message;
import com.google.protobuf.MessageOrBuilder;
import com.google.protobuf.UnknownFieldSet;
import common.models.security.Tenor;
import common.models.security.TenorType;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.ObjectTypeProto;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Compact object type and version (LM-297): writers set both forms, readers
 * translate the strings-only form. Rows come from the shared fixture
 * test-fixtures/object-type-legacy.json, which Python, JS and Rust also load.
 */
@SuppressWarnings("deprecation")
class ObjectTypesTest {

    private static final Path FIXTURE = Path.of("..", "test-fixtures", "object-type-legacy.json");
    private static final Map<String, Integer> COMPACT_NUMBERS = Map.of(
            "object_type", 1001, "version_major", 1002, "version_minor", 1003, "version_patch", 1004);

    private final Logger logger = Logger.getLogger(ObjectTypes.class.getName());
    private final List<LogRecord> warnings = new ArrayList<>();
    private final Handler capture = new Handler() {
        @Override
        public void publish(LogRecord record) {
            if (record.getLevel() == Level.WARNING) warnings.add(record);
        }

        @Override
        public void flush() {
        }

        @Override
        public void close() {
        }
    };

    @BeforeEach
    void attachHandler() {
        ObjectTypes.resetWarningsForTests();
        logger.addHandler(capture);
    }

    @AfterEach
    void detachHandler() {
        logger.removeHandler(capture);
        ObjectTypes.resetWarningsForTests();
    }

    static Stream<JsonObject> cases() throws IOException {
        JsonArray cases = JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject().getAsJsonArray("cases");
        List<JsonObject> out = new ArrayList<>();
        for (JsonElement c : cases) out.add(c.getAsJsonObject());
        return out.stream();
    }

    private static Message decode(JsonObject c) throws Exception {
        Class<?> cls = Class.forName(c.get("message").getAsString());
        return (Message) cls.getMethod("parseFrom", byte[].class)
                .invoke(null, (Object) Base64.getDecoder().decode(c.get("bytes").getAsString()));
    }

    private static int[] expectedVersion(JsonObject c) {
        JsonArray v = c.getAsJsonObject("expect").getAsJsonArray("version");
        // uint32 parts are held in an int, as protobuf does.
        return new int[]{(int) v.get(0).getAsLong(), (int) v.get(1).getAsLong(), (int) v.get(2).getAsLong()};
    }

    // ---- Loading the old form translates it (metric 3) ----

    @ParameterizedTest(name = "{index}")
    @MethodSource("cases")
    void fixtureRowDecodesToExpectedTypeAndVersion(JsonObject c) throws Exception {
        Message message = decode(c);
        JsonObject expect = c.getAsJsonObject("expect");
        int[] v = expectedVersion(c);

        assertEquals(ObjectTypeProto.valueOf(expect.get("object_type").getAsString()), ObjectTypes.readType(message), c.get("name").getAsString());
        assertEquals(new ObjectTypes.Version(v[0], v[1], v[2]), ObjectTypes.readVersion(message), c.get("name").getAsString());
        assertEquals(expect.get("warns").getAsBoolean() ? 1 : 0, warnings.size(), c.get("name").getAsString());
    }

    @ParameterizedTest(name = "{index}")
    @MethodSource("cases")
    void upgradedRowReserialisesWithCompactFields(JsonObject c) throws Exception {
        String name = c.get("name").getAsString();
        byte[] data = ObjectTypes.upgrade(decode(c)).toByteArray();
        int[] v = expectedVersion(c);
        Map<String, Integer> expected = Map.of(
                "object_type", ObjectTypeProto.valueOf(c.getAsJsonObject("expect").get("object_type").getAsString()).getNumber(),
                "version_major", v[0], "version_minor", v[1], "version_patch", v[2]);

        UnknownFieldSet wire = UnknownFieldSet.parseFrom(data);
        for (Map.Entry<String, Integer> field : COMPACT_NUMBERS.entrySet()) {
            int value = expected.get(field.getKey());
            assertEquals(value != 0, wire.hasField(field.getValue()), name + " " + field.getKey());
            if (value != 0) {
                assertEquals(Integer.toUnsignedLong(value), wire.getField(field.getValue()).getVarintList().get(0), name + " " + field.getKey());
            }
        }
        Message reread = decode(c).getParserForType().parseFrom(data);
        assertEquals(c.get("object_class").getAsString(), reread.getField(reread.getDescriptorForType().findFieldByNumber(1)), name);
        assertEquals(c.get("version").getAsString(), reread.getField(reread.getDescriptorForType().findFieldByNumber(2)), name);
    }

    // ---- Reading the strings is deprecated (metric 4) ----

    @Test
    void threeStringsOnlyDecodesOfOneTypeWarnOnce() throws Exception {
        JsonObject price = cases().filter(c -> c.get("name").getAsString().equals("java-PriceProto")).findFirst().orElseThrow();
        for (int i = 0; i < 3; i++) {
            ObjectTypes.upgrade(decode(price));
        }
        assertEquals(1, warnings.size());
    }

    @Test
    void newFormDoesNotWarn() {
        PriceProto.Builder b = ObjectTypes.stamp(PriceProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE, "Price", "0.0.1");
        ObjectTypes.readType(b);
        ObjectTypes.readVersion(b);
        assertEquals(0, warnings.size());
    }

    // ---- Writers set both forms (metric 2) ----

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
                        ObjectTypeProto.OBJECT_TYPE_PRICE, "Price", "0.0.1"),
                Arguments.of("PortfolioSerializer", (Supplier<MessageOrBuilder>) () ->
                        PortfolioSerializer.getInstance().serialize(DummyEquityObjects.getDummyPortfolio()),
                        ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, "Portfolio", "0.0.1"),
                Arguments.of("Portfolio", (Supplier<MessageOrBuilder>) () ->
                        DummyEquityObjects.getDummyPortfolio().getProto(),
                        ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, "Portfolio", "0.0.1"),
                Arguments.of("PositionSerializer", (Supplier<MessageOrBuilder>) () ->
                        PositionSerializer.getInstance().serialize(DummyEquityObjects.getDummyPosition()),
                        ObjectTypeProto.OBJECT_TYPE_POSITION, "Position", "0.0.1"),
                Arguments.of("IdentifierSerializer", (Supplier<MessageOrBuilder>) () ->
                        IdentifierSerializer.getInstance().serialize(new Identifier(IdentifierType.CUSIP, "X")),
                        ObjectTypeProto.OBJECT_TYPE_IDENTIFIER, "Identifier", "0.0.1"),
                Arguments.of("TenorSerializer", (Supplier<MessageOrBuilder>) () ->
                        TenorSerializer.getInstance().serialize(new Tenor(TenorType.TERM, "1Y")),
                        ObjectTypeProto.OBJECT_TYPE_TENOR, "Tenor", "0.0.1"),
                Arguments.of("Strategy", (Supplier<MessageOrBuilder>) () ->
                        new Strategy(UUID.randomUUID(), "S", null, now).getProto(),
                        ObjectTypeProto.OBJECT_TYPE_STRATEGY, "Strategy", "0.0.1"),
                Arguments.of("StrategyAllocation", (Supplier<MessageOrBuilder>) () ->
                        new StrategyAllocation(UUID.randomUUID(), now).getProto(),
                        ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION, "StrategyAllocation", "0.0.1"),
                Arguments.of("Transaction", (Supplier<MessageOrBuilder>) () ->
                        DummyEquityObjects.getDummyTransaction().getRawProto(),
                        ObjectTypeProto.OBJECT_TYPE_TRANSACTION, "Transaction", "0.0.1"),
                Arguments.of("SecurityService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            SecurityService s = new SecurityService("localhost", 1, true);
                            return captured(s, "stub", fintekkers.services.security_service.SecurityGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, "SecurityRequest", "0.0.1"),
                Arguments.of("PortfolioService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            PortfolioService s = new PortfolioService("localhost", 1, true);
                            return captured(s, "portfolioGrpc", fintekkers.services.portfolio_service.PortfolioGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, "PortfolioRequest", "0.0.1"),
                Arguments.of("TransactionService.getByUuid", (Supplier<MessageOrBuilder>) () -> {
                            TransactionService s = new TransactionService("localhost", 1, true);
                            return captured(s, "stub", fintekkers.services.transaction_service.TransactionGrpc.class,
                                    () -> s.getByUuid(UUID.randomUUID(), null));
                        },
                        ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, "TransactionRequest", "0.0.1"),
                Arguments.of("LinkResolver securities", (Supplier<MessageOrBuilder>) ObjectTypesTest::linkResolverSecurityRequest,
                        ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, "SecurityRequest", "0.0.1"),
                Arguments.of("LinkResolver portfolios", (Supplier<MessageOrBuilder>) ObjectTypesTest::linkResolverPortfolioRequest,
                        ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, "PortfolioRequest", "0.0.1"));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("libraryWriters")
    void writerSetsStringsAndCompactFieldsThatAgree(String writer, Supplier<MessageOrBuilder> build,
                                                     ObjectTypeProto type, String objectClass, String version) {
        MessageOrBuilder message = build.get();
        var d = message.getDescriptorForType();

        assertEquals(objectClass, message.getField(d.findFieldByNumber(1)), writer);
        assertEquals(version, message.getField(d.findFieldByNumber(2)), writer);
        assertEquals(type.getValueDescriptor(), message.getField(d.findFieldByNumber(1001)), writer);
        assertEquals(type, ObjectTypes.fromLegacy(objectClass), writer);
        ObjectTypes.Version parts = ObjectTypes.parseVersion(version);
        assertEquals(parts, ObjectTypes.readVersion(message), writer);
        assertEquals(List.of(parts.major, parts.minor, parts.patch), List.of(
                message.getField(d.findFieldByNumber(1002)),
                message.getField(d.findFieldByNumber(1003)),
                message.getField(d.findFieldByNumber(1004))), writer);
        assertEquals(0, warnings.size(), writer);
    }

    @Test
    void stampRejectsAMalformedVersion() {
        assertThrows(IllegalArgumentException.class,
                () -> ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY, "Security", "1.2"));
    }

    @Test
    void stampOnAMessageWithoutObjectClassFails() {
        assertThrows(IllegalArgumentException.class,
                () -> ObjectTypes.stamp(fintekkers.models.util.Uuid.UUIDProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_UNKNOWN, "X", "0.0.1"));
    }

    @Test
    void stampKeepsTheBuilderType() {
        PortfolioProto.Builder b = ObjectTypes.stamp(PortfolioProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, "Portfolio", "1.2.3");
        assertEquals(List.of(1, 2, 3), List.of(b.getVersionMajor(), b.getVersionMinor(), b.getVersionPatch()));
        assertEquals(ObjectTypeProto.OBJECT_TYPE_PORTFOLIO, b.getObjectType());
    }
}
