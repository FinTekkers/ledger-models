package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.portfolio.AmortisationElectionsProto;
import fintekkers.models.portfolio.MarketDiscountAccrualMethodProto;
import fintekkers.models.portfolio.MarketDiscountInclusionProto;
import fintekkers.models.portfolio.PremiumAmortisationElectionProto;
import fintekkers.models.position.TaxLotProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.requests.valuation.CostBasisInput;
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
}
