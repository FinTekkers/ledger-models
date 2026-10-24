package protos.serializers;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.FrnExtensionProto;
import fintekkers.models.security.bond.IssuanceProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.requests.valuation.ProductInput;
import fintekkers.requests.valuation.FrnInput;
import fintekkers.requests.valuation.YieldCurveInput;
import fintekkers.requests.valuation.CurvePoint;
import fintekkers.requests.valuation.ReferenceRateFixingProto;
import fintekkers.requests.valuation.ValuationRequestProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import testutil.Decimals;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → toByteArray() → parseFrom() → verify all fields match.
 */
class FrnRequestRoundtripTest {

    private static DecimalValueProto decimal(String value) {
        return Decimals.decimal(value);
    }

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder()
                .setYear(year).setMonth(month).setDay(day)
                .build();
    }

    private static YieldCurveInput sofrCurve() {
        return YieldCurveInput.newBuilder()
                .setIndex(IndexTypeProto.SOFR)
                .setReferenceDate(date(2025, 1, 31))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("0.25")).setRate(decimal("0.0530")))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("0.5")).setRate(decimal("0.0520")))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("1.0")).setRate(decimal("0.0500")))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("2.0")).setRate(decimal("0.0470")))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("5.0")).setRate(decimal("0.0430")))
                .build();
    }

    @Test
    void curvePoint_allFieldsSurviveRoundtrip() throws InvalidProtocolBufferException {
        CurvePoint original = CurvePoint.newBuilder()
                .setTenor(decimal("2.0"))
                .setRate(decimal("0.0470"))
                .build();

        CurvePoint parsed = CurvePoint.parseFrom(original.toByteArray());

        assertEquals("2.0", Decimals.text(parsed.getTenor()));
        assertEquals("0.0470", Decimals.text(parsed.getRate()));
    }

    @Test
    void yieldCurveInput_indexAndDateSurviveRoundtrip() throws InvalidProtocolBufferException {
        YieldCurveInput parsed = YieldCurveInput.parseFrom(sofrCurve().toByteArray());

        assertEquals(IndexTypeProto.SOFR, parsed.getIndex());
        assertEquals(2025, parsed.getReferenceDate().getYear());
        assertEquals(1, parsed.getReferenceDate().getMonth());
        assertEquals(31, parsed.getReferenceDate().getDay());
    }

    @Test
    void yieldCurveInput_allFivePointsSurviveRoundtrip() throws InvalidProtocolBufferException {
        YieldCurveInput parsed = YieldCurveInput.parseFrom(sofrCurve().toByteArray());

        assertEquals(5, parsed.getPointsCount());
    }

    @Test
    void yieldCurveInput_pointOrderPreserved() throws InvalidProtocolBufferException {
        String[] expectedTenors = {"0.25", "0.5", "1.0", "2.0", "5.0"};
        YieldCurveInput parsed = YieldCurveInput.parseFrom(sofrCurve().toByteArray());

        for (int i = 0; i < expectedTenors.length; i++) {
            assertEquals(expectedTenors[i], Decimals.text(parsed.getPoints(i).getTenor()),
                    "tenor mismatch at index " + i);
        }
    }

    @Test
    void frnInput_allFieldsSurviveRoundtrip() throws InvalidProtocolBufferException {
        FrnInput original = FrnInput.newBuilder()
                .setCleanPrice(decimal("99.75"))
                .setCurve(sofrCurve())
                .build();

        FrnInput parsed = FrnInput.parseFrom(original.toByteArray());

        assertEquals("99.75", Decimals.text(parsed.getCleanPrice()));
        assertEquals(IndexTypeProto.SOFR, parsed.getCurve().getIndex());
        assertEquals(5, parsed.getCurve().getPointsCount());
    }

    @Test
    void productInput_frnVariantSurvivesRoundtrip() throws InvalidProtocolBufferException {
        FrnInput frn = FrnInput.newBuilder()
                .setCleanPrice(decimal("99.875"))
                .setCurve(sofrCurve())
                .build();
        ProductInput original = ProductInput.newBuilder().setFrn(frn).build();

        ProductInput parsed = ProductInput.parseFrom(original.toByteArray());

        assertEquals(ProductInput.InputCase.FRN, parsed.getInputCase());
        assertEquals("99.875", Decimals.text(parsed.getFrn().getCleanPrice()));
        assertEquals(IndexTypeProto.SOFR, parsed.getFrn().getCurve().getIndex());
    }

    @Test
    void valuationRequest_productInputFieldSurvivesRoundtrip() throws InvalidProtocolBufferException {
        FrnInput frn = FrnInput.newBuilder()
                .setCleanPrice(decimal("100.25"))
                .setCurve(sofrCurve())
                .build();
        ValuationRequestProto original = ValuationRequestProto.newBuilder()
                .setProductInput(ProductInput.newBuilder().setFrn(frn))
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertTrue(parsed.hasProductInput());
        assertEquals(ProductInput.InputCase.FRN, parsed.getProductInput().getInputCase());
        assertEquals("100.25", Decimals.text(parsed.getProductInput().getFrn().getCleanPrice()));
    }

    @Test
    void valuationRequest_withoutProductInput_unaffected() throws InvalidProtocolBufferException {
        ValuationRequestProto original = ValuationRequestProto.newBuilder()
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertFalse(parsed.hasProductInput());
    }

    @ParameterizedTest
    @EnumSource(value = IndexTypeProto.class, names = {"SONIA", "ESTR", "TONA"})
    void newRfrIndexTypes_surviveRoundtrip(IndexTypeProto index) throws InvalidProtocolBufferException {
        YieldCurveInput original = YieldCurveInput.newBuilder()
                .setIndex(index)
                .setReferenceDate(date(2025, 1, 31))
                .addPoints(CurvePoint.newBuilder().setTenor(decimal("1.0")).setRate(decimal("0.04")))
                .build();

        YieldCurveInput parsed = YieldCurveInput.parseFrom(original.toByteArray());

        assertEquals(index, parsed.getIndex(), index.name() + " did not survive roundtrip");
    }

    // LM-365: published reference-rate fixings on FrnInput. T_BILL_13_WEEK is a
    // non-default enum value, so it is on the wire.
    private static ReferenceRateFixingProto fixing(IndexTypeProto index, LocalDateProto date, String rate) {
        return ReferenceRateFixingProto.newBuilder()
                .setIndex(index)
                .setFixingDate(date)
                .setRate(decimal(rate))
                .build();
    }

    @Test
    void referenceRateFixing_allFieldsSurviveRoundtrip() throws InvalidProtocolBufferException {
        ReferenceRateFixingProto original = fixing(IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), "0.0432");

        ReferenceRateFixingProto parsed = ReferenceRateFixingProto.parseFrom(original.toByteArray());

        assertEquals(IndexTypeProto.T_BILL_13_WEEK, parsed.getIndex());
        assertEquals(2026, parsed.getFixingDate().getYear());
        assertEquals(10, parsed.getFixingDate().getMonth());
        assertEquals(19, parsed.getFixingDate().getDay());
        assertEquals("0.0432", Decimals.text(parsed.getRate()));
    }

    @Test
    void frnInput_twoFixingsSurviveRoundtripInOrder() throws InvalidProtocolBufferException {
        FrnInput original = FrnInput.newBuilder()
                .setCleanPrice(decimal("99.75"))
                .addFixings(fixing(IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), "0.0432"))
                .addFixings(fixing(IndexTypeProto.SOFR, date(2026, 10, 26), "0.0429"))
                .build();

        FrnInput parsed = FrnInput.parseFrom(original.toByteArray());

        assertEquals(2, parsed.getFixingsCount());
        ReferenceRateFixingProto first = parsed.getFixings(0);
        assertEquals(IndexTypeProto.T_BILL_13_WEEK, first.getIndex());
        assertEquals(2026, first.getFixingDate().getYear());
        assertEquals(10, first.getFixingDate().getMonth());
        assertEquals(19, first.getFixingDate().getDay());
        assertEquals("0.0432", Decimals.text(first.getRate()));
        ReferenceRateFixingProto second = parsed.getFixings(1);
        assertEquals(IndexTypeProto.SOFR, second.getIndex());
        assertEquals(2026, second.getFixingDate().getYear());
        assertEquals(10, second.getFixingDate().getMonth());
        assertEquals(26, second.getFixingDate().getDay());
        assertEquals("0.0429", Decimals.text(second.getRate()));
        assertEquals("99.75", Decimals.text(parsed.getCleanPrice()));
    }

    // LM-382: the T_BILL_13_WEEK fixing carries its bill's maturity, and the
    // issuance its auction date. Each date differs, so a swapped field fails.
    @Test
    void lm382_billMaturityDateSurvivesRoundtrip() throws InvalidProtocolBufferException {
        ReferenceRateFixingProto original = fixing(IndexTypeProto.T_BILL_13_WEEK, date(2026, 7, 20), "4.215")
                .toBuilder().setBillMaturityDate(date(2026, 10, 22)).build();

        ReferenceRateFixingProto parsed = ReferenceRateFixingProto.parseFrom(original.toByteArray());

        assertEquals(IndexTypeProto.T_BILL_13_WEEK, parsed.getIndex());
        assertEquals(date(2026, 7, 20), parsed.getFixingDate());
        assertTrue(parsed.hasBillMaturityDate());
        assertEquals(date(2026, 10, 22), parsed.getBillMaturityDate());
        assertEquals("4.215", Decimals.text(parsed.getRate()));
    }

    @Test
    void lm382_auctionDateSurvivesRoundtrip() throws InvalidProtocolBufferException {
        IssuanceProto original = IssuanceProto.newBuilder()
                .setAuctionAnnouncementDate(date(2026, 7, 16))
                .setAuctionDate(date(2026, 7, 20))
                .setAuctionIssueDate(date(2026, 7, 23))
                .setHighDiscountRate(decimal("4.215"))
                .build();

        IssuanceProto parsed = IssuanceProto.parseFrom(original.toByteArray());

        assertTrue(parsed.hasAuctionDate());
        assertEquals(date(2026, 7, 20), parsed.getAuctionDate());
        assertEquals(date(2026, 7, 23), parsed.getAuctionIssueDate());
        assertEquals(date(2026, 7, 16), parsed.getAuctionAnnouncementDate());
        assertEquals("4.215", Decimals.text(parsed.getHighDiscountRate()));
    }

    // LM-389: the T_BILL_13_WEEK fixing carries its auction's issue date.
    // Fixing, issue and maturity dates all differ, so a swapped field fails.
    @Test
    void lm389_billIssueDateSurvivesRoundtrip() throws InvalidProtocolBufferException {
        ReferenceRateFixingProto original = fixing(IndexTypeProto.T_BILL_13_WEEK, date(2026, 7, 20), "4.215")
                .toBuilder().setBillMaturityDate(date(2026, 10, 22)).setBillIssueDate(date(2026, 7, 23)).build();

        ReferenceRateFixingProto parsed = ReferenceRateFixingProto.parseFrom(original.toByteArray());

        assertTrue(parsed.hasBillIssueDate());
        assertEquals(date(2026, 7, 23), parsed.getBillIssueDate());
        assertEquals(date(2026, 7, 20), parsed.getFixingDate());
        assertEquals(date(2026, 10, 22), parsed.getBillMaturityDate());
    }

    /** LM-382: a message without the new fields decodes with them unset, not as a default date. */
    @Test
    void lm382_newFieldsDecodeUnsetWhenAbsent() throws InvalidProtocolBufferException {
        ReferenceRateFixingProto fixing = ReferenceRateFixingProto.parseFrom(
                fixing(IndexTypeProto.SOFR, date(2026, 10, 26), "0.0429").toByteArray());
        IssuanceProto issuance = IssuanceProto.parseFrom(
                IssuanceProto.newBuilder().setAuctionIssueDate(date(2026, 7, 23)).build().toByteArray());

        assertFalse(fixing.hasBillMaturityDate());
        assertFalse(fixing.hasBillIssueDate());
        assertFalse(issuance.hasAuctionDate());
        assertEquals(date(2026, 7, 23), issuance.getAuctionIssueDate());
    }

    private static final Path FIELD_CHANGES = Path.of("..", "test-fixtures", "field-changes", "lm-365.json");
    private static final Path LM382_FIELD_CHANGES = Path.of("..", "test-fixtures", "field-changes", "lm-382.json");

    private static JsonArray fieldChanges(String section) throws IOException {
        return JsonParser.parseString(Files.readString(FIELD_CHANGES)).getAsJsonObject().getAsJsonArray(section);
    }

    private static JsonArray lm382Added() throws IOException {
        return JsonParser.parseString(Files.readString(LM382_FIELD_CHANGES)).getAsJsonObject().getAsJsonArray("added");
    }

    private static final Path LM389_FIELD_CHANGES = Path.of("..", "test-fixtures", "field-changes", "lm-389.json");

    private static JsonArray lm389Added() throws IOException {
        return JsonParser.parseString(Files.readString(LM389_FIELD_CHANGES)).getAsJsonObject().getAsJsonArray("added");
    }

    private static final List<Descriptor> LM365_MESSAGES = List.of(
            FrnInput.getDescriptor(), ReferenceRateFixingProto.getDescriptor(), IssuanceProto.getDescriptor());

    private static Descriptor lm365Message(JsonObject entry) {
        String name = entry.get("message").getAsString().substring(1);
        return LM365_MESSAGES.stream().filter(d -> d.getFullName().equals(name)).findFirst()
                .orElseThrow(() -> new AssertionError("no descriptor for " + name));
    }

    private static String typeName(FieldDescriptor f) {
        switch (f.getJavaType()) {
            case MESSAGE: return "." + f.getMessageType().getFullName();
            case ENUM: return "." + f.getEnumType().getFullName();
            default: return f.getType().name();
        }
    }

    private static void assertField(JsonObject entry) {
        Descriptor d = lm365Message(entry);
        int number = entry.get("number").getAsInt();
        FieldDescriptor f = d.findFieldByNumber(number);
        assertNotNull(f, d.getFullName() + " has no field " + number);
        assertEquals(entry.get("name").getAsString(), f.getName(), entry.toString());
        assertEquals(entry.get("type").getAsString(), typeName(f), entry.toString());
        boolean repeated = entry.has("repeated") && entry.get("repeated").getAsBoolean();
        assertEquals(repeated, f.isRepeated(), entry.toString());
    }

    /** LM-365: every FrnInput and IssuanceProto field keeps its number, name and type. */
    @Test
    void lm365_keptFieldsKeepNumberNameAndType() throws IOException {
        for (JsonElement el : fieldChanges("kept")) {
            assertField(el.getAsJsonObject());
        }
    }

    /** LM-365: the added fields, including high_discount_rate = 28 as DecimalValueProto. */
    @Test
    void lm365_addedFieldsHaveNumberNameAndType() throws IOException {
        for (JsonElement el : fieldChanges("added")) {
            assertField(el.getAsJsonObject());
        }
    }

    /** LM-382: auction_date = 29 and bill_maturity_date = 4, both LocalDateProto. */
    @Test
    void lm382_addedFieldsHaveNumberNameAndType() throws IOException {
        for (JsonElement el : lm382Added()) {
            assertField(el.getAsJsonObject());
        }
    }

    /** LM-389: bill_issue_date = 5, LocalDateProto. */
    @Test
    void lm389_addedFieldsHaveNumberNameAndType() throws IOException {
        for (JsonElement el : lm389Added()) {
            assertField(el.getAsJsonObject());
        }
    }

    /** LM-365: each message's field numbers are exactly kept plus added, plus LM-382's and LM-389's additions. */
    @Test
    void lm365_fieldSetsAreExactlyKeptAndAdded() throws IOException {
        Map<String, Set<Integer>> expected = new TreeMap<>();
        List<JsonArray> sections = List.of(fieldChanges("kept"), fieldChanges("added"), lm382Added(), lm389Added());
        for (JsonArray section : sections) {
            for (JsonElement el : section) {
                JsonObject entry = el.getAsJsonObject();
                expected.computeIfAbsent(lm365Message(entry).getFullName(), k -> new TreeSet<>())
                        .add(entry.get("number").getAsInt());
            }
        }
        assertEquals(3, expected.size());
        for (Descriptor d : LM365_MESSAGES) {
            Set<Integer> actual = d.getFields().stream().map(FieldDescriptor::getNumber)
                    .collect(Collectors.toCollection(TreeSet::new));
            assertEquals(expected.get(d.getFullName()), actual, d.getFullName());
        }
    }

    @Test
    void lm365_fixingsIsRepeatedMessageNotMap() {
        FieldDescriptor fixings = FrnInput.getDescriptor().findFieldByName("fixings");
        assertTrue(fixings.isRepeated());
        assertFalse(fixings.isMapField());
        assertEquals(ReferenceRateFixingProto.getDescriptor(), fixings.getMessageType());
    }

    @Test
    void lm365_fixingIndexIsTheReferenceRateIndexEnum() {
        FieldDescriptor index = ReferenceRateFixingProto.getDescriptor().findFieldByName("index");
        FieldDescriptor referenceRateIndex = FrnExtensionProto.getDescriptor().findFieldByName("reference_rate_index");
        assertEquals(referenceRateIndex.getEnumType().getFullName(), index.getEnumType().getFullName());
        assertEquals("fintekkers.models.security.index.IndexTypeProto", index.getEnumType().getFullName());
    }
}
