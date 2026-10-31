package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.errors.UnmappedProductTypeError;
import common.models.errors.transaction.TransactionProcessingException;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-409: valuation_arms in hierarchy.json, resolved by ProductInputs.armFor /
 * requiredMarketData. The shared cases live in
 * ledger-models-protos/fixtures/valuation_arms_cases.json, read by the
 * Python, JS and Rust tests too.
 */
class ProductInputsTest {

    private static final Path PROTOS = Path.of("..", "ledger-models-protos");

    private static JsonObject readJson(Path path) throws IOException {
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    private static JsonObject sourceSection() throws IOException {
        return readJson(PROTOS.resolve("hierarchy.json")).getAsJsonObject("valuation_arms");
    }

    private static boolean hasEnumValue(String productType) {
        return Stream.of(ProductTypeProto.values()).anyMatch(v -> v.name().equals(productType));
    }

    private static SecurityProto security(String productType, String couponType) {
        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.valueOf(productType))
                .setBondDetails(BondDetailsProto.newBuilder().setCouponType(CouponTypeProto.valueOf(couponType)))
                .build();
    }

    /** Resolves through a real proto when the type has an enum value; planned leaves by name. */
    private static ProductInputs.Arm resolve(String productType, String couponType) {
        if (!hasEnumValue(productType)) return ProductInputs.shipped().require(productType, couponType);
        SecurityProto s = security(productType, couponType);
        return new ProductInputs.Arm(ProductInputs.armFor(s), ProductInputs.requiredMarketData(s));
    }

    private static List<String> names(List<MarketDataKind> kinds) {
        return kinds.stream().map(Enum::name).collect(Collectors.toList());
    }

    // ---------- metric 1: shared fixture ----------

    @Test
    void fixtureCases() throws IOException {
        JsonArray cases = readJson(PROTOS.resolve("fixtures").resolve("valuation_arms_cases.json"))
                .getAsJsonArray("cases");
        assertTrue(cases.size() >= 5, "fixture has too few cases: " + cases.size());
        Set<String> seen = new TreeSet<>();
        for (JsonElement el : cases) {
            JsonObject c = el.getAsJsonObject();
            String pt = c.get("product_type").getAsString();
            String coupon = c.get("coupon_type").getAsString();
            seen.add(pt + "/" + coupon);
            if (c.has("error")) {
                assertEquals("UnmappedProductTypeError", c.get("error").getAsString());
                UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class,
                        () -> resolve(pt, coupon), pt + "/" + coupon);
                assertEquals(pt, e.getProductType());
                assertEquals(coupon, e.getCouponType());
            } else {
                ProductInputs.Arm a = resolve(pt, coupon);
                assertEquals(c.get("arm").getAsString(), a.arm, pt + "/" + coupon);
                List<String> requires = new ArrayList<>();
                for (JsonElement r : c.getAsJsonArray("requires")) requires.add(r.getAsString());
                assertEquals(requires, names(a.requires), pt + "/" + coupon);
            }
        }
        assertTrue(seen.containsAll(Set.of("TBILL/ZERO", "TIPS/FIXED", "CORP_BOND/FLOAT",
                "TREASURY_NOTE/FLOAT", "FX_SPOT/UNKNOWN_COUPON_TYPE")), "fixture is missing a required case: " + seen);
    }

    // ---------- metric 2: unmapped types raise ----------

    @Test
    void unmappedTypesRaise() {
        Set<String> unmapped = new TreeSet<>();
        for (String root : List.of("INDEX", "CRYPTO", "COMMODITY_SPOT")) {
            for (String n : ProductHierarchy.descendantsOf(root)) {
                if (ProductHierarchy.descendantsOf(n).isEmpty()) unmapped.add(n);
            }
        }
        unmapped.add("FX_SPOT");
        assertTrue(unmapped.containsAll(Set.of("FX_SPOT", "COMMODITY_INDEX", "PLATINUM", "PALLADIUM",
                "CRYPTOCURRENCY", "GOLD")), unmapped.toString());

        for (String pt : unmapped) {
            UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class,
                    () -> resolve(pt, "UNKNOWN_COUPON_TYPE"), pt);
            assertTrue(e.getMessage().contains(pt), e.getMessage());
            assertTrue(e.getMessage().contains("UNKNOWN_COUPON_TYPE"), e.getMessage());
        }
    }

    @Test
    void messageNamesProductAndCouponType() {
        SecurityProto gold = security("GOLD", "FLOAT");
        UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class, () -> ProductInputs.armFor(gold));
        assertTrue(e.getMessage().contains("GOLD"), e.getMessage());
        assertTrue(e.getMessage().contains("FLOAT"), e.getMessage());
        assertThrows(UnmappedProductTypeError.class, () -> ProductInputs.requiredMarketData(gold));
    }

    // ---------- metric 3: every leaf covered ----------

    @Test
    void everyLeafCovered() {
        assertEquals(Set.of(), ProductInputs.shipped().uncoveredLeaves());
    }

    @Test
    void uncoveredLeafIsReported() throws IOException {
        JsonObject section = sourceSection().deepCopy();
        JsonArray unpriced = new JsonArray();
        for (JsonElement n : section.getAsJsonArray("unpriced")) {
            if (!n.getAsString().equals("FUND_LP")) unpriced.add(n);
        }
        section.add("unpriced", unpriced);
        assertEquals(Set.of("FUND_LP"), ProductInputs.parse(section).uncoveredLeaves());
    }

    // ---------- metric 4: bundled section equals source ----------

    @Test
    void bundledSectionMatchesSource() throws IOException {
        JsonObject bundled;
        try (InputStream in = ProductInputs.class.getResourceAsStream("/hierarchy.json")) {
            assertNotNull(in, "hierarchy.json is not on the classpath");
            bundled = new Gson().fromJson(new InputStreamReader(in, StandardCharsets.UTF_8), JsonObject.class);
        }
        assertTrue(bundled.has("valuation_arms"), "bundled hierarchy.json has no valuation_arms");
        assertEquals(sourceSection(), bundled.getAsJsonObject("valuation_arms"));
    }

    // ---------- metric 5: closed requires vocabulary ----------

    @Test
    void shippedRequiresInVocabulary() throws IOException {
        Set<String> allowed = Set.of("CPI_U", "FRN_FIXINGS", "FRN_CURVE");
        int seen = 0;
        for (JsonElement el : sourceSection().getAsJsonArray("entries")) {
            for (JsonElement r : el.getAsJsonObject().getAsJsonArray("requires")) {
                assertTrue(allowed.contains(r.getAsString()), r.getAsString());
                seen++;
            }
        }
        assertTrue(seen > 0, "no requires values in the shipped section");
        assertEquals(allowed, Stream.of(MarketDataKind.values()).map(Enum::name).collect(Collectors.toSet()));
    }

    @Test
    void parseRejectsUnknownRequires() throws IOException {
        JsonObject section = sourceSection().deepCopy();
        section.getAsJsonArray("entries").get(0).getAsJsonObject()
                .getAsJsonArray("requires").add("FX_RATE");
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> ProductInputs.parse(section));
        assertTrue(e.getMessage().contains("FX_RATE"), e.getMessage());
    }

    // ---------- guardrails ----------

    @Test
    void resolutionReadsTheSection() throws IOException {
        JsonObject section = sourceSection().deepCopy();
        for (JsonElement el : section.getAsJsonArray("entries")) {
            JsonObject e = el.getAsJsonObject();
            if (e.get("node").getAsString().equals("STOCK")) e.addProperty("arm", "cash");
        }
        assertEquals("cash", ProductInputs.parse(section).require("COMMON_STOCK", "UNKNOWN_COUPON_TYPE").arm);
        assertEquals("equity", ProductInputs.armFor(security("COMMON_STOCK", "UNKNOWN_COUPON_TYPE")));
    }

    @Test
    void unsetBondDetailsReadsAsUnknownCouponType() {
        SecurityProto corp = SecurityProto.newBuilder().setProductType(ProductTypeProto.CORP_BOND).build();
        assertEquals("bond", ProductInputs.armFor(corp));
        assertEquals(List.of(), ProductInputs.requiredMarketData(corp));

        SecurityProto fx = SecurityProto.newBuilder().setProductType(ProductTypeProto.FX_SPOT).build();
        UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class, () -> ProductInputs.armFor(fx));
        assertEquals("UNKNOWN_COUPON_TYPE", e.getCouponType());
        assertTrue(e.getMessage().contains("UNKNOWN_COUPON_TYPE"), e.getMessage());
    }

    @Test
    void unmappedIsAnInputErrorNotAStateError() {
        UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class,
                () -> ProductInputs.armFor(security("FX_SPOT", "UNKNOWN_COUPON_TYPE")));
        assertTrue(e instanceof IllegalArgumentException);
        assertFalse(((RuntimeException) e) instanceof TransactionProcessingException);
    }

    @Test
    void requiredMarketDataIsUnmodifiable() {
        List<MarketDataKind> tips = ProductInputs.requiredMarketData(security("TIPS", "FIXED"));
        assertThrows(UnsupportedOperationException.class, () -> tips.add(MarketDataKind.FRN_CURVE));
    }

    // ---------- LM-427: measuresForArm ----------

    private static final Set<String> ARMS = Set.of("bond", "tips", "frn", "mbs", "equity", "cash");

    private static JsonObject measuresFixture() throws IOException {
        return readJson(Path.of("..", "test-fixtures", "catalog", "measures-for-arm.json"));
    }

    private static List<String> measureNames(List<MeasureProto> measures) {
        return measures.stream().map(MeasureProto::name).collect(Collectors.toList());
    }

    @Test
    void measuresFixtureListsTheSixArmsNoneEmpty() throws IOException {
        JsonObject arms = measuresFixture().getAsJsonObject("arms");
        assertEquals(ARMS, arms.keySet());
        for (String arm : ARMS) assertFalse(arms.getAsJsonArray(arm).isEmpty(), arm);
    }

    @Test
    void measuresForArmMatchesTheSharedFixture() throws IOException {
        JsonObject arms = measuresFixture().getAsJsonObject("arms");
        for (String arm : ARMS) {
            List<String> got = measureNames(ProductInputs.measuresForArm(arm));
            assertEquals(got.size(), new HashSet<>(got).size(), arm + " has duplicates");
            Set<String> expected = new TreeSet<>();
            arms.getAsJsonArray(arm).forEach(e -> expected.add(e.getAsString()));
            assertEquals(expected.size(), arms.getAsJsonArray(arm).size(), arm);
            assertEquals(expected, new TreeSet<>(got), arm);
        }
    }

    @Test
    void measuresForArmFrnAndTips() {
        List<String> frn = measureNames(ProductInputs.measuresForArm("frn"));
        for (String name : List.of("CONVEXITY", "MODIFIED_DURATION", "DV01", "PROFIT_LOSS_PERCENT")) {
            assertFalse(frn.contains(name), "frn has " + name);
        }
        List<String> tips = measureNames(ProductInputs.measuresForArm("tips"));
        assertTrue(tips.containsAll(List.of("REFERENCE_CPI", "INDEX_RATIO")));
    }

    @Test
    void measuresForUnknownArmIsUnmapped() throws IOException {
        String arm = measuresFixture().get("unknown_arm").getAsString();
        UnmappedProductTypeError e = assertThrows(UnmappedProductTypeError.class, () -> ProductInputs.measuresForArm(arm));
        assertEquals(UnmappedProductTypeError.class, e.getClass());
        assertEquals("swap", e.getProductType());
    }

    /** The bundled catalog, with {@code fields} set on the entry named {@code name}. */
    private static JsonArray catalogWith(String name, JsonObject fields) throws IOException {
        JsonArray measures = readJson(Path.of("src", "main", "resources", "catalog", "measures.json"))
                .getAsJsonArray("measures");
        for (JsonElement e : measures) {
            JsonObject m = e.getAsJsonObject();
            if (m.get("name").getAsString().equals(name)) fields.entrySet().forEach(f -> m.add(f.getKey(), f.getValue()));
        }
        return measures;
    }

    @Test
    void measuresForArmFollowsImplemented() throws IOException {
        JsonObject off = new JsonObject();
        off.addProperty("implemented", false);
        assertTrue(ProductInputs.measuresForArm("frn").contains(MeasureProto.DISCOUNT_MARGIN));
        assertFalse(ProductInputs.measuresForArm(catalogWith("DISCOUNT_MARGIN", off), "frn")
                .contains(MeasureProto.DISCOUNT_MARGIN));
    }

    @Test
    void measuresForArmFollowsAnAncestorNode() throws IOException {
        JsonObject govBond = new JsonObject();
        govBond.addProperty("implemented", true);
        JsonArray appliesTo = new JsonArray();
        appliesTo.add(new JsonPrimitive("GOV_BOND"));
        govBond.add("applies_to", appliesTo);
        JsonArray measures = catalogWith("PAR_YIELD", govBond);
        for (String arm : List.of("frn", "bond")) {
            assertFalse(ProductInputs.measuresForArm(arm).contains(MeasureProto.PAR_YIELD), arm);
            assertTrue(ProductInputs.measuresForArm(measures, arm).contains(MeasureProto.PAR_YIELD), arm);
        }
    }
}
