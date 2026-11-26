package common.models.taxLot;

import common.models.price.Price;
import common.models.security.Security;
import common.models.taxLot.WeightedAveragePurchasePrice.Fill;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static org.junit.jupiter.api.Assertions.*;

class WeightedAveragePurchasePriceTest {

    private static Fill fill(String quantity, String price) {
        return new Fill(new BigDecimal(quantity), new BigDecimal(price));
    }

    @Test
    void sellsDoNotChangeTheBuysOnlyAverage() {
        Optional<BigDecimal> result = WeightedAveragePurchasePrice.of(List.of(
                fill("100", "10"), fill("100", "20"), fill("-50", "25")));

        assertTrue(result.isPresent());
        assertEquals(0, new BigDecimal("15").compareTo(result.get()));
        assertEquals("15", result.get().toPlainString());
    }

    @Test
    void noBuysIsEmpty() {
        assertEquals(Optional.empty(), WeightedAveragePurchasePrice.of(List.of(fill("-50", "25"))));
    }

    @Test
    void repeatingResultRoundsTo12PlacesHalfEven() {
        Optional<BigDecimal> result = WeightedAveragePurchasePrice.of(List.of(fill("1", "1"), fill("2", "2")));

        assertEquals("1.666666666667", result.orElseThrow().toPlainString());
    }

    @Test
    void fromLotsUsesBuysOnlyWhileTaxLotSummaryStillNetsSells() {
        Security security = testutil.DummyEquityObjects.getDummySecurity();
        List<TaxLotDelta> lots = List.of(
                lot(security, "100", "10"),
                lot(security, "100", "20"),
                lot(security, "-50", "25"));

        Optional<BigDecimal> result = WeightedAveragePurchasePrice.fromLots(lots);
        assertEquals("15", result.orElseThrow().toPlainString());

        // Existing behaviour, unchanged: (1000 + 2000 - 1250) / 150, at MathContext(16, HALF_UP).
        assertEquals("11.66666666666667", TaxLotSummary.getAverageCostBasis(lots).toPlainString());
    }

    // --- LM-501: fromLots is null-safe on an unpriced lot -----------------------------------------

    @Test
    void fromLotsOverOneUnpricedBuyIsEmpty() {
        Security security = testutil.DummyEquityObjects.getDummySecurity();
        for (TaxLotDelta unpriced : List.of(nullPriceLot(security, "100"), nullPriceValueLot(security, "100"))) {
            Optional<BigDecimal> result = assertDoesNotThrow(
                    () -> WeightedAveragePurchasePrice.fromLots(List.of(unpriced)));
            assertEquals(Optional.empty(), result);
        }
    }

    @Test
    void fromLotsWithPricedLotsAndOneUnpricedLotIsEmpty() {
        Security security = testutil.DummyEquityObjects.getDummySecurity();
        for (TaxLotDelta unpriced : List.of(nullPriceLot(security, "50"), nullPriceValueLot(security, "50"))) {
            List<TaxLotDelta> lots = List.of(lot(security, "100", "10"), lot(security, "100", "20"), unpriced);
            assertEquals(Optional.empty(), assertDoesNotThrow(() -> WeightedAveragePurchasePrice.fromLots(lots)));
        }
    }

    @Test
    void fromLotsWithAnUnpricedSellIsEmpty() {
        // An unpriced lot is never skipped: without the rule this sell would be ignored and give 10.
        Security security = testutil.DummyEquityObjects.getDummySecurity();
        for (TaxLotDelta unpriced : List.of(nullPriceLot(security, "-50"), nullPriceValueLot(security, "-50"))) {
            List<TaxLotDelta> lots = List.of(lot(security, "100", "10"), unpriced);
            assertEquals(Optional.empty(), WeightedAveragePurchasePrice.fromLots(lots));
        }
    }

    @Test
    void fromLotsOverNoLotsIsEmpty() {
        assertEquals(Optional.empty(), assertDoesNotThrow(() -> WeightedAveragePurchasePrice.fromLots(List.of())));
    }

    @Test
    void fromLotsPricedOnlyMatchesGoldenValues() {
        // Golden values captured from fromLots on ea1455ef, before LM-501.
        Security security = testutil.DummyEquityObjects.getDummySecurity();

        BigDecimal fifteen = WeightedAveragePurchasePrice.fromLots(List.of(
                lot(security, "100", "10"), lot(security, "100", "20"), lot(security, "-50", "25"))).orElseThrow();
        assertEquals("15", fifteen.toPlainString());
        assertEquals(0, new BigDecimal("15").compareTo(fifteen));
        assertEquals(0, fifteen.scale());

        BigDecimal repeating = WeightedAveragePurchasePrice.fromLots(List.of(
                lot(security, "1", "1"), lot(security, "2", "2"))).orElseThrow();
        assertEquals("1.666666666667", repeating.toPlainString());
        assertEquals(0, new BigDecimal("1.666666666667").compareTo(repeating));
        assertEquals(12, repeating.scale());

        BigDecimal trailingZeros = WeightedAveragePurchasePrice.fromLots(List.of(
                lot(security, "100", "100"), lot(security, "100", "200"))).orElseThrow();
        assertEquals("150", trailingZeros.toPlainString());
        assertEquals(0, new BigDecimal("150").compareTo(trailingZeros));
        assertEquals(-1, trailingZeros.scale());
    }

    private static TaxLotDelta lot(Security security, String quantity, String price) {
        return lot(security, quantity, Price.getPrice(new BigDecimal(price), security));
    }

    /** No {@code Field.PRICE} at all. */
    private static TaxLotDelta nullPriceLot(Security security, String quantity) {
        return lot(security, quantity, (Price) null);
    }

    /** A {@code Price} whose {@code getPrice()} is null. */
    private static TaxLotDelta nullPriceValueLot(Security security, String quantity) {
        return lot(security, quantity, new Price(UUID.randomUUID(), null, security, ZonedDateTime.now()));
    }

    private static TaxLotDelta lot(Security security, String quantity, Price price) {
        return new TaxLotDelta(UUID.randomUUID(), null, TaxLotDelta.TaxLotStatus.Open,
                price, LocalDate.now(), null,
                new BigDecimal(quantity), security, ZonedDateTime.now(), null, EXECUTED);
    }
}
