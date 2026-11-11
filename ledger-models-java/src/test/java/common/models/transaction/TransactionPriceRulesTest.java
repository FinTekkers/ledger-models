package common.models.transaction;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** LM-463: trade-price rule. The same fixture (test-fixtures/transaction-price/cases.json) runs in Python, Rust and JS. */
class TransactionPriceRulesTest {
    private static final Path FIXTURE = Path.of("..", "test-fixtures", "transaction-price", "cases.json");
    private static final String FIELD = TransactionRules.PRICE_PREFIX + "price_type";

    private static List<JsonObject> cases() throws IOException {
        try (Reader r = Files.newBufferedReader(FIXTURE, StandardCharsets.UTF_8)) {
            List<JsonObject> out = new ArrayList<>();
            for (JsonElement e : new Gson().fromJson(r, JsonObject.class).getAsJsonArray("cases")) out.add(e.getAsJsonObject());
            return out;
        }
    }

    private static Map<String, JsonObject> byName() throws IOException {
        Map<String, JsonObject> out = new LinkedHashMap<>();
        for (JsonObject c : cases()) out.put(c.get("name").getAsString(), c);
        return out;
    }

    private static TransactionProto transaction(JsonObject t) {
        TransactionProto.Builder b = TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.fromString(t.get("uuid").getAsString())));
        if (t.has("price")) b.setPrice(price(t.getAsJsonObject("price")));
        return b.build();
    }

    private static PriceProto price(JsonObject p) {
        PriceProto.Builder b = PriceProto.newBuilder();
        if (p.has("uuid")) b.setUuid(ProtoSerializationUtil.serializeUUID(UUID.fromString(p.get("uuid").getAsString())));
        if (p.has("link")) b.setIsLink(p.get("link").getAsBoolean());
        if (p.has("price_type")) {
            JsonElement pt = p.get("price_type");
            // A number is the raw wire value; setPriceType would reject an unrecognised one.
            if (pt.getAsJsonPrimitive().isNumber()) b.setPriceTypeValue(pt.getAsInt());
            else b.setPriceType(PriceTypeProto.valueOf(pt.getAsString()));
        }
        return b.build();
    }

    private static List<FieldViolationProto> onPriceType(List<FieldViolationProto> vs) {
        return vs.stream().filter(v -> v.getField().equals(FIELD)).collect(Collectors.toList());
    }

    @Test
    void fixtureRunsEveryCaseIncludingTheMetricCases() throws IOException {
        Map<String, JsonObject> named = byName();
        assertEquals(cases().size(), named.size(), "case names must be unique");
        assertTrue(named.keySet().containsAll(List.of("inline_unknown", "inline_unknown_no_uuid", "inline_absolute",
                "inline_percentage", "inline_rate", "inline_unrecognised_value", "link_no_price_type",
                "link_unknown_explicit", "no_price")), named.keySet().toString());
        int ran = 0;
        for (JsonObject c : cases()) {
            String name = c.get("name").getAsString();
            List<FieldViolationProto> actual = TransactionRules.validate(transaction(c.getAsJsonObject("transaction")));
            List<JsonElement> want = new ArrayList<>();
            c.getAsJsonArray("violations").forEach(want::add);
            assertEquals(want.size(), actual.size(), name + ": " + actual);
            for (int i = 0; i < want.size(); i++) {
                JsonObject w = want.get(i).getAsJsonObject();
                FieldViolationProto got = actual.get(i);
                assertEquals(w.get("field").getAsString(), got.getField(), name);
                assertEquals(w.get("message").getAsString(), got.getMessage(), name);
                if (w.get("object_id").isJsonNull()) {
                    assertFalse(got.hasObjectId(), name);
                } else {
                    assertEquals(UUID.fromString(w.get("object_id").getAsString()),
                            ProtoSerializationUtil.deserializeUUID(got.getObjectId()), name);
                }
            }
            ran++;
        }
        assertEquals(cases().size(), ran);
    }

    @Test
    void inlineUnknown_givesExactlyOneViolationOnPriceType() throws IOException {
        List<FieldViolationProto> actual = TransactionRules.validate(
                transaction(byName().get("inline_unknown").getAsJsonObject("transaction")));
        assertEquals(1, actual.size());
        assertEquals("price.price_type", actual.get(0).getField());
        assertTrue(actual.get(0).getMessage().contains("price_type"));
        assertEquals(TransactionRules.UNKNOWN_TRADE_PRICE_TYPE, actual.get(0).getMessage());
    }

    @Test
    void inlineAbsolutePercentageRate_giveNoViolationOnPriceType() throws IOException {
        for (String name : List.of("inline_absolute", "inline_percentage", "inline_rate")) {
            assertEquals(List.of(), onPriceType(TransactionRules.validate(
                    transaction(byName().get(name).getAsJsonObject("transaction")))), name);
        }
    }

    @Test
    void linkPrice_isNeverChecked() throws IOException {
        for (String name : List.of("link_no_price_type", "link_unknown_explicit")) {
            assertEquals(List.of(), onPriceType(TransactionRules.validate(
                    transaction(byName().get(name).getAsJsonObject("transaction")))), name);
        }
    }

    @Test
    void unrecognisedRawValue_passes() {
        TransactionProto proto = TransactionProto.newBuilder()
                .setPrice(PriceProto.newBuilder().setPriceTypeValue(999)).build();
        assertEquals(PriceTypeProto.UNRECOGNIZED, proto.getPrice().getPriceType());
        assertEquals(List.of(), TransactionRules.validate(proto));
    }

    @Test
    void everyNamedPriceTypeExceptUnknown_passes() {
        List<PriceTypeProto> visited = new ArrayList<>();
        for (PriceTypeProto t : PriceTypeProto.values()) {
            if (t == PriceTypeProto.UNRECOGNIZED || t == PriceTypeProto.UNKNOWN_PRICE_TYPE) continue;
            TransactionProto proto = TransactionProto.newBuilder()
                    .setPrice(PriceProto.newBuilder().setPriceType(t)).build();
            assertEquals(List.of(), TransactionRules.validate(proto), t.name());
            visited.add(t);
        }
        assertTrue(visited.size() >= 5, visited.toString());
        assertTrue(visited.contains(PriceTypeProto.RATE), visited.toString());
    }
}
