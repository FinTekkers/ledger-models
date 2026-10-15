package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.IndexDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.TipsExtensionProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.requests.valuation.InflationIndexInput;
import fintekkers.requests.valuation.MonthlyIndexReading;
import fintekkers.requests.valuation.MonthlyIndexReadings;
import fintekkers.requests.valuation.ProductInput;
import fintekkers.requests.valuation.TipsInput;
import fintekkers.requests.valuation.ValuationRequestProto;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TipsInput.cpi (LM-343) through a full ValuationRequestProto:
 * construct → toByteArray() → parseFrom() → verify the oneof case and values.
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

    private static TipsInput roundtripTips(ValuationRequestProto original) throws InvalidProtocolBufferException {
        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());
        assertEquals(ProductInput.InputCase.TIPS, parsed.getProductInput().getInputCase());
        return parsed.getProductInput().getTips();
    }

    @Test
    void cpiReadings_surviveValuationRequestRoundtrip() throws InvalidProtocolBufferException {
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

        TipsInput parsed = roundtripTips(request(tips));

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

    @Test
    @SuppressWarnings("deprecation")
    void deprecatedCpiAndReferenceRateFields_stillRoundtripUnchanged() throws InvalidProtocolBufferException {
        PriceProto cpiPrice = PriceProto.newBuilder().setPrice(decimal("310.326")).setSecurity(cpiIndex()).build();
        PriceProto referenceRate = PriceProto.newBuilder().setPrice(decimal("5.33")).build();
        TipsInput tips = TipsInput.newBuilder()
                .setSecurity(tipsSecurity())
                .setCurrentCpi(decimal("310.32600"))
                .build();
        ValuationRequestProto original = request(tips).toBuilder()
                .setCpiPriceInput(cpiPrice)
                .setReferenceRateInput(referenceRate)
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(original.toByteArray());

        assertEquals(original, parsed);
        assertEquals("310.32600", Decimals.text(parsed.getProductInput().getTips().getCurrentCpi()));
        assertFalse(parsed.getProductInput().getTips().hasCpi());
        assertEquals("310.326", Decimals.text(parsed.getCpiPriceInput().getPrice()));
        assertEquals("CPI-U NSA", parsed.getCpiPriceInput().getSecurity().getIssuerName());
        assertEquals("5.33", Decimals.text(parsed.getReferenceRateInput().getPrice()));
    }
}
