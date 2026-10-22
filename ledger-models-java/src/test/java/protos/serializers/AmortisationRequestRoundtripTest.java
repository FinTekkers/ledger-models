package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.portfolio.AmortisationElectionsProto;
import fintekkers.models.portfolio.MarketDiscountAccrualMethodProto;
import fintekkers.models.portfolio.MarketDiscountInclusionProto;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.portfolio.PremiumAmortisationElectionProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.requests.valuation.TaxLotInputProto;
import fintekkers.requests.valuation.ValuationRequestProto;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-364 — AmortisationElectionsProto on PortfolioProto (11) and
 * ValuationRequestProto (26), and the typed lots (27), round-trip.
 *
 * Every test sets non-zero enum values: value 0 is not written on the wire.
 */
class AmortisationRequestRoundtripTest {

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder()
                .setYear(year).setMonth(month).setDay(day)
                .build();
    }

    private static AmortisationElectionsProto elections() {
        return AmortisationElectionsProto.newBuilder()
                .setBondPremium(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED)
                .setMarketDiscountInclusion(MarketDiscountInclusionProto.INCLUDE_CURRENTLY)
                .setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD)
                .setEffectiveFrom(date(2026, 1, 1))
                .build();
    }

    private static TaxLotInputProto lot(LocalDateProto trade, LocalDateProto settle, String quantity, String price) {
        return TaxLotInputProto.newBuilder()
                .setTradeDate(trade)
                .setSettlementDate(settle)
                .setQuantity(Decimals.decimal(quantity))
                .setPrice(Decimals.decimal(price))
                .build();
    }

    @Test
    void valuationRequestElectionsAndLotsRoundTrip() throws InvalidProtocolBufferException {
        ValuationRequestProto request = ValuationRequestProto.newBuilder()
                .setAmortisationElections(elections())
                .addTaxLots(lot(date(2025, 3, 3), date(2025, 3, 4), "1000000", "101.25"))
                .addTaxLots(lot(date(2026, 2, 2), date(2026, 2, 3), "500000", "98.50"))
                .build();

        ValuationRequestProto decoded = ValuationRequestProto.parseFrom(request.toByteArray());
        assertEquals(request, decoded);

        AmortisationElectionsProto e = decoded.getAmortisationElections();
        assertEquals(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED, e.getBondPremium());
        assertEquals(MarketDiscountInclusionProto.INCLUDE_CURRENTLY, e.getMarketDiscountInclusion());
        assertEquals(MarketDiscountAccrualMethodProto.CONSTANT_YIELD, e.getMarketDiscountAccrual());
        assertEquals(date(2026, 1, 1), e.getEffectiveFrom());

        assertEquals(2, decoded.getTaxLotsCount());
        TaxLotInputProto second = decoded.getTaxLots(1);
        assertEquals(date(2026, 2, 2), second.getTradeDate());
        assertEquals(date(2026, 2, 3), second.getSettlementDate());
        assertEquals(Decimals.decimal("500000"), second.getQuantity());
        assertEquals(Decimals.decimal("98.50"), second.getPrice());
    }

    @Test
    void portfolioElectionsRoundTrip() throws InvalidProtocolBufferException {
        PortfolioProto portfolio = PortfolioProto.newBuilder()
                .setPortfolioName("Tax lots")
                .setAmortisationElections(elections())
                .build();

        PortfolioProto decoded = PortfolioProto.parseFrom(portfolio.toByteArray());
        assertTrue(decoded.hasAmortisationElections());
        assertEquals(elections(), decoded.getAmortisationElections());
    }

    @Test
    void unsetElectionsReadBackEveryDefault() throws InvalidProtocolBufferException {
        AmortisationElectionsProto decoded = AmortisationElectionsProto.parseFrom(
                AmortisationElectionsProto.getDefaultInstance().toByteArray());
        assertEquals(PremiumAmortisationElectionProto.UNSPECIFIED_PREMIUM_ELECTION, decoded.getBondPremium());
        assertEquals(MarketDiscountInclusionProto.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION, decoded.getMarketDiscountInclusion());
        assertEquals(MarketDiscountAccrualMethodProto.UNSPECIFIED_ACCRUAL_METHOD, decoded.getMarketDiscountAccrual());
        assertFalse(decoded.hasEffectiveFrom());
    }
}
