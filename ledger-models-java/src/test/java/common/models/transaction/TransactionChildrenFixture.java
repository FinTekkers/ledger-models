package common.models.transaction;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.protobuf.ByteString;
import fintekkers.models.security.CashDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** LM-438: builds TransactionProtos from the shared test-fixtures/transaction-children/cases.json. */
final class TransactionChildrenFixture {
    static final Path DIR = Path.of("..", "test-fixtures", "transaction-children");

    private TransactionChildrenFixture() {}

    static JsonObject read() throws IOException {
        try (Reader r = Files.newBufferedReader(DIR.resolve("cases.json"), StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    /** Every case by name, in file order. */
    static Map<String, JsonObject> cases() throws IOException {
        Map<String, JsonObject> out = new LinkedHashMap<>();
        for (JsonElement e : read().getAsJsonArray("cases")) {
            JsonObject c = e.getAsJsonObject();
            out.put(c.get("name").getAsString(), c);
        }
        return out;
    }

    /** The case's transaction tree as a proto, as_of set on every node. */
    static TransactionProto proto(String name) throws IOException {
        JsonObject root = read();
        ZonedDateTime asOf = ZonedDateTime.ofInstant(
                Instant.ofEpochSecond(root.get("as_of_seconds").getAsLong()), ZoneId.of("UTC"));
        return node(cases().get(name).getAsJsonObject("transaction"), asOf);
    }

    private static TransactionProto node(JsonObject n, ZonedDateTime asOf) {
        TransactionProto.Builder b = TransactionProto.newBuilder()
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setTransactionType(TransactionTypeProto.valueOf(n.get("transaction_type").getAsString()))
                .setSecurity(security(n.getAsJsonObject("security")));
        if (n.has("uuid")) b.setUuid(uuid(n.get("uuid").getAsString()));
        if (n.has("children")) {
            for (JsonElement c : n.getAsJsonArray("children")) b.addChildTransactions(node(c.getAsJsonObject(), asOf));
        }
        return b.build();
    }

    private static SecurityProto security(JsonObject s) {
        SecurityProto.Builder b = SecurityProto.newBuilder().setUuid(uuid(s.get("uuid").getAsString()));
        if (s.has("link") && s.get("link").getAsBoolean()) return b.setIsLink(true).build();
        if (s.has("product_type")) b.setProductType(ProductTypeProto.valueOf(s.get("product_type").getAsString()));
        if (s.has("cash_details") && s.get("cash_details").getAsBoolean()) b.setCashDetails(CashDetailsProto.getDefaultInstance());
        return b.build();
    }

    /** An empty string is a UUIDProto with empty raw_uuid. */
    private static UUIDProto uuid(String s) {
        return s.isEmpty()
                ? UUIDProto.newBuilder().setRawUuid(ByteString.EMPTY).build()
                : ProtoSerializationUtil.serializeUUID(UUID.fromString(s));
    }
}
