package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.errors.MissingMarketDataError;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-418: the deprecated arm-named aliases give the same results as the
 * input-type names they call, and hierarchy.json still loads with the legacy
 * {@code valuation_arms} / {@code arm} keys for one release.
 */
@SuppressWarnings("deprecation")
class ProductInputsDeprecatedAliasesTest {

    private static final Path PROTOS = Path.of("..", "ledger-models-protos");

    private static JsonObject readJson(Path path) throws IOException {
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    private static JsonObject hierarchy() throws IOException {
        return readJson(PROTOS.resolve("hierarchy.json"));
    }

    /** {@code root} with the section and entry keys renamed to the legacy names. */
    private static JsonObject legacy(JsonObject root) {
        JsonObject out = root.deepCopy();
        JsonObject section = out.remove("valuation_input_types").getAsJsonObject();
        for (JsonElement e : section.getAsJsonArray("entries")) {
            JsonObject entry = e.getAsJsonObject();
            entry.add("arm", entry.remove("input_type"));
        }
        out.add("valuation_arms", section);
        return out;
    }

    /** The value, or the thrown exception's class and message. */
    private static Object outcome(Supplier<Object> call) {
        try {
            return call.get();
        } catch (RuntimeException e) {
            return List.of(e.getClass(), String.valueOf(e.getMessage()));
        }
    }

    // ---------- metric 2: the aliases match the new names ----------

    @Test
    void armForMatchesInputTypeForOnEveryFixtureCase() throws IOException {
        int compared = 0;
        for (JsonElement el : readJson(PROTOS.resolve("fixtures").resolve("valuation_input_types_cases.json"))
                .getAsJsonArray("cases")) {
            JsonObject c = el.getAsJsonObject();
            String pt = c.get("product_type").getAsString();
            if (ProductTypeProto.getDescriptor().findValueByName(pt) == null) continue;
            SecurityProto s = SecurityProto.newBuilder()
                    .setProductType(ProductTypeProto.valueOf(pt))
                    .setBondDetails(BondDetailsProto.newBuilder()
                            .setCouponType(CouponTypeProto.valueOf(c.get("coupon_type").getAsString())))
                    .build();
            Object expected = outcome(() -> ProductInputs.inputTypeFor(s));
            assertEquals(expected, outcome(() -> ProductInputs.armFor(s)), pt);
            if (c.has("input_type")) assertEquals(c.get("input_type").getAsString(), expected, pt);
            compared++;
        }
        assertTrue(compared >= 5, "too few fixture cases compared: " + compared);
    }

    @Test
    void measuresForArmMatchesMeasuresForInputType() throws IOException {
        JsonObject fixture = readJson(Path.of("..", "test-fixtures", "catalog", "measures-for-input-type.json"));
        List<String> inputTypes = new ArrayList<>(fixture.getAsJsonObject("input_types").keySet());
        inputTypes.add(fixture.get("unknown_input_type").getAsString());
        for (String inputType : inputTypes) {
            Object expected = outcome(() -> ProductInputs.measuresForInputType(inputType));
            assertEquals(expected, outcome(() -> ProductInputs.measuresForArm(inputType)), inputType);
        }
        assertTrue(ProductInputs.measuresForArm("tips").contains(MeasureProto.REFERENCE_CPI));
    }

    @Test
    void measuresForArmGivesInflationCompensationForTipsOnly() throws IOException {
        // LM-434: valuation-service computes it for tips (VS-155).
        JsonObject fixture = readJson(Path.of("..", "test-fixtures", "catalog", "measures-for-input-type.json"));
        List<String> others = new ArrayList<>(fixture.getAsJsonObject("input_types").keySet());
        others.remove("tips");
        assertEquals(5, others.size(), others.toString());
        assertTrue(ProductInputs.measuresForArm("tips").contains(MeasureProto.INFLATION_COMPENSATION));
        for (String arm : others) {
            assertFalse(ProductInputs.measuresForArm(arm).contains(MeasureProto.INFLATION_COMPENSATION), arm);
        }
    }

    @Test
    void missingMarketDataGetArmMatchesGetInputType() {
        SecurityProto tips = SecurityProto.newBuilder().setProductType(ProductTypeProto.TIPS).build();
        MissingMarketDataError e = assertThrows(MissingMarketDataError.class,
                () -> ProductInputs.forSecurity(tips, PriceProto.getDefaultInstance(), MarketData.NONE));
        assertEquals("tips", e.getInputType());
        assertEquals(e.getInputType(), e.getArm());
        assertTrue(e.getMessage().contains("for input type tips"), e.getMessage());

        MissingMarketDataError built = new MissingMarketDataError("frn", MarketDataKind.FRN_FIXINGS, "frn.fixings", null);
        assertEquals(built.getInputType(), built.getArm());
    }

    // ---------- metric 3: the legacy keys load the same mapping ----------

    @Test
    void legacyKeysLoadTheSameMapping() throws IOException {
        JsonObject root = hierarchy();
        assertEquals(8, root.getAsJsonObject("valuation_input_types").getAsJsonArray("entries").size());
        ProductInputs.ValuationInputTypes current = ProductInputs.fromHierarchy(root);
        ProductInputs.ValuationInputTypes old = ProductInputs.fromHierarchy(legacy(root));
        assertEquals(current, old);
        assertEquals(ProductInputs.shipped(), current);
        assertEquals(current.uncoveredLeaves(), old.uncoveredLeaves());
    }

    @Test
    void ambiguousOrMissingKeysAreRejected() throws IOException {
        JsonObject root = hierarchy();
        Map<String, Consumer<JsonObject>> cases = Map.of(
                "both root keys", r -> r.add("valuation_arms", r.get("valuation_input_types").deepCopy()),
                "neither root key", r -> r.remove("valuation_input_types"),
                "an entry with both fields", r -> r.getAsJsonObject("valuation_input_types").getAsJsonArray("entries")
                        .get(0).getAsJsonObject().addProperty("arm", "bond"));
        for (Map.Entry<String, Consumer<JsonObject>> c : cases.entrySet()) {
            JsonObject broken = root.deepCopy();
            c.getValue().accept(broken);
            IllegalStateException e = assertThrows(IllegalStateException.class,
                    () -> ProductInputs.fromHierarchy(broken), c.getKey());
            assertTrue(e.getMessage().contains("valuation_input_types"), e.getMessage());
        }
    }
}
