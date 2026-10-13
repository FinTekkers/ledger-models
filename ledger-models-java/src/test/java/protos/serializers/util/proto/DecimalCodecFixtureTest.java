package protos.serializers.util.proto;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.protobuf.ByteString;
import common.models.errors.InvalidDecimalException;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-304 metrics 1 and 5, guardrail 1: Java matches the shared oracle
 * ledger-models-protos/fixtures/decimal_compact.json byte for byte, as Rust,
 * Python and JS do. Values are compared with {@link BigDecimal#equals}, which
 * checks the scale, never {@code compareTo}.
 */
@SuppressWarnings("deprecation") // Builds and checks the legacy string field.
class DecimalCodecFixtureTest {

    private static JsonObject root;

    @BeforeAll
    static void load() throws IOException {
        Path path = Paths.get("..", "ledger-models-protos", "fixtures", "decimal_compact.json");
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            root = new Gson().fromJson(r, JsonObject.class);
        }
    }

    static byte[] hex(String s) {
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) {
            out[i] = (byte) Integer.parseInt(s.substring(2 * i, 2 * i + 2), 16);
        }
        return out;
    }

    private static JsonArray section(String name) {
        JsonArray a = root.getAsJsonArray(name);
        assertFalse(a.isEmpty(), name);
        return a;
    }

    /** unscaled_hex x 10^-scale, built without the codec. */
    private static BigDecimal expectedValue(JsonObject c) {
        return new BigDecimal(new BigInteger(hex(c.get("unscaled_hex").getAsString())), c.get("scale").getAsInt());
    }

    @Test
    public void limitsMatchTheFixture() {
        JsonObject limits = root.getAsJsonObject("limits");
        assertEquals(limits.get("max_digits").getAsInt(), DecimalCodec.MAX_DIGITS);
        assertEquals(limits.get("max_scale").getAsLong(), DecimalCodec.MAX_SCALE);
        assertEquals(limits.get("max_unscaled_bytes").getAsInt(), DecimalCodec.MAX_UNSCALED_BYTES);
    }

    // ---- Metric 1: encode ----

    @Test
    public void casesEncodeToExactWireBytes() throws Exception {
        for (JsonElement e : section("cases")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            byte[] wire = hex(c.get("wire_hex").getAsString());

            BigDecimal parsed = DecimalCodec.parseStrict(c.get("string").getAsString());
            DecimalValueProto encoded = ProtoSerializationUtil.serializeBigDecimal(parsed);

            assertArrayEquals(wire, encoded.toByteArray(), name);
            assertArrayEquals(hex(c.get("unscaled_hex").getAsString()), encoded.getUnscaledValue().toByteArray(), name);
            assertEquals(c.get("scale").getAsInt(), encoded.getScale(), name);
            assertEquals(c.get("canonical").getAsString(), ProtoSerializationUtil.deserializeBigDecimal(encoded).toPlainString(), name);
            // Parsing the fixture bytes and writing them again changes nothing.
            assertArrayEquals(wire, DecimalValueProto.parseFrom(wire).toByteArray(), name);
        }
    }

    // ---- Metric 1: decode ----

    @Test
    public void casesDecodeToEqualValueAndScale() throws Exception {
        for (JsonElement e : section("cases")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            BigDecimal want = expectedValue(c);
            DecimalValueProto wire = DecimalValueProto.parseFrom(hex(c.get("wire_hex").getAsString()));

            assertEquals(want, ProtoSerializationUtil.deserializeBigDecimal(wire), name);
            assertEquals(want.scale(), ProtoSerializationUtil.deserializeBigDecimal(wire).scale(), name);
        }
    }

    @Test
    public void aStringOnlyDecimalFromOldBytesIsUnset() throws Exception {
        // A v0.4.33 writer stored 1.5 as field 10 only (0x52 = field 10,
        // length-delimited). LM-318 deleted field 10, so it parses as an
        // unknown field: the decimal is unset and reading it is the typed error.
        DecimalValueProto old = DecimalValueProto.parseFrom(new byte[]{0x52, 0x03, '1', '.', '5'});
        assertTrue(ProtoSerializationUtil.isUnsetDecimal(old));
        assertThrows(common.models.errors.UnsetDecimalException.class, () -> ProtoSerializationUtil.deserializeBigDecimal(old));
        assertThrows(InvalidDecimalException.class, () -> DecimalCodec.decode(old));
    }

    @Test
    public void compactZeroIsSet() {
        DecimalValueProto zero = ProtoSerializationUtil.serializeBigDecimal(BigDecimal.ZERO);
        assertArrayEquals(new byte[]{0x00}, zero.getUnscaledValue().toByteArray());
        assertFalse(ProtoSerializationUtil.isUnsetDecimal(zero));
        assertEquals(BigDecimal.ZERO, ProtoSerializationUtil.deserializeBigDecimal(zero));
    }

    // ---- Guardrail 1: lossless, errors never rounded ----

    @Test
    public void stringErrorsThrowInvalidDecimalException() {
        for (JsonElement e : section("string_errors")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            Throwable t = assertThrows(Throwable.class,
                    () -> DecimalCodec.parseStrict(c.get("string").getAsString()), name);
            assertEquals(InvalidDecimalException.class, t.getClass(), name + ": " + t);
        }
    }

    @Test
    public void decodeErrorsThrowInvalidDecimalException() {
        for (JsonElement e : section("decode_errors")) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("name").getAsString();
            byte[] unscaled;
            if (c.has("unscaled_hex_repeat")) {
                JsonObject repeat = c.getAsJsonObject("unscaled_hex_repeat");
                unscaled = hex(repeat.get("hex").getAsString().repeat(repeat.get("count").getAsInt()));
            } else {
                unscaled = hex(c.get("unscaled_hex").getAsString());
            }
            DecimalValueProto compact = DecimalValueProto.newBuilder()
                    .setUnscaledValue(ByteString.copyFrom(unscaled))
                    .setScale((int) c.get("scale").getAsLong())
                    .build();
            Throwable t = assertThrows(Throwable.class,
                    () -> ProtoSerializationUtil.deserializeBigDecimal(compact), name);
            assertEquals(InvalidDecimalException.class, t.getClass(), name + ": " + t);
        }
    }

    @Test
    public void encodeOverCapsThrowsInvalidDecimalException() {
        BigDecimal tooManyDigits = new BigDecimal(BigInteger.TEN.pow(DecimalCodec.MAX_DIGITS));
        assertThrows(InvalidDecimalException.class, () -> ProtoSerializationUtil.serializeBigDecimal(tooManyDigits));
        // Same value with a negative scale: rejected before the zeros are appended.
        assertThrows(InvalidDecimalException.class,
                () -> ProtoSerializationUtil.serializeBigDecimal(BigDecimal.ONE.scaleByPowerOfTen(DecimalCodec.MAX_DIGITS)));
        assertThrows(InvalidDecimalException.class,
                () -> ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(1, DecimalCodec.MAX_DIGITS + 1)));

        // The largest allowed values still encode exactly.
        BigDecimal maxDigits = new BigDecimal(BigInteger.TEN.pow(DecimalCodec.MAX_DIGITS).subtract(BigInteger.ONE));
        DecimalValueProto p = ProtoSerializationUtil.serializeBigDecimal(maxDigits);
        assertTrue(p.getUnscaledValue().size() <= DecimalCodec.MAX_UNSCALED_BYTES);
        assertEquals(maxDigits, ProtoSerializationUtil.deserializeBigDecimal(p));
        BigDecimal maxScale = BigDecimal.valueOf(1, (int) DecimalCodec.MAX_SCALE);
        assertEquals(maxScale, ProtoSerializationUtil.deserializeBigDecimal(ProtoSerializationUtil.serializeBigDecimal(maxScale)));
    }
}
