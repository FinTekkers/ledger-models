package protos.serializers;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.protobuf.DescriptorProtos.DescriptorProto;
import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Timestamp;
import fintekkers.models.security.IndexDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.TipsExtensionProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.requests.valuation.InflationIndexInput;
import fintekkers.requests.valuation.MonthlyIndexReading;
import fintekkers.requests.valuation.MonthlyIndexReadings;
import fintekkers.requests.valuation.ProductInput;
import fintekkers.requests.valuation.TipsInput;
import fintekkers.requests.valuation.ValuationRequestProto;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TipsInput.cpi (LM-343) through a full ValuationRequestProto:
 * construct → toByteArray() → parseFrom() → verify the oneof case and values.
 * Readings with extra lot months (LM-405), and with only m-3 and m-2, round-trip
 * unchanged.
 */
class TipsRequestRoundtripTest {

    private static DecimalValueProto decimal(String value) {
        return Decimals.decimal(value);
    }

    private static SecurityProto cpiIndex() {
        return SecurityProto.newBuilder()
                .setIssuerName("CPI-U NSA")
                .setIndexDetails(IndexDetailsProto.newBuilder().setIndexType(IndexTypeProto.CPI_U))
                .build();
    }

    private static SecurityProto tipsSecurity() {
        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TIPS)
                .setTipsExtension(TipsExtensionProto.newBuilder()
                        .setBaseCpi(decimal("260.47400"))
                        .setInflationIndexType(IndexTypeProto.CPI_U))
                .build();
    }

    private static MonthlyIndexReading reading(int year, int month, String value) {
        return MonthlyIndexReading.newBuilder().setYear(year).setMonth(month).setValue(decimal(value)).build();
    }

    private static ValuationRequestProto request(TipsInput tips) {
        return ValuationRequestProto.newBuilder()
                .setProductInput(ProductInput.newBuilder().setTips(tips))
                .build();
    }

    private static ValuationRequestProto request(TipsInput tips, long asofSeconds) {
        return request(tips).toBuilder()
                .setAsofDatetime(LocalTimestampProto.newBuilder()
                        .setTimestamp(Timestamp.newBuilder().setSeconds(asofSeconds)))
                .build();
    }

    private static TipsInput roundtripTips(ValuationRequestProto original) throws InvalidProtocolBufferException {
        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());
        assertEquals(ProductInput.InputCase.TIPS, parsed.getProductInput().getInputCase());
        return parsed.getProductInput().getTips();
    }

    @Test
    void cpiReadingsWithExtraLotMonths_surviveValuationRequestRoundtrip() throws InvalidProtocolBufferException {
        // LM-405. 2026-02-17T14:30:00Z: m-3 and m-2 are 2025-11 and 2025-12. A lot
        // settling in 2025-11 adds 2025-08 and 2025-09. Listed out of order.
        List<MonthlyIndexReading> readings = List.of(
                reading(2025, 12, "324.05400"),
                reading(2025, 8, "323.97600"),
                reading(2025, 11, "324.12200"),
                reading(2025, 9, "324.80000"));
        TipsInput tips = TipsInput.newBuilder()
                .setSecurity(tipsSecurity())
                .setCleanPrice(decimal("97.50"))
                .setCpi(InflationIndexInput.newBuilder()
                        .setIndex(cpiIndex())
                        .setReadings(MonthlyIndexReadings.newBuilder().addAllReadings(readings)))
                .build();
        ValuationRequestProto original = request(tips, 1771338600L);

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertEquals(original, parsed);
        assertEquals(1771338600L, parsed.getAsofDatetime().getTimestamp().getSeconds());
        InflationIndexInput parsedCpi = parsed.getProductInput().getTips().getCpi();
        assertEquals(InflationIndexInput.CpiCase.READINGS, parsedCpi.getCpiCase());
        assertEquals(List.of("2025-12 324.05400", "2025-8 323.97600", "2025-11 324.12200", "2025-9 324.80000"),
                parsedCpi.getReadings().getReadingsList().stream()
                        .map(r -> r.getYear() + "-" + r.getMonth() + " " + Decimals.text(r.getValue()))
                        .toList());
    }

    @Test
    void backwardCompat_m3m2CpiReadings_surviveValuationRequestRoundtrip() throws InvalidProtocolBufferException {
        InflationIndexInput cpi = InflationIndexInput.newBuilder()
                .setIndex(cpiIndex())
                .setReadings(MonthlyIndexReadings.newBuilder()
                        .addReadings(reading(2026, 4, "320.000"))
                        .addReadings(reading(2026, 5, "321.500")))
                .build();
        TipsInput tips = TipsInput.newBuilder()
                .setSecurity(tipsSecurity())
                .setCleanPrice(decimal("97.50"))
                .setCpi(cpi)
                .build();
        // 2026-07-16T00:00:00Z: m-3 and m-2 are 2026-04 and 2026-05.
        ValuationRequestProto original = request(tips, 1784160000L);
        assertEquals(original, ValuationRequestProto.parseFrom(original.toByteArray()));

        TipsInput parsed = roundtripTips(original);

        assertTrue(parsed.hasCpi());
        InflationIndexInput parsedCpi = parsed.getCpi();
        assertEquals(InflationIndexInput.CpiCase.READINGS, parsedCpi.getCpiCase());
        assertEquals("CPI-U NSA", parsedCpi.getIndex().getIssuerName());
        assertEquals(IndexTypeProto.CPI_U, parsedCpi.getIndex().getIndexDetails().getIndexType());
        assertEquals(2, parsedCpi.getReadings().getReadingsCount());
        MonthlyIndexReading first = parsedCpi.getReadings().getReadings(0);
        assertEquals(2026, first.getYear());
        assertEquals(4, first.getMonth());
        assertEquals("320.000", Decimals.text(first.getValue()));
        MonthlyIndexReading second = parsedCpi.getReadings().getReadings(1);
        assertEquals(2026, second.getYear());
        assertEquals(5, second.getMonth());
        assertEquals("321.500", Decimals.text(second.getValue()));
        assertEquals("97.50", Decimals.text(parsed.getCleanPrice()));
    }

    @Test
    void cpiReferenceCpi_survivesValuationRequestRoundtrip() throws InvalidProtocolBufferException {
        InflationIndexInput cpi = InflationIndexInput.newBuilder()
                .setIndex(cpiIndex())
                .setReferenceCpi(decimal("310.32600"))
                .build();
        TipsInput tips = TipsInput.newBuilder()
                .setSecurity(tipsSecurity())
                .setCleanPrice(decimal("97.50"))
                .setCpi(cpi)
                .build();

        TipsInput parsed = roundtripTips(request(tips));

        InflationIndexInput parsedCpi = parsed.getCpi();
        assertEquals(InflationIndexInput.CpiCase.REFERENCE_CPI, parsedCpi.getCpiCase());
        assertFalse(parsedCpi.hasReadings());
        assertEquals("CPI-U NSA", parsedCpi.getIndex().getIssuerName());
        assertEquals("310.32600", Decimals.text(parsedCpi.getReferenceCpi()));
    }

    private static final Path REMOVED_FIELDS = Path.of("..", "test-fixtures", "removed-fields", "lm-344.json");

    private static JsonObject removedFields() throws IOException {
        return JsonParser.parseString(Files.readString(REMOVED_FIELDS)).getAsJsonObject();
    }

    private static Descriptor message(JsonObject entry) {
        String name = entry.get("message").getAsString().substring(1);
        for (Descriptor d : List.of(ValuationRequestProto.getDescriptor(), TipsInput.getDescriptor())) {
            if (d.getFullName().equals(name)) {
                return d;
            }
        }
        throw new AssertionError("no descriptor for " + name);
    }

    /** LM-344: fields 24 and 25 and TipsInput 3 are removed, their numbers and names reserved. */
    @Test
    void removedFields_areGoneAndReserved() throws IOException {
        JsonArray fields = removedFields().getAsJsonArray("fields");
        assertEquals(3, fields.size());
        for (JsonElement el : fields) {
            JsonObject f = el.getAsJsonObject();
            Descriptor d = message(f);
            int number = f.get("number").getAsInt();
            String name = f.get("name").getAsString();
            assertNull(d.findFieldByNumber(number), d.getFullName() + " still has field " + number);
            assertNull(d.findFieldByName(name), d.getFullName() + " still has " + name);
            DescriptorProto proto = d.toProto();
            // Ranges are half-open: reserved 24, 25 may be one range [24, 26).
            assertTrue(proto.getReservedRangeList().stream()
                            .anyMatch(r -> r.getStart() <= number && number < r.getEnd()),
                    d.getFullName() + " does not reserve " + number);
            assertTrue(proto.getReservedNameList().contains(name), d.getFullName() + " does not reserve " + name);
        }
        JsonObject kept = removedFields().getAsJsonObject("kept");
        FieldDescriptor cpi = message(kept).findFieldByNumber(kept.get("number").getAsInt());
        assertNotNull(cpi);
        assertEquals(kept.get("name").getAsString(), cpi.getName());
    }
}
