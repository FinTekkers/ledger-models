package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.protobuf.Descriptors;
import fintekkers.models.security.AssetClassProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.InstrumentTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * LM-275: one asset-class vocabulary (hierarchy.json), a shared match helper
 * and labels for every enum the UI shows. The match cases live in
 * ledger-models-protos/fixtures/asset_class_matches.json, shared with the
 * JS and Python tests.
 */
class AssetClassVocabularyTest {

    private static final Path PROTOS = Paths.get("..", "ledger-models-protos");

    private static JsonObject readJson(Path p) throws IOException {
        try (Reader r = Files.newBufferedReader(p, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, JsonObject.class);
        }
    }

    private static String stringOrNull(JsonObject o, String key) {
        JsonElement e = o.get(key);
        return e == null || e.isJsonNull() ? null : e.getAsString();
    }

    // ---------- metric 1: hierarchy.json is the canonical list ----------

    /** True iff the comment block directly above {@code valueName} in the .proto mentions hierarchy.json. */
    private static boolean commentAboveMentionsHierarchy(List<String> protoLines, String valueName) {
        for (int i = 0; i < protoLines.size(); i++) {
            if (protoLines.get(i).trim().matches(valueName + "\\s*=.*")) {
                for (int j = i - 1; j >= 0 && protoLines.get(j).trim().startsWith("//"); j--) {
                    if (protoLines.get(j).contains("hierarchy.json")) return true;
                }
                return false;
            }
        }
        return false;
    }

    @Test
    void everyAssetClassProtoValueIsCanonicalOrDeprecated() throws IOException {
        List<String> proto = Files.readAllLines(
                PROTOS.resolve("fintekkers/models/security/asset_class.proto"), StandardCharsets.UTF_8);
        Set<String> codes = ProductHierarchy.allAssetClasses();
        List<String> offenders = new ArrayList<>();
        for (Descriptors.EnumValueDescriptor v : AssetClassProto.getDescriptor().getValues()) {
            if (v.getName().equals("UNKNOWN_ASSET_CLASS") || codes.contains(v.getName())) continue;
            boolean deprecated = v.getOptions().getDeprecated();
            if (!deprecated || !commentAboveMentionsHierarchy(proto, v.getName())) {
                offenders.add(v.getName());
            }
        }
        assertTrue(offenders.isEmpty(),
                "AssetClassProto values with no hierarchy.json code that are not deprecated with a "
                        + "comment pointing at hierarchy.json: " + offenders);
    }

    @Test
    void protoCommentMatcherIsNotVacuous() {
        List<String> with = Arrays.asList("  // Deprecated: see hierarchy.json", "  FOO = 1 [deprecated = true];");
        List<String> without = Arrays.asList("  // Deprecated.", "  FOO = 1 [deprecated = true];");
        assertTrue(commentAboveMentionsHierarchy(with, "FOO"));
        assertFalse(commentAboveMentionsHierarchy(without, "FOO"));
    }

    // ---------- metric 2: shared fixture ----------

    static Stream<Arguments> fixtureRows() throws IOException {
        JsonObject root = readJson(PROTOS.resolve("fixtures/asset_class_matches.json"));
        List<Arguments> rows = new ArrayList<>();
        for (JsonElement e : root.getAsJsonArray("cases")) {
            JsonObject c = e.getAsJsonObject();
            rows.add(Arguments.of(stringOrNull(c, "filter"), stringOrNull(c, "stored"),
                    c.get("expected").getAsBoolean()));
        }
        return rows.stream();
    }

    @ParameterizedTest(name = "assetClassMatches({0}, {1}) == {2}")
    @MethodSource("fixtureRows")
    void assetClassMatchesSharedFixture(String filter, String stored, boolean expected) {
        assertEquals(expected, ProductHierarchy.assetClassMatches(filter, stored));
    }

    @Test
    void fixtureHasTheRequiredRows() throws IOException {
        Map<String, Boolean> found = new LinkedHashMap<>();
        fixtureRows().forEach(a -> {
            Object[] r = a.get();
            found.put(r[0] + "|" + r[1], (Boolean) r[2]);
        });
        assertTrue(found.size() >= 7, "fixture parsed to " + found.size() + " rows");
        Map<String, Boolean> required = new LinkedHashMap<>();
        required.put("FIXED_INCOME|RATES", true);
        required.put("FIXED_INCOME|CREDIT", true);
        required.put("FIXED_INCOME|Fixed Income", true);
        required.put("EQUITY|Equity", true);
        required.put("CASH|Cash", true);
        required.put("EQUITY|RATES", false);
        required.put("EQUITY|NOT_AN_ASSET_CLASS", false);
        for (Map.Entry<String, Boolean> r : required.entrySet()) {
            assertEquals(r.getValue(), found.get(r.getKey()), "required fixture row " + r.getKey());
        }
    }

    // ---------- guardrail 3: the tree comes from hierarchy.json ----------

    @Test
    void everyHierarchyEntryMatchesItsParentLabelAndAliases() throws IOException {
        JsonObject classes = readJson(PROTOS.resolve("hierarchy.json")).getAsJsonObject("asset_classes");
        assertEquals(classes.size(), ProductHierarchy.allAssetClasses().size());
        for (Map.Entry<String, JsonElement> e : classes.entrySet()) {
            String code = e.getKey();
            JsonObject body = e.getValue().getAsJsonObject();
            String parent = stringOrNull(body, "parent");
            if (parent != null) {
                assertTrue(ProductHierarchy.assetClassMatches(parent, code), parent + " should match " + code);
            }
            assertTrue(ProductHierarchy.assetClassMatches(code, stringOrNull(body, "label")), code + " label");
            if (body.has("aliases")) {
                for (JsonElement a : body.getAsJsonArray("aliases")) {
                    assertTrue(ProductHierarchy.assetClassMatches(code, a.getAsString()), code + " alias " + a);
                }
            }
        }
    }

    @Test
    void ambiguousLabelFailsAtLoad() {
        Map<String, ProductHierarchy.AssetClassEntry> classes = new LinkedHashMap<>();
        classes.put("A", new ProductHierarchy.AssetClassEntry("A", null, "Shared", Collections.emptyList()));
        classes.put("B", new ProductHierarchy.AssetClassEntry("B", null, "shared", Collections.emptyList()));
        assertThrows(IllegalStateException.class, () -> ProductHierarchy.buildAssetClassLookup(classes));
    }

    // ---------- metric 3: labels and placeholders ----------

    @Test
    void everyIdentifierTypeHasLabelAndPlaceholder() {
        int checked = 0;
        for (IdentifierTypeProto v : IdentifierTypeProto.values()) {
            if (v == IdentifierTypeProto.UNRECOGNIZED) continue;
            assertNonEmpty(ProductHierarchy.labelOf(v), "label of IdentifierTypeProto." + v);
            assertNonEmpty(ProductHierarchy.placeholderOf(v), "placeholder of IdentifierTypeProto." + v);
            checked++;
        }
        assertEquals(IdentifierTypeProto.getDescriptor().getValues().size(), checked);
    }

    @Test
    void everyInstrumentTypeHasLabel() {
        int checked = 0;
        for (InstrumentTypeProto v : InstrumentTypeProto.values()) {
            if (v == InstrumentTypeProto.UNRECOGNIZED) continue;
            assertNonEmpty(ProductHierarchy.labelOf(v), "label of InstrumentTypeProto." + v);
            checked++;
        }
        assertEquals(InstrumentTypeProto.getDescriptor().getValues().size(), checked);
    }

    @Test
    void everyProductTypeHasLabel() {
        int checked = 0;
        for (ProductTypeProto v : ProductTypeProto.values()) {
            if (v == ProductTypeProto.UNRECOGNIZED) continue;
            assertNonEmpty(ProductHierarchy.labelOf(v), "label of ProductTypeProto." + v);
            checked++;
        }
        assertEquals(ProductTypeProto.getDescriptor().getValues().size(), checked);
    }

    @Test
    void everyAssetClassProtoHasLabel() {
        int checked = 0;
        for (AssetClassProto v : AssetClassProto.values()) {
            if (v == AssetClassProto.UNRECOGNIZED) continue;
            assertNonEmpty(ProductHierarchy.labelOf(v), "label of AssetClassProto." + v);
            checked++;
        }
        assertEquals(AssetClassProto.getDescriptor().getValues().size(), checked);
        assertEquals("Cash", ProductHierarchy.labelOf(AssetClassProto.CASH_ASSET_CLASS));
    }

    @Test
    void unrecognizedEnumValuesReturnNull() {
        assertNull(ProductHierarchy.labelOf(IdentifierTypeProto.UNRECOGNIZED));
        assertNull(ProductHierarchy.placeholderOf(IdentifierTypeProto.UNRECOGNIZED));
        assertNull(ProductHierarchy.labelOf(InstrumentTypeProto.UNRECOGNIZED));
        assertNull(ProductHierarchy.labelOf(ProductTypeProto.UNRECOGNIZED));
        assertNull(ProductHierarchy.labelOf(AssetClassProto.UNRECOGNIZED));
        assertNull(ProductHierarchy.labelOf((AssetClassProto) null));
    }

    private static void assertNonEmpty(String s, String what) {
        if (s == null || s.trim().isEmpty()) fail(what + " is missing or empty");
    }

    // ---------- guardrails 1 and 2: no wire change ----------

    @Test
    void wireContractIsUnchanged() {
        Map<String, Integer> expected = new LinkedHashMap<>();
        expected.put("UNKNOWN_ASSET_CLASS", 0);
        expected.put("FIXED_INCOME", 1);
        expected.put("EQUITY", 2);
        expected.put("CASH_ASSET_CLASS", 3);
        expected.put("INDEX", 4);
        expected.put("VOLATILITY", 5);
        expected.put("CRYPTO", 6);
        Map<String, Integer> actual = new LinkedHashMap<>();
        for (Descriptors.EnumValueDescriptor v : AssetClassProto.getDescriptor().getValues()) {
            actual.put(v.getName(), v.getNumber());
        }
        assertEquals(expected, actual);

        Set<String> preExistingCodes = new HashSet<>(Arrays.asList(
                "FIXED_INCOME", "RATES", "CREDIT", "EQUITY", "VOLATILITY", "CASH", "FX", "CRYPTO",
                "COMMODITY", "METALS", "ENERGY", "AGRICULTURAL", "REAL_ESTATE", "ALTERNATIVE"));
        assertTrue(ProductHierarchy.allAssetClasses().containsAll(preExistingCodes));

        Descriptors.FieldDescriptor assetClass = SecurityProto.getDescriptor().findFieldByName("asset_class");
        assertEquals(Descriptors.FieldDescriptor.Type.STRING, assetClass.getType());
    }

    // ---------- LM-282: instrument-type code labels ----------
    // Cases come from ledger-models-protos/fixtures/instrument_type_labels.json,
    // shared with the JS, Python and Rust tests.

    private static List<String> fixtureList(String key) throws IOException {
        JsonObject root = readJson(PROTOS.resolve("fixtures/instrument_type_labels.json"));
        List<String> out = new ArrayList<>();
        for (JsonElement e : root.getAsJsonArray(key)) out.add(e.getAsString());
        return out;
    }

    @Test
    void allInstrumentTypesAreTheFixtureCodesInOrder() throws IOException {
        assertEquals(Arrays.asList("CASH", "DERIVATIVE", "REFERENCE_INDEX"), fixtureList("codes"));
        assertEquals(fixtureList("codes"), ProductHierarchy.allInstrumentTypes());
    }

    @Test
    void hierarchyInstrumentTypesIsAMapOfLabelsInFixtureOrder() throws IOException {
        JsonElement it = readJson(PROTOS.resolve("hierarchy.json")).get("instrument_types");
        assertTrue(it.isJsonObject(), "instrument_types should be an object, was " + it);
        List<String> keys = new ArrayList<>();
        for (Map.Entry<String, JsonElement> e : it.getAsJsonObject().entrySet()) {
            keys.add(e.getKey());
            assertTrue(e.getValue().isJsonObject(), e.getKey() + " should map to an object");
            JsonObject body = e.getValue().getAsJsonObject();
            assertEquals(Collections.singleton("label"), body.keySet(), e.getKey() + " keys");
            assertNonEmpty(stringOrNull(body, "label"), "instrument_types." + e.getKey() + ".label");
        }
        assertEquals(fixtureList("codes"), keys);
    }

    @Test
    void instrumentTypeCodeLabelOfKnownAndUnknownCodes() throws IOException {
        for (String code : fixtureList("codes")) {
            assertNonEmpty(ProductHierarchy.instrumentTypeCodeLabelOf(code), "label of code " + code);
        }
        for (String code : fixtureList("unknown")) {
            assertNull(ProductHierarchy.instrumentTypeCodeLabelOf(code), "label of unknown '" + code + "'");
        }
        assertNull(ProductHierarchy.instrumentTypeCodeLabelOf(null));
    }

    @Test
    void codeLabelEqualsEnumLabel() throws IOException {
        for (String code : fixtureList("codes")) {
            InstrumentTypeProto v = InstrumentTypeProto.valueOf("INSTRUMENT_TYPE_" + code);
            assertEquals(ProductHierarchy.labelOf(v), ProductHierarchy.instrumentTypeCodeLabelOf(code), code);
        }
    }

    @Test
    void instrumentTypeLabelsAreWrittenOnlyInInstrumentTypes() throws IOException {
        JsonObject enumLabels = readJson(PROTOS.resolve("hierarchy.json"))
                .getAsJsonObject("enum_labels").getAsJsonObject("InstrumentTypeProto");
        assertEquals(Collections.singleton("INSTRUMENT_TYPE_UNKNOWN"), enumLabels.keySet());
        JsonObject fixture = readJson(PROTOS.resolve("fixtures/instrument_type_labels.json"));
        assertFalse(fixture.has("label") || fixture.has("labels"), "fixture must not copy labels");
    }

    @Test
    void unknownInstrumentTypeKeepsItsLabel() {
        assertEquals("Unknown", ProductHierarchy.labelOf(InstrumentTypeProto.INSTRUMENT_TYPE_UNKNOWN));
        assertNull(ProductHierarchy.labelOf((InstrumentTypeProto) null));
    }
}
