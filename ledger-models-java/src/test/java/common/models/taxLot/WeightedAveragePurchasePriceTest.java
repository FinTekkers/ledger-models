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

    private static TaxLotDelta lot(Security security, String quantity, String price) {
        return new TaxLotDelta(UUID.randomUUID(), null, TaxLotDelta.TaxLotStatus.Open,
                Price.getPrice(new BigDecimal(price), security), LocalDate.now(), null,
                new BigDecimal(quantity), security, ZonedDateTime.now(), null, EXECUTED);
    }
}
