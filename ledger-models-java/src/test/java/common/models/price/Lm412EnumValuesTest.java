package common.models.price;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.protobuf.Descriptors.EnumDescriptor;
import com.google.protobuf.Descriptors.EnumValueDescriptor;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.ProductTypeProto;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * LM-412 is additive: PriceTypeProto gains RATE = 5 and ProductTypeProto gains
 * T_BILL_13_WEEK_SERIES = 36. Every existing value keeps its number and name.
 * The values come from test-fixtures/field-changes/lm-412.json, which wire-diff
 * rule lm412 and the Python, Rust and JS tests also read.
 */
class Lm412EnumValuesTest {

    private static final Path FIELD_CHANGES = Path.of("..", "test-fixtures", "field-changes", "lm-412.json");

    private static final Map<String, EnumDescriptor> ENUMS = Map.of(
            ".fintekkers.models.price.PriceTypeProto", PriceTypeProto.getDescriptor(),
            ".fintekkers.models.security.ProductTypeProto", ProductTypeProto.getDescriptor());

    private static JsonArray section(String name) throws IOException {
        return JsonParser.parseString(Files.readString(FIELD_CHANGES)).getAsJsonObject().getAsJsonArray(name);
    }

    private static void assertValue(JsonObject entry) {
        EnumDescriptor e = ENUMS.get(entry.get("enum").getAsString());
        assertNotNull(e, entry.toString());
        EnumValueDescriptor v = e.findValueByNumber(entry.get("number").getAsInt());
        assertNotNull(v, entry.toString());
        assertEquals(entry.get("name").getAsString(), v.getName(), entry.toString());
    }

    @Test
    void addedValuesAreRateAndTBill13WeekSeries() throws IOException {
        List<String> added = new ArrayList<>();
        for (JsonElement el : section("added_values")) {
            JsonObject o = el.getAsJsonObject();
            added.add(o.get("enum").getAsString() + " " + o.get("number").getAsInt() + " " + o.get("name").getAsString());
        }
        assertEquals(List.of(
                ".fintekkers.models.price.PriceTypeProto 5 RATE",
                ".fintekkers.models.security.ProductTypeProto 36 T_BILL_13_WEEK_SERIES"), added);
        assertEquals(5, PriceTypeProto.RATE.getNumber());
        assertEquals(36, ProductTypeProto.T_BILL_13_WEEK_SERIES.getNumber());
    }

    @Test
    void addedValuesHaveTheirNumberAndName() throws IOException {
        for (JsonElement el : section("added_values")) {
            assertValue(el.getAsJsonObject());
        }
    }

    @Test
    void keptValuesKeepNumberAndName() throws IOException {
        for (JsonElement el : section("kept")) {
            assertValue(el.getAsJsonObject());
        }
    }

    @Test
    void keptPlusAddedIsTheWholeEnum() throws IOException {
        List<JsonObject> listed = new ArrayList<>();
        for (String name : List.of("kept", "added_values")) {
            for (JsonElement el : section(name)) {
                listed.add(el.getAsJsonObject());
            }
        }
        for (Map.Entry<String, EnumDescriptor> e : ENUMS.entrySet()) {
            Set<String> expected = listed.stream()
                    .filter(o -> o.get("enum").getAsString().equals(e.getKey()))
                    .map(o -> o.get("number").getAsInt() + " " + o.get("name").getAsString())
                    .collect(Collectors.toCollection(TreeSet::new));
            Set<String> actual = e.getValue().getValues().stream()
                    .map(v -> v.getNumber() + " " + v.getName())
                    .collect(Collectors.toCollection(TreeSet::new));
            assertEquals(e.getValue().getValues().size(), expected.size(), e.getKey());
            assertEquals(expected, actual, e.getKey());
        }
    }
}
