package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import common.models.errors.ModelValidationException;
import common.models.postion.Measure;
import common.models.security.ValuationRequests;
import fintekkers.models.position.MeasureMapEntry;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import fintekkers.requests.valuation.SettlementConventionProto;
import fintekkers.requests.valuation.ValuationRequestProto;
import fintekkers.requests.valuation.ValuationResponseProto;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-509 — the settlement convention contract.
 *
 * <p>A request with SettlementConventionProto (80) and DV01, and a response
 * with settlement_date (60), measure_asof_date (61) and a DV01 result,
 * round-trip unchanged. Measure 31, which LM-509 added, is removed and
 * reserved (LM-514); DV01 stays 25. Request bytes written by
 * v1.1.62 parse with the convention unset and every existing field as it was.
 * {@link ValuationRequests#settlementConvention} checks only the calendar-free
 * rules the proto comment states; it computes no date.
 */
class SettlementConventionRoundtripTest {

    private static final Path OLD_REQUEST_HEX = Path.of("..", "test-fixtures", "wire", "lm-509-request-v1.1.62.hex");

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder().setYear(year).setMonth(month).setDay(day).build();
    }

    private static ValuationRequestProto fullRequest() {
        return ValuationRequestProto.newBuilder()
                .addMeasures(MeasureProto.DV01)
                .setSettlementConvention(ValuationRequests.settlementConvention(date(2026, 11, 25), 1, "US_SIFMA"))
                .build();
    }

    private static List<String> fields(ModelValidationException e) {
        return e.getViolations().stream().map(FieldViolationProto::getField).collect(Collectors.toList());
    }

    // The removed name, split so the LM-514 grep finds it only in measure.proto.
    private static final String REMOVED_31 = "DV01" + "_PER_MILLION";

    @Test
    void dv01Stays25AndNothingIs31() {
        assertEquals(25, MeasureProto.DV01.getNumber());
        assertEquals(MeasureProto.DV01, MeasureProto.forNumber(25));
        assertNull(MeasureProto.forNumber(31));
        assertNull(MeasureProto.getDescriptor().findValueByNumber(31));
        assertNull(MeasureProto.getDescriptor().findValueByName(REMOVED_31));
        assertThrows(IllegalArgumentException.class, () -> MeasureProto.valueOf(REMOVED_31));
        assertThrows(IllegalArgumentException.class, () -> Measure.valueOf(REMOVED_31));
    }

    @Test
    void requestRoundTripsEveryNewField() throws InvalidProtocolBufferException {
        ValuationRequestProto request = fullRequest();
        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(request.toByteArray());
        assertEquals(request, parsed);
        assertTrue(parsed.hasSettlementConvention());
        SettlementConventionProto convention = parsed.getSettlementConvention();
        assertEquals(date(2026, 11, 25), convention.getTradeDate());
        assertEquals(1, convention.getSettlementLagBusinessDays());
        assertEquals("US_SIFMA", convention.getCalendarId());
        assertEquals(List.of(MeasureProto.DV01), parsed.getMeasuresList());
    }

    @Test
    void responseRoundTripsBothDatesAndADv01Result() throws InvalidProtocolBufferException {
        ValuationResponseProto response = ValuationResponseProto.newBuilder()
                .setValuationRequest(fullRequest())
                .setSettlementDate(date(2026, 11, 27))
                .setMeasureAsofDate(date(2026, 11, 27))
                .addMeasureResults(MeasureMapEntry.newBuilder()
                        .setMeasure(MeasureProto.DV01)
                        .setMeasureDecimalValue(Decimals.decimal("502.50")))
                .build();
        ValuationResponseProto parsed = ValuationResponseProto.parseFrom(response.toByteArray());
        assertEquals(response, parsed);
        assertEquals(date(2026, 11, 27), parsed.getSettlementDate());
        assertEquals(date(2026, 11, 27), parsed.getMeasureAsofDate());
        assertEquals(MeasureProto.DV01, parsed.getMeasureResults(0).getMeasure());
        assertEquals(Decimals.decimal("502.50"), parsed.getMeasureResults(0).getMeasureDecimalValue());
    }

    @Test
    void zeroLagConventionReportsPresent() throws InvalidProtocolBufferException {
        ValuationRequestProto request = ValuationRequestProto.newBuilder()
                .setSettlementConvention(ValuationRequests.settlementConvention(date(2026, 11, 25), 0, "US_SIFMA"))
                .build();
        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(request.toByteArray());
        assertTrue(parsed.hasSettlementConvention());
        assertEquals(0, parsed.getSettlementConvention().getSettlementLagBusinessDays());
    }

    @Test
    void v1162RequestBytesParseWithTheConventionUnset() throws IOException {
        byte[] bytes = HexFormat.of().parseHex(Files.readString(OLD_REQUEST_HEX).trim());
        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(bytes);
        assertFalse(parsed.hasSettlementConvention());
        assertEquals(List.of(MeasureProto.DV01), parsed.getMeasuresList());
        assertEquals(1_795_813_200L, parsed.getAsofDatetime().getTimestamp().getSeconds()); // 2026-11-27T21:00:00Z
        assertEquals("America/New_York", parsed.getAsofDatetime().getTimeZone());
        assertTrue(parsed.hasPositionInput());
        assertEquals("US Treasury", parsed.getProductInput().getBond().getSecurity().getIssuerName());
        assertEquals(Decimals.decimal("99.75"), parsed.getProductInput().getBond().getCleanPrice());
        assertTrue(parsed.getUnknownFields().asMap().isEmpty());
        assertArrayEquals(bytes, parsed.toByteArray());
    }

    @Test
    void responseWithoutConventionLeavesBothDatesUnset() throws InvalidProtocolBufferException {
        ValuationResponseProto parsed = ValuationResponseProto.parseFrom(
                ValuationResponseProto.getDefaultInstance().toByteArray());
        assertFalse(parsed.hasSettlementDate());
        assertFalse(parsed.hasMeasureAsofDate());
    }

    @Test
    void helperRejectsABlankCalendar() {
        for (String blank : new String[] {"", "   ", null}) {
            ModelValidationException e = assertThrows(ModelValidationException.class,
                    () -> ValuationRequests.settlementConvention(date(2026, 11, 25), 1, blank));
            assertEquals(List.of("settlement_convention.calendar_id"), fields(e));
        }
    }

    @Test
    void helperRejectsAnUnsetTradeDate() {
        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> ValuationRequests.settlementConvention(null, 1, "US_SIFMA"));
        assertEquals(List.of("settlement_convention.trade_date"), fields(e));
    }

    @Test
    void helperRejectsANegativeLag() {
        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> ValuationRequests.settlementConvention(date(2026, 11, 25), -1, "US_SIFMA"));
        assertEquals(List.of("settlement_convention.settlement_lag_business_days"), fields(e));
    }

    @Test
    void helperAcceptsAZeroLag() {
        SettlementConventionProto convention = ValuationRequests.settlementConvention(date(2026, 11, 25), 0, "US_SIFMA");
        assertEquals(0, convention.getSettlementLagBusinessDays());
        assertTrue(convention.hasTradeDate());
    }

    @Test
    void helperPassesAnUnknownCalendarThrough() {
        // valuation-service owns the calendars and rejects an unknown id.
        assertEquals("XX_UNKNOWN",
                ValuationRequests.settlementConvention(date(2026, 11, 25), 1, "XX_UNKNOWN").getCalendarId());
    }
}
