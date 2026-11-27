package common.models.price;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-508: bid / ask / mid. Driven by test-fixtures/price/lm-508-cases.json,
 * which the Python, JS and Rust tests share. Values compare as canonical plain
 * strings ({@code toPlainString()}), so a scale or precision drift fails.
 */
class PriceBidAskTest {
    private static final Path FIXTURE = Path.of("..", "test-fixtures", "price", "lm-508-cases.json");
    private static final ZonedDateTime AS_OF = ZonedDateTime.parse("2024-06-14T10:00:00-04:00[America/New_York]");

    private static JsonObject cases() throws IOException {
        return JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject();
    }

    private static BigDecimal side(JsonObject c, String key) {
        return c.has(key) ? new BigDecimal(c.get(key).getAsString()) : null;
    }

    private static Price quote(JsonObject c) {
        return new Price(UUID.randomUUID(), side(c, "mid"), side(c, "bid"), side(c, "ask"), null, AS_OF,
                PriceTypeProto.PERCENTAGE);
    }

    private static PriceProto legacyProto(JsonObject legacy) {
        try {
            return PriceProto.parseFrom(HexFormat.of().parseHex(legacy.get("hex").getAsString()));
        } catch (IOException e) {
            throw new AssertionError(e);
        }
    }

    @Test
    void legacyBytesReadAsMid() throws IOException {
        JsonObject legacy = cases().getAsJsonObject("legacy");
        PriceProto proto = legacyProto(legacy);

        assertEquals(legacy.get("mid").getAsString(), ProtoSerializationUtil.deserializeBigDecimal(proto.getMid()).toPlainString());
        assertFalse(proto.hasBid());
        assertFalse(proto.hasAsk());
        Price price = PriceSerializer.getInstance().deserialize(proto);
        assertEquals("99.5", price.getPrice().toPlainString());
        assertEquals(PriceQuote.Kind.MID, price.getPriceKind());
        assertEquals("99.5", price.getMid().toPlainString());
        assertNull(price.getBid());
        assertNull(price.getAsk());
    }

    @Test
    void oneNumberHelperRebuildsLegacyBytesExactly() throws IOException {
        JsonObject legacy = cases().getAsJsonObject("legacy");
        PriceProto old = legacyProto(legacy);
        Price price = new Price(UUID.fromString(legacy.get("uuid").getAsString()), new BigDecimal("99.5"),
                null, ProtoSerializationUtil.deserializeTimestamp(old.getAsOf()), PriceTypeProto.PERCENTAGE);

        PriceProto rebuilt = PriceSerializer.getInstance().serialize(price).toBuilder()
                .setSecurity(SecurityProto.newBuilder().setUuid(ProtoSerializationUtil.serializeUUID(
                        UUID.fromString(legacy.get("security_uuid").getAsString()))))
                .build();

        assertArrayEquals(old.toByteArray(), rebuilt.toByteArray());
    }

    @Test
    void getPriceResolvesEachCase() throws IOException {
        for (JsonElement e : cases().getAsJsonArray("resolve")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            Price price = quote(c);
            assertEquals(c.get("value").getAsString(), price.getPrice().toPlainString(), name);
            assertEquals(PriceQuote.Kind.valueOf(c.get("kind").getAsString()), price.getPriceKind(), name);
            PriceQuote q = price.getPriceQuote();
            assertEquals(c.get("value").getAsString(), q.value().toPlainString(), name);
            assertEquals(price.getPriceKind(), q.kind(), name);
        }
    }

    @Test
    void storedQuoteReadsBackUnchanged() throws Exception {
        for (JsonElement e : cases().getAsJsonArray("resolve")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            Price written = Price.forQuote(side(c, "mid"), side(c, "bid"), side(c, "ask"), null, AS_OF,
                    PriceTypeProto.PERCENTAGE);
            byte[] bytes = PriceSerializer.getInstance().serialize(written).toByteArray();
            Price read = PriceSerializer.getInstance().deserialize(PriceProto.parseFrom(bytes));

            assertEquals(plain(written.getMid()), plain(read.getMid()), name);
            assertEquals(plain(written.getBid()), plain(read.getBid()), name);
            assertEquals(plain(written.getAsk()), plain(read.getAsk()), name);
            assertEquals(c.get("value").getAsString(), read.getPrice().toPlainString(), name);
            assertEquals(PriceQuote.Kind.valueOf(c.get("kind").getAsString()), read.getPriceKind(), name);
        }
    }

    @Test
    void noSideSetIsNull() {
        Price price = new Price(UUID.randomUUID(), null, null, null, null, AS_OF, PriceTypeProto.PERCENTAGE);
        assertNull(price.getPrice());
        assertNull(price.getPriceKind());
        assertNull(price.getPriceQuote());
        assertEquals("N/A", price.toString());
    }

    @Test
    void validatorCases() throws IOException {
        for (JsonElement e : cases().getAsJsonArray("validate")) {
            JsonObject c = e.getAsJsonObject();
            PriceProto.Builder b = PriceProto.newBuilder()
                    .setSecurity(SecurityProto.newBuilder().setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID())))
                    .setPriceType(PriceTypeProto.PERCENTAGE);
            if (c.has("mid")) b.setMid(ProtoSerializationUtil.serializeBigDecimal(side(c, "mid")));
            if (c.has("bid")) b.setBid(ProtoSerializationUtil.serializeBigDecimal(side(c, "bid")));
            if (c.has("ask")) b.setAsk(ProtoSerializationUtil.serializeBigDecimal(side(c, "ask")));

            List<String> expected = new ArrayList<>();
            for (JsonElement v : c.getAsJsonArray("violations")) expected.add(v.getAsString());
            List<String> actual = PriceRules.validate(b.build()).stream().map(FieldViolationProto::getField).toList();
            assertEquals(expected, actual, c.get("name").getAsString());
        }
    }

    @Test
    void goldenCases() throws IOException {
        JsonArray golden = cases().getAsJsonArray("golden_cases");
        for (JsonElement e : golden) {
            JsonObject c = e.getAsJsonObject();
            BigDecimal tolerance = c.has("tolerance") ? new BigDecimal(c.get("tolerance").getAsString()) : BigDecimal.ZERO;
            BigDecimal diff = quote(c).getPrice().subtract(new BigDecimal(c.get("value").getAsString())).abs();
            assertTrue(diff.compareTo(tolerance) <= 0, c.get("name").getAsString());
        }
    }

    private static String plain(BigDecimal v) {
        return v == null ? null : v.toPlainString();
    }
}
