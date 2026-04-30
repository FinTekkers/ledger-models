package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.index.IndexTypeProtos.IndexTypeProto;
import fintekkers.models.util.DecimalValueProtos.DecimalValueProto;
import fintekkers.models.util.LocalDateProtos.LocalDateProto;
import fintekkers.requests.valuation.ProductInputProtos.ProductInput;
import fintekkers.requests.valuation.ProductInputProtos.FrnInput;
import fintekkers.requests.valuation.ProductInputProtos.YieldCurveInput;
import fintekkers.requests.valuation.ProductInputProtos.CurvePoint;
import fintekkers.requests.valuation.ValuationRequestProtos.ValuationRequestProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → toByteArray() → parseFrom() → verify all fields match.
 */
class FrnRequestRoundtripTest {

    private static DecimalValueProto decimal(String value) {
        return DecimalValueProto.newBuilder()
                .setArbitraryPrecisionValue(value)
                .build();
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

        assertEquals("2.0", parsed.getTenor().getArbitraryPrecisionValue());
        assertEquals("0.0470", parsed.getRate().getArbitraryPrecisionValue());
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
            assertEquals(expectedTenors[i], parsed.getPoints(i).getTenor().getArbitraryPrecisionValue(),
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

        assertEquals("99.75", parsed.getCleanPrice().getArbitraryPrecisionValue());
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
        assertEquals("99.875", parsed.getFrn().getCleanPrice().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.SOFR, parsed.getFrn().getCurve().getIndex());
    }

    @Test
    void valuationRequest_productInputFieldSurvivesRoundtrip() throws InvalidProtocolBufferException {
        FrnInput frn = FrnInput.newBuilder()
                .setCleanPrice(decimal("100.25"))
                .setCurve(sofrCurve())
                .build();
        ValuationRequestProto original = ValuationRequestProto.newBuilder()
                .setObjectClass("ValuationRequest")
                .setVersion("0.0.1")
                .setProductInput(ProductInput.newBuilder().setFrn(frn))
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertEquals("ValuationRequest", parsed.getObjectClass());
        assertTrue(parsed.hasProductInput());
        assertEquals(ProductInput.InputCase.FRN, parsed.getProductInput().getInputCase());
        assertEquals("100.25", parsed.getProductInput().getFrn().getCleanPrice().getArbitraryPrecisionValue());
    }

    @Test
    void valuationRequest_withoutProductInput_unaffected() throws InvalidProtocolBufferException {
        ValuationRequestProto original = ValuationRequestProto.newBuilder()
                .setObjectClass("ValuationRequest")
                .setVersion("0.0.1")
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertEquals("ValuationRequest", parsed.getObjectClass());
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
}
