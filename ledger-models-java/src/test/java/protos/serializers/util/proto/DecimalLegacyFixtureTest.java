package protos.serializers.util.proto;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Message;
import common.models.security.Security;
import common.models.security.bonds.MortgageBackedSecurity;
import common.models.transaction.Transaction;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;

import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-304 metric 2: bytes written by the published v0.4.33 (string field 10
 * only, ledger-models-protos/fixtures/legacy_v0433/) decode at every path to
 * the .json value and scale. Re-saving each decimal, as Rust's
 * {@code reencode_decimal} does in decimal_legacy_tests.rs, writes the
 * compact form and keeps field 10; the re-saved bytes read back through
 * either form alone.
 */
@SuppressWarnings("deprecation") // Asserts the legacy string field.
class DecimalLegacyFixtureTest {

    private static final Path DIR = Paths.get("..", "ledger-models-protos", "fixtures", "legacy_v0433");

    private static byte[] bin(String name) throws IOException {
        return Files.readAllBytes(DIR.resolve(name + ".bin"));
    }

    /** path → expected value, in fixture order. */
    private static Map<String, BigDecimal> expected(String name) throws IOException {
        JsonObject root;
        try (Reader r = Files.newBufferedReader(DIR.resolve(name + ".json"), StandardCharsets.UTF_8)) {
            root = new Gson().fromJson(r, JsonObject.class);
        }
        Map<String, BigDecimal> out = new LinkedHashMap<>();
        for (JsonElement e : root.getAsJsonArray("decimals")) {
            JsonObject d = e.getAsJsonObject();
            out.put(d.get("path").getAsString(),
                    new BigDecimal(new BigInteger(d.get("unscaled").getAsString()), d.get("scale").getAsInt()));
        }
        assertFalse(out.isEmpty(), name);
        return out;
    }

    private static DecimalValueProto get(Message m, String path) {
        Message cur = m;
        for (String part : path.split("\\.")) {
            FieldDescriptor f = cur.getDescriptorForType().findFieldByName(part);
            assertTrue(f != null && cur.hasField(f), path + ": " + part + " is set");
            cur = (Message) cur.getField(f);
        }
        return (DecimalValueProto) cur;
    }

    @SuppressWarnings("unchecked")
    private static <T extends Message> T set(T m, String path, DecimalValueProto value) {
        int dot = path.indexOf('.');
        String head = dot < 0 ? path : path.substring(0, dot);
        FieldDescriptor f = m.getDescriptorForType().findFieldByName(head);
        Object child = dot < 0 ? value : set((Message) m.getField(f), path.substring(dot + 1), value);
        return (T) m.toBuilder().setField(f, child).build();
    }

    /**
     * Every path decodes to the .json value; re-saving every path writes both
     * forms; the re-saved bytes, parsed again, decode through each form alone.
     */
    private static <T extends Message> void assertDecodesAndResaves(
            T proto, Map<String, BigDecimal> expected, Function<byte[], T> parse) {
        T resaved = proto;
        for (Map.Entry<String, BigDecimal> e : expected.entrySet()) {
            String path = e.getKey();
            DecimalValueProto d = get(proto, path);
            assertTrue(d.getUnscaledValue().isEmpty(), path + ": fixture must be string-only");
            BigDecimal got = ProtoSerializationUtil.deserializeBigDecimal(d);
            assertEquals(e.getValue(), got, path);
            assertEquals(e.getValue().scale(), got.scale(), path);

            resaved = set(resaved, path, ProtoSerializationUtil.serializeBigDecimal(got));
        }

        T reread = parse.apply(resaved.toByteArray());
        for (Map.Entry<String, BigDecimal> e : expected.entrySet()) {
            String path = e.getKey();
            DecimalValueProto d = get(reread, path);
            assertFalse(d.getUnscaledValue().isEmpty(), path + ": compact form written");
            assertFalse(d.getArbitraryPrecisionValue().isEmpty(), path + ": field 10 still written");
            // New readers (field 11 + 12) and pre-v0.4.34 readers (field 10) agree.
            DecimalValueProto compactOnly = d.toBuilder().clearArbitraryPrecisionValue().build();
            DecimalValueProto stringOnly = d.toBuilder().clearUnscaledValue().clearScale().build();
            assertEquals(e.getValue(), ProtoSerializationUtil.deserializeBigDecimal(compactOnly), path);
            assertEquals(e.getValue(), ProtoSerializationUtil.deserializeBigDecimal(stringOnly), path);
        }
    }

    private static void assertMbsReads(Security security, Map<String, BigDecimal> expected, String prefix) {
        MortgageBackedSecurity mbs = (MortgageBackedSecurity) security;
        assertEquals(expected.get(prefix + "bond_details.coupon_rate"), mbs.getCouponRate());
        assertEquals(expected.get(prefix + "bond_details.face_value"), mbs.getFaceValue());
        assertEquals(expected.get(prefix + "mbs_extension.wac"), mbs.getWac());
        assertEquals(expected.get(prefix + "mbs_extension.pass_through_rate"), mbs.getPassThroughRate());
        assertEquals(expected.get(prefix + "mbs_extension.current_factor"), mbs.getCurrentFactor());
        assertEquals(expected.get(prefix + "mbs_extension.original_face_value"), mbs.getOriginalFaceValue());
        assertEquals(expected.get(prefix + "mbs_extension.current_upb"), mbs.getCurrentUpb());
        assertEquals(expected.get(prefix + "mbs_extension.psa_speed"), mbs.getPsaSpeed());
    }

    private static <T> T parseOrFail(Callable<T> c) {
        try {
            return c.call();
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    @Test
    public void legacyPriceDecodesAndResavesBothForms() throws IOException {
        Map<String, BigDecimal> expected = expected("price");
        PriceProto proto = PriceProto.parseFrom(bin("price"));

        assertEquals(expected.get("price"), PriceSerializer.getInstance().deserialize(proto).getPrice());
        assertMbsReads(Security.fromProto(proto.getSecurity()), expected, "security.");
        assertDecodesAndResaves(proto, expected, b -> parseOrFail(() -> PriceProto.parseFrom(b)));
    }

    @Test
    public void legacySecurityDecodesAndResavesBothForms() throws IOException {
        Map<String, BigDecimal> expected = expected("security");
        SecurityProto proto = SecurityProto.parseFrom(bin("security"));

        assertMbsReads(Security.fromProto(proto), expected, "");
        assertDecodesAndResaves(proto, expected, b -> parseOrFail(() -> SecurityProto.parseFrom(b)));
    }

    @Test
    public void legacyTransactionDecodesAndResavesBothForms() throws IOException {
        Map<String, BigDecimal> expected = expected("transaction");
        TransactionProto proto = TransactionProto.parseFrom(bin("transaction"));

        // quantity was stored as the exponent string "1E+3": scale 0, not -3.
        assertEquals("1E+3", proto.getQuantity().getArbitraryPrecisionValue());
        BigDecimal quantity = new Transaction(proto).getQuantity();
        assertEquals(expected.get("quantity"), quantity);
        assertEquals(0, quantity.scale());
        assertEquals(new BigDecimal("-0.50"), ProtoSerializationUtil.deserializeBigDecimal(proto.getPrice().getPrice()));
        assertDecodesAndResaves(proto, expected, b -> parseOrFail(() -> TransactionProto.parseFrom(b)));

        DecimalValueProto resaved = ProtoSerializationUtil.serializeBigDecimal(quantity);
        assertEquals("1000", resaved.getArbitraryPrecisionValue());
        assertEquals(0, resaved.getScale());
        assertEquals(2, resaved.getUnscaledValue().size());
        assertEquals((byte) 0x03, resaved.getUnscaledValue().byteAt(0));
        assertEquals((byte) 0xe8, resaved.getUnscaledValue().byteAt(1));
    }
}
