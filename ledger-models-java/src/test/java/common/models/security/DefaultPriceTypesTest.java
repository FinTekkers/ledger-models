package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.errors.NoDefaultPriceTypeError;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-461: default trade-price type by product, from hierarchy.json
 * {@code default_price_types}. Parity with Python test_default_price_types.py,
 * JS default_price_types.test.ts and Rust default_price_types_test.rs.
 *
 * <p>The shared cases live in
 * ledger-models-protos/fixtures/default_price_types_cases.json; expected values
 * come from that file only, never from the resolver under test.
 */
class DefaultPriceTypesTest {

    private static final Path PROTOS = Path.of("..", "ledger-models-protos");

    private static JsonObject readJson(Path path) throws IOException {
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    private static JsonObject fixtureCases() throws IOException {
        return readJson(PROTOS.resolve("fixtures").resolve("default_price_types_cases.json")).getAsJsonObject("cases");
    }

    private static JsonObject hierarchy() throws IOException {
        return readJson(PROTOS.resolve("hierarchy.json"));
    }

    // ---------- metric 3: every product resolves to the fixture, never UNKNOWN ----------

    @Test
    void fixtureListsEveryProductTypeEnumValue() throws IOException {
        Set<String> enumNames = Stream.of(ProductTypeProto.values())
                .filter(v -> v != ProductTypeProto.UNRECOGNIZED)
                .map(Enum::name)
                .collect(Collectors.toCollection(TreeSet::new));
        assertEquals(enumNames, new TreeSet<>(fixtureCases().keySet()));
    }

    @Test
    void fixtureCoversDeepestNodeWins() throws IOException {
        JsonObject cases = fixtureCases();
        assertEquals("RATE", cases.get("SOFR_SERIES").getAsString());
        assertEquals("RATE", cases.get("T_BILL_13_WEEK_SERIES").getAsString());
        assertEquals("INDEX_LEVEL", cases.get("CPI_SERIES").getAsString());
    }

    @Test
    void everyProductResolvesAsTheFixtureSays() throws IOException {
        for (Map.Entry<String, JsonElement> c : fixtureCases().entrySet()) {
            String productType = c.getKey();
            String expected = c.getValue().getAsString();
            SecurityProto security = SecurityProto.newBuilder()
                    .setProductType(ProductTypeProto.valueOf(productType)).build();
            if (expected.equals("raises")) {
                assertTrue(DefaultPriceTypes.defaultFor(security).isEmpty(), productType);
                NoDefaultPriceTypeError e = assertThrows(NoDefaultPriceTypeError.class,
                        () -> DefaultPriceTypes.resolve(security, null), productType);
                assertEquals(productType, e.getProductType());
            } else {
                PriceTypeProto resolved = DefaultPriceTypes.resolve(security, null);
                assertEquals(PriceTypeProto.valueOf(expected), resolved, productType);
                assertNotEquals(PriceTypeProto.UNKNOWN_PRICE_TYPE, resolved, productType);
            }
        }
    }

    @Test
    void eachTableKeyResolvesToItsOwnEntry() throws IOException {
        JsonObject section = hierarchy().getAsJsonObject(DefaultPriceTypes.SECTION);
        assertTrue(section.size() > 0);
        for (Map.Entry<String, JsonElement> e : section.entrySet()) {
            assertEquals(PriceTypeProto.valueOf(e.getValue().getAsString()),
                    DefaultPriceTypes.defaultFor(DefaultPriceTypes.shippedDefaults(), e.getKey()).orElseThrow(),
                    e.getKey());
        }
    }

    @Test
    void shippedDefaultsAreReadOnly() {
        assertThrows(UnsupportedOperationException.class,
                () -> DefaultPriceTypes.shippedDefaults().put("BOND", PriceTypeProto.ABSOLUTE));
    }

    @Test
    void sourceSectionParsesToTheShippedTable() throws IOException {
        assertEquals(DefaultPriceTypes.shippedDefaults(), DefaultPriceTypes.fromHierarchy(hierarchy()));
    }

    // ---------- guardrail 3: a broken section fails at load ----------

    @Test
    void brokenSectionFailsAtLoad() throws IOException {
        Map<String, Consumer<JsonObject>> cases = Map.of(
                "NOT_A_NODE", r -> r.getAsJsonObject("default_price_types").addProperty("NOT_A_NODE", "PERCENTAGE"),
                "PERCENT", r -> r.getAsJsonObject("default_price_types").addProperty("BOND", "PERCENT"),
                "UNKNOWN_PRICE_TYPE", r -> r.getAsJsonObject("default_price_types").addProperty("BOND", "UNKNOWN_PRICE_TYPE"),
                "UNRECOGNIZED", r -> r.getAsJsonObject("default_price_types").addProperty("BOND", "UNRECOGNIZED"),
                "BOND", r -> r.getAsJsonObject("default_price_types").add("BOND", JsonNull.INSTANCE),
                "missing", r -> r.remove("default_price_types"),
                "object", r -> r.add("default_price_types", new JsonArray()));
        for (Map.Entry<String, Consumer<JsonObject>> c : cases.entrySet()) {
            JsonObject root = hierarchy();
            c.getValue().accept(root);
            IllegalStateException e = assertThrows(IllegalStateException.class,
                    () -> DefaultPriceTypes.fromHierarchy(root), c.getKey());
            assertTrue(e.getMessage().contains("default_price_types"), e.getMessage());
            assertTrue(e.getMessage().contains(c.getKey()), c.getKey() + ": " + e.getMessage());
        }
    }

    @Test
    void numericValueFailsAtLoad() throws IOException {
        JsonObject root = hierarchy();
        root.getAsJsonObject("default_price_types").add("BOND", new JsonPrimitive(2));
        assertThrows(IllegalStateException.class, () -> DefaultPriceTypes.fromHierarchy(root));
    }
}
