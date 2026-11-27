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
 * LM-509 — the settlement convention and DV01_PER_MILLION contract.
 *
 * <p>A request with SettlementConventionProto (80) and DV01_PER_MILLION, and a
 * response with settlement_date (60), measure_asof_date (61) and a
 * DV01_PER_MILLION result, round-trip unchanged. Request bytes written by
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
                .addMeasures(MeasureProto.DV01_PER_MILLION)
                .addMeasures(MeasureProto.DV01)
                .setSettlementConvention(ValuationRequests.settlementConvention(date(2026, 11, 25), 1, "US_SIFMA"))
                .build();
    }

    private static List<String> fields(ModelValidationException e) {
        return e.getViolations().stream().map(FieldViolationProto::getField).collect(Collectors.toList());
    }

    @Test
    void dv01PerMillionIs31AndDv01Stays25() {
        assertEquals(31, MeasureProto.DV01_PER_MILLION.getNumber());
        assertEquals(25, MeasureProto.DV01.getNumber());
        assertEquals(MeasureProto.DV01_PER_MILLION, MeasureProto.valueOf("DV01_PER_MILLION"));
        assertEquals("DV01_PER_MILLION", Measure.DV01_PER_MILLION.name());
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
        assertEquals(List.of(MeasureProto.DV01_PER_MILLION, MeasureProto.DV01), parsed.getMeasuresList());
    }

    @Test
    void responseRoundTripsBothDatesAndADv01PerMillionResult() throws InvalidProtocolBufferException {
        ValuationResponseProto response = ValuationResponseProto.newBuilder()
                .setValuationRequest(fullRequest())
                .setSettlementDate(date(2026, 11, 27))
                .setMeasureAsofDate(date(2026, 11, 27))
                .addMeasureResults(MeasureMapEntry.newBuilder()
                        .setMeasure(MeasureProto.DV01_PER_MILLION)
                        .setMeasureDecimalValue(Decimals.decimal("502.50")))
                .build();
        ValuationResponseProto parsed = ValuationResponseProto.parseFrom(response.toByteArray());
        assertEquals(response, parsed);
        assertEquals(date(2026, 11, 27), parsed.getSettlementDate());
        assertEquals(date(2026, 11, 27), parsed.getMeasureAsofDate());
        assertEquals(MeasureProto.DV01_PER_MILLION, parsed.getMeasureResults(0).getMeasure());
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
