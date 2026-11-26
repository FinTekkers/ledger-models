package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.DayCountConventionProto;
import fintekkers.models.security.EquityDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-498: bond day-count convention. DayCountConventionProto, optional
 * BondDetailsProto.day_count, hierarchy.json {@code default_day_count}, the
 * {@link Security#getDayCount()} getter and the date helpers. Parity with
 * Python test_day_count.py, JS day_count.test.ts and Rust day_count_test.rs.
 *
 * <p>Shared cases live in ledger-models-protos/fixtures/default_day_count_cases.json
 * and test-fixtures/day-count/cases.json; expected values come from those files
 * only, never from the code under test.
 */
class DayCountsTest {

    private static final Path ROOT = Path.of("..");
    private static final Path PROTOS = ROOT.resolve("ledger-models-protos");

    private static JsonObject readJson(Path path) throws IOException {
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    private static JsonObject productCases() throws IOException {
        return readJson(PROTOS.resolve("fixtures").resolve("default_day_count_cases.json")).getAsJsonObject("cases");
    }

    private static JsonArray dateCases() throws IOException {
        return readJson(ROOT.resolve("test-fixtures").resolve("day-count").resolve("cases.json")).getAsJsonArray("cases");
    }

    private static JsonObject hierarchy() throws IOException {
        return readJson(PROTOS.resolve("hierarchy.json"));
    }

    private static SecurityProto bond(ProductTypeProto productType, DayCountConventionProto dayCount) {
        BondDetailsProto.Builder bd = BondDetailsProto.newBuilder();
        if (dayCount != null) bd.setDayCount(dayCount);
        return SecurityProto.newBuilder().setProductType(productType).setBondDetails(bd).build();
    }

    // ---------- metric 1: enum numbers and presence ----------

    @Test
    void enumNumbers() {
        assertEquals(0, DayCountConventionProto.UNKNOWN_DAY_COUNT.getNumber());
        assertEquals(1, DayCountConventionProto.ACT_ACT_ICMA.getNumber());
        assertEquals(2, DayCountConventionProto.THIRTY_360_US.getNumber());
        assertEquals(3, DayCountConventionProto.ACT_360.getNumber());
        assertEquals(4, DayCountConventionProto.ACT_365_FIXED.getNumber());
        assertEquals(6, DayCountConventionProto.values().length); // five values plus UNRECOGNIZED
        assertEquals(11, BondDetailsProto.DAY_COUNT_FIELD_NUMBER);
    }

    @Test
    void presenceIsFalseWhenUnset() {
        assertFalse(BondDetailsProto.newBuilder().build().hasDayCount());
        assertTrue(BondDetailsProto.newBuilder().setDayCount(DayCountConventionProto.ACT_360).build().hasDayCount());
    }

    // ---------- metric 2: hierarchy.json default_day_count ----------

    @Test
    void shippedSectionHasTheSixLeafMappings() throws IOException {
        Map<String, String> expected = Map.of(
                "TREASURY_NOTE", "ACT_ACT_ICMA",
                "TREASURY_BOND", "ACT_ACT_ICMA",
                "TIPS", "ACT_ACT_ICMA",
                "STRIPS", "ACT_ACT_ICMA",
                "TBILL", "ACT_360",
                "CORP_BOND", "THIRTY_360_US");
        JsonObject section = hierarchy().getAsJsonObject(DayCounts.SECTION);
        assertEquals(expected, section.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getAsString())));
        assertEquals(DayCounts.shippedDefaults(), DayCounts.fromHierarchy(hierarchy()));
    }

    @Test
    void fixtureListsEveryProductTypeEnumValue() throws IOException {
        Set<String> enumNames = Stream.of(ProductTypeProto.values())
                .filter(v -> v != ProductTypeProto.UNRECOGNIZED)
                .map(Enum::name)
                .collect(Collectors.toCollection(TreeSet::new));
        assertEquals(enumNames, new TreeSet<>(productCases().keySet()));
    }

    @Test
    void everyProductResolvesAsTheFixtureSays() throws IOException {
        for (Map.Entry<String, JsonElement> c : productCases().entrySet()) {
            SecurityProto security = bond(ProductTypeProto.valueOf(c.getKey()), null);
            assertEquals(DayCountConventionProto.valueOf(c.getValue().getAsString()),
                    DayCounts.resolve(security), c.getKey());
        }
    }

    @Test
    void shippedDefaultsAreReadOnly() {
        assertThrows(UnsupportedOperationException.class,
                () -> DayCounts.shippedDefaults().put("BOND", DayCountConventionProto.ACT_360));
    }

    @Test
    void brokenSectionFailsAtLoad() throws IOException {
        Map<String, Consumer<JsonObject>> cases = Map.of(
                "NOT_A_NODE", r -> r.getAsJsonObject(DayCounts.SECTION).addProperty("NOT_A_NODE", "ACT_360"),
                "THIRTY_360", r -> r.getAsJsonObject(DayCounts.SECTION).addProperty("CORP_BOND", "THIRTY_360"),
                "UNKNOWN_DAY_COUNT", r -> r.getAsJsonObject(DayCounts.SECTION).addProperty("CORP_BOND", "UNKNOWN_DAY_COUNT"),
                "UNRECOGNIZED", r -> r.getAsJsonObject(DayCounts.SECTION).addProperty("CORP_BOND", "UNRECOGNIZED"),
                "CORP_BOND", r -> r.getAsJsonObject(DayCounts.SECTION).addProperty("CORP_BOND", 2),
                "missing", r -> r.remove(DayCounts.SECTION),
                "object", r -> r.add(DayCounts.SECTION, new JsonArray()));
        for (Map.Entry<String, Consumer<JsonObject>> c : cases.entrySet()) {
            JsonObject root = hierarchy();
            c.getValue().accept(root);
            IllegalStateException e = assertThrows(IllegalStateException.class,
                    () -> DayCounts.fromHierarchy(root), c.getKey());
            assertTrue(e.getMessage().contains(DayCounts.SECTION), e.getMessage());
            assertTrue(e.getMessage().contains(c.getKey()), c.getKey() + ": " + e.getMessage());
        }
    }

    // ---------- metric 3: the getter ----------

    @Test
    void getterReturnsTheProductDefaultWhenUnset() {
        assertEquals(DayCountConventionProto.ACT_ACT_ICMA,
                new BondSecurity(bond(ProductTypeProto.TREASURY_NOTE, null)).getDayCount());
        assertEquals(DayCountConventionProto.THIRTY_360_US,
                new BondSecurity(bond(ProductTypeProto.CORP_BOND, null)).getDayCount());
        assertEquals(DayCountConventionProto.ACT_360,
                new BondSecurity(bond(ProductTypeProto.TBILL, null)).getDayCount());
    }

    @Test
    void getterExplicitValueWins() {
        assertEquals(DayCountConventionProto.ACT_360,
                new BondSecurity(bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360)).getDayCount());
    }

    @Test
    void roundTripKeepsExplicitAndKeepsUnsetUnset() throws Exception {
        SecurityProto explicit = SecurityProto.parseFrom(
                bond(ProductTypeProto.TREASURY_NOTE, DayCountConventionProto.ACT_360).toByteArray());
        assertTrue(explicit.getBondDetails().hasDayCount());
        assertEquals(DayCountConventionProto.ACT_360, Security.fromProto(explicit).getDayCount());

        SecurityProto unset = SecurityProto.parseFrom(bond(ProductTypeProto.TREASURY_NOTE, null).toByteArray());
        assertFalse(unset.getBondDetails().hasDayCount());
        assertEquals(DayCountConventionProto.ACT_ACT_ICMA, Security.fromProto(unset).getDayCount());
    }

    @Test
    void roundTripExplicitUnknownIsPresentAndResolvesLikeUnset() throws Exception {
        SecurityProto parsed = SecurityProto.parseFrom(
                bond(ProductTypeProto.CORP_BOND, DayCountConventionProto.UNKNOWN_DAY_COUNT).toByteArray());
        assertTrue(parsed.getBondDetails().hasDayCount());
        assertEquals(DayCountConventionProto.THIRTY_360_US, Security.fromProto(parsed).getDayCount());
    }

    // ---------- guardrail 3: no entry is UNKNOWN_DAY_COUNT, never a guess ----------

    @Test
    void getterReturnsUnknownForAProductWithNoEntry() {
        assertEquals(DayCountConventionProto.UNKNOWN_DAY_COUNT,
                new BondSecurity(bond(ProductTypeProto.TREASURY_FRN, null)).getDayCount());
        // BondSecurity.getProductType() and getProto() read PRODUCT_TYPE_UNKNOWN
        // as TREASURY_NOTE; the getter must not.
        BondSecurity untyped = new BondSecurity(bond(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, null));
        assertEquals(DayCountConventionProto.UNKNOWN_DAY_COUNT, untyped.getDayCount());
        assertEquals(ProductTypeProto.TREASURY_NOTE, untyped.getProductType());
        assertEquals(DayCountConventionProto.UNKNOWN_DAY_COUNT, untyped.getDayCount());
    }

    @Test
    void getterReturnsUnknownForAnUnrecognisedExplicitValue() {
        SecurityProto proto = SecurityProto.newBuilder().setProductType(ProductTypeProto.CORP_BOND)
                .setBondDetails(BondDetailsProto.newBuilder().setDayCountValue(99)).build();
        assertEquals(DayCountConventionProto.UNKNOWN_DAY_COUNT, new BondSecurity(proto).getDayCount());
    }

    @Test
    void getterOnAnEquityReturnsUnknown() {
        Security equity = Security.fromProto(SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.COMMON_STOCK)
                .setEquityDetails(EquityDetailsProto.newBuilder()).build());
        assertEquals(DayCountConventionProto.UNKNOWN_DAY_COUNT, equity.getDayCount());
    }

    // ---------- metric 4: the date helpers ----------

    @Test
    void helpersMatchEveryFixtureRow() throws IOException {
        JsonArray cases = dateCases();
        assertTrue(cases.size() > 0);
        for (JsonElement e : cases) {
            JsonObject c = e.getAsJsonObject();
            String id = c.get("convention").getAsString() + ":" + c.get("case").getAsString();
            DayCountConventionProto conv = DayCountConventionProto.valueOf(c.get("convention").getAsString());
            LocalDate start = LocalDate.parse(c.get("start").getAsString());
            LocalDate end = LocalDate.parse(c.get("end").getAsString());
            assertEquals(c.get("day_count").getAsLong(), DayCounts.dayCount(conv, start, end), id);
            double yearFraction = c.get("year_fraction").getAsDouble();
            if (conv == DayCountConventionProto.ACT_ACT_ICMA) {
                LocalDate ps = LocalDate.parse(c.get("period_start").getAsString());
                LocalDate pe = LocalDate.parse(c.get("period_end").getAsString());
                assertEquals(c.get("period_fraction").getAsDouble(), DayCounts.icmaPeriodFraction(start, end, ps, pe),
                        1e-12, id);
                assertEquals(yearFraction,
                        DayCounts.icmaYearFraction(start, end, ps, pe, c.get("frequency").getAsInt()), 1e-12, id);
            } else {
                assertEquals(yearFraction, DayCounts.yearFraction(conv, start, end), 1e-12, id);
            }
        }
    }

    @Test
    void badInputThrowsModelValidationException() {
        LocalDate jan = LocalDate.of(2027, 1, 1);
        LocalDate feb = LocalDate.of(2027, 2, 1);
        LocalDate ps = LocalDate.of(2026, 12, 1);
        LocalDate pe = LocalDate.of(2027, 6, 1);
        List<Executable> calls = List.of(
                () -> DayCounts.dayCount(DayCountConventionProto.THIRTY_360_US, feb, jan),
                () -> DayCounts.dayCount(DayCountConventionProto.UNKNOWN_DAY_COUNT, jan, feb),
                () -> DayCounts.yearFraction(DayCountConventionProto.UNKNOWN_DAY_COUNT, jan, feb),
                () -> DayCounts.yearFraction(DayCountConventionProto.ACT_ACT_ICMA, jan, feb),
                () -> DayCounts.icmaYearFraction(feb, jan, ps, pe, 2),
                () -> DayCounts.icmaYearFraction(LocalDate.of(2026, 11, 1), feb, ps, pe, 2),
                () -> DayCounts.icmaYearFraction(jan, feb, ps, pe, 0));
        for (Executable call : calls) {
            Throwable t = assertThrows(Throwable.class, call);
            assertInstanceOf(ModelValidationException.class, t);
        }
    }

    // ---------- guardrail 1: a bad day-count section breaks nothing else ----------

    @Test
    void badDayCountSectionLeavesPriceTypesAndHelpersWorking() throws IOException {
        JsonObject root = hierarchy();
        root.getAsJsonObject(DayCounts.SECTION).addProperty("NOT_A_NODE", "ACT_360");
        assertThrows(IllegalStateException.class, () -> DayCounts.fromHierarchy(root));
        assertEquals(PriceTypeProto.PERCENTAGE,
                DefaultPriceTypes.defaultFor(DefaultPriceTypes.fromHierarchy(root), "TREASURY_NOTE").orElseThrow());
        assertEquals(90, DayCounts.dayCount(DayCountConventionProto.THIRTY_360_US,
                LocalDate.of(2026, 12, 1), LocalDate.of(2027, 3, 1)));
    }
}
