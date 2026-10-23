package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.portfolio.AmortisationElectionsProto;
import fintekkers.models.portfolio.MarketDiscountAccrualMethodProto;
import fintekkers.models.portfolio.MarketDiscountInclusionProto;
import fintekkers.models.portfolio.PremiumAmortisationElectionProto;
import fintekkers.models.position.TaxLotProto;
import com.google.protobuf.Timestamp;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.requests.valuation.CostBasisInput;
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
 * LM-364 — a TipsInput with cost_basis (20): non-default elections and two
 * TaxLotProto lots round-trip unchanged.
 *
 * LM-378 — a TIPS ADJUSTED_COST_BASIS request: two lots plus the valuation
 * date's m-3 and m-2 CPI readings round-trip unchanged.
 *
 * The enum values are all non-zero: value 0 is not written on the wire.
 */
class CostBasisInputRoundtripTest {

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder()
                .setYear(year).setMonth(month).setDay(day)
                .build();
    }

    private static TaxLotProto lot(LocalDateProto openDate, String openQuantity, String price) {
        return TaxLotProto.newBuilder()
                .setOpenDate(openDate)
                .setOpenQuantity(Decimals.decimal(openQuantity))
                .setPrice(Decimals.decimal(price))
                .build();
    }

    private static MonthlyIndexReading reading(int year, int month, String value) {
        return MonthlyIndexReading.newBuilder()
                .setYear(year).setMonth(month).setValue(Decimals.decimal(value))
                .build();
    }

    @Test
    void tipsInputCostBasisRoundTripsUnchanged() throws InvalidProtocolBufferException {
        TipsInput tips = TipsInput.newBuilder()
                .setCleanPrice(Decimals.decimal("97.50"))
                .setCostBasis(CostBasisInput.newBuilder()
                        .setElections(AmortisationElectionsProto.newBuilder()
                                .setBondPremium(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED)
                                .setMarketDiscountInclusion(MarketDiscountInclusionProto.INCLUDE_CURRENTLY)
                                .setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD))
                        .addLots(lot(date(2024, 1, 15), "10000", "98.25"))
                        .addLots(lot(date(2025, 6, 2), "5000", "101.50")))
                .build();
        ValuationRequestProto request = ValuationRequestProto.newBuilder()
                .setProductInput(ProductInput.newBuilder().setTips(tips))
                .build();

        TipsInput decoded = ValuationRequestProto.parseFrom(request.toByteArray()).getProductInput().getTips();
        assertEquals(tips, decoded);

        assertTrue(decoded.hasCostBasis());
        CostBasisInput costBasis = decoded.getCostBasis();
        assertTrue(costBasis.hasElections());
        AmortisationElectionsProto e = costBasis.getElections();
        assertEquals(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED, e.getBondPremium());
        assertEquals(MarketDiscountInclusionProto.INCLUDE_CURRENTLY, e.getMarketDiscountInclusion());
        assertEquals(MarketDiscountAccrualMethodProto.CONSTANT_YIELD, e.getMarketDiscountAccrual());

        assertEquals(2, costBasis.getLotsCount());
        TaxLotProto first = costBasis.getLots(0);
        assertEquals(date(2024, 1, 15), first.getOpenDate());
        assertEquals(Decimals.decimal("10000"), first.getOpenQuantity());
        assertEquals(Decimals.decimal("98.25"), first.getPrice());
        TaxLotProto second = costBasis.getLots(1);
        assertEquals(date(2025, 6, 2), second.getOpenDate());
        assertEquals(Decimals.decimal("5000"), second.getOpenQuantity());
        assertEquals(Decimals.decimal("101.50"), second.getPrice());
    }

    @Test
    void tipsAdjustedCostBasisRequestWithCpiReadingsRoundTripsUnchanged() throws InvalidProtocolBufferException {
        // 2026-10-23T14:30:00Z: settlement month 2026-10, so m-3 and m-2 are 2026-07 and 2026-08.
        LocalTimestampProto asof = LocalTimestampProto.newBuilder()
                .setTimestamp(Timestamp.newBuilder().setSeconds(1792765800L))
                .build();
        TipsInput tips = TipsInput.newBuilder()
                .setCleanPrice(Decimals.decimal("97.50"))
                .setCpi(InflationIndexInput.newBuilder()
                        .setReadings(MonthlyIndexReadings.newBuilder()
                                .addReadings(reading(2026, 7, "322.100"))
                                .addReadings(reading(2026, 8, "322.900"))))
                .setCostBasis(CostBasisInput.newBuilder()
                        .addLots(lot(date(2024, 1, 15), "10000", "98.25"))
                        .addLots(lot(date(2025, 6, 2), "5000", "101.50")))
                .build();
        ValuationRequestProto request = ValuationRequestProto.newBuilder()
                .setAsofDatetime(asof)
                .setProductInput(ProductInput.newBuilder().setTips(tips))
                .build();

        ValuationRequestProto parsed = ValuationRequestProto.parseFrom(request.toByteArray());
        assertEquals(asof, parsed.getAsofDatetime());
        assertEquals(1792765800L, parsed.getAsofDatetime().getTimestamp().getSeconds());
        TipsInput decoded = parsed.getProductInput().getTips();
        assertEquals(tips, decoded);

        assertTrue(decoded.getCpi().hasReadings());
        MonthlyIndexReadings readings = decoded.getCpi().getReadings();
        assertEquals(2, readings.getReadingsCount());
        assertEquals(2026, readings.getReadings(0).getYear());
        assertEquals(7, readings.getReadings(0).getMonth());
        assertEquals(Decimals.decimal("322.100"), readings.getReadings(0).getValue());
        assertEquals(2026, readings.getReadings(1).getYear());
        assertEquals(8, readings.getReadings(1).getMonth());
        assertEquals(Decimals.decimal("322.900"), readings.getReadings(1).getValue());

        CostBasisInput costBasis = decoded.getCostBasis();
        assertEquals(2, costBasis.getLotsCount());
        TaxLotProto first = costBasis.getLots(0);
        assertEquals(date(2024, 1, 15), first.getOpenDate());
        assertEquals(Decimals.decimal("10000"), first.getOpenQuantity());
        assertEquals(Decimals.decimal("98.25"), first.getPrice());
        TaxLotProto second = costBasis.getLots(1);
        assertEquals(date(2025, 6, 2), second.getOpenDate());
        assertEquals(Decimals.decimal("5000"), second.getOpenQuantity());
        assertEquals(Decimals.decimal("101.50"), second.getPrice());
    }
}
