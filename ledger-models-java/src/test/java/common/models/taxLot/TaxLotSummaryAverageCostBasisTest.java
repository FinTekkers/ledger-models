package common.models.taxLot;

import common.models.price.Price;
import common.models.security.Security;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-497: {@link TaxLotSummary#getAverageCostBasis()} and
 * {@link TaxLotSummary#getAverageCostBasisFromSummaries} return null, not an NPE,
 * when an open lot has no price. Priced results are pinned to golden values
 * captured on the release before this change.
 */
class TaxLotSummaryAverageCostBasisTest {

    private static final Security SECURITY = testutil.DummyEquityObjects.getDummySecurity();

    /** No {@code Field.PRICE} at all. */
    private static final BiFunction<UUID, String, TaxLotDelta> NULL_PRICE =
            (id, quantity) -> lot(id, quantity, (Price) null);

    /** A {@code Price} whose {@code getPrice()} is null. */
    private static final BiFunction<UUID, String, TaxLotDelta> NULL_PRICE_VALUE =
            (id, quantity) -> lot(id, quantity, new Price(UUID.randomUUID(), null, SECURITY, ZonedDateTime.now()));

    // --- Metric 1 ---------------------------------------------------------------------------------

    @Test
    void oneUnpricedOpenLotIsNull() {
        for (BiFunction<UUID, String, TaxLotDelta> unpriced : List.of(NULL_PRICE, NULL_PRICE_VALUE)) {
            TaxLotSummary summary = summary(unpriced.apply(UUID.randomUUID(), "100"));

            assertNull(assertDoesNotThrow(() -> summary.getAverageCostBasis()));
        }
    }

    @Test
    void pricedPlusUnpricedOpenLotIsNull() {
        for (BiFunction<UUID, String, TaxLotDelta> unpriced : List.of(NULL_PRICE, NULL_PRICE_VALUE)) {
            TaxLotSummary summary = summary(
                    lot(UUID.randomUUID(), "50", "10.25"),
                    unpriced.apply(UUID.randomUUID(), "100"));

            assertNull(assertDoesNotThrow(() -> summary.getAverageCostBasis()));
        }
    }

    @Test
    void unpricedDeltaInsideAnOpenLotIsNull() {
        UUID id = UUID.randomUUID();
        TaxLotDelta open = lot(id, "100", "10");
        TaxLotDelta unpricedPartialClose = NULL_PRICE.apply(id, "-40");

        assertNull(assertDoesNotThrow(() -> summary(open, unpricedPartialClose).getAverageCostBasis()));
        assertNull(assertDoesNotThrow(() -> TaxLotSummary.getAverageCostBasisFromSummaries(
                List.of(summary(open), summary(unpricedPartialClose)))));
    }

    // --- Metric 2 ---------------------------------------------------------------------------------

    @Test
    void fromSummariesWithAnUnpricedOpenLotIsNull() {
        for (BiFunction<UUID, String, TaxLotDelta> unpriced : List.of(NULL_PRICE, NULL_PRICE_VALUE)) {
            List<TaxLotSummary> summaries = List.of(
                    summary(lot(UUID.randomUUID(), "50", "10.25")),
                    summary(unpriced.apply(UUID.randomUUID(), "100")));

            assertNull(assertDoesNotThrow(() -> TaxLotSummary.getAverageCostBasisFromSummaries(summaries)));
        }
    }

    @Test
    void closedUnpricedLotSplitAcrossSummariesIsSkipped() {
        UUID closedId = UUID.randomUUID();
        TaxLotSummary a = summary(NULL_PRICE.apply(closedId, "100"));
        TaxLotSummary b = summary(NULL_PRICE.apply(closedId, "-100"));
        TaxLotSummary c = summary(lot(UUID.randomUUID(), "50", "10.25"));

        BigDecimal result = TaxLotSummary.getAverageCostBasisFromSummaries(List.of(a, b, c));
        assertEquals(0, new BigDecimal("10.25").compareTo(result));

        // Without B, A's lot is open and unpriced.
        assertNull(assertDoesNotThrow(() -> TaxLotSummary.getAverageCostBasisFromSummaries(List.of(a, c))));
    }

    // --- Metric 3, guardrail 2: goldens captured on main before LM-497 --------------------------

    @Test
    void goldenTwoBuys() {
        UUID x = UUID.randomUUID();
        UUID y = UUID.randomUUID();
        assertGolden("10.07", 2, List.of(lot(x, "3", "10")), List.of(lot(y, "7", "10.1")));
    }

    @Test
    void goldenNonTerminatingQuotient() {
        UUID x = UUID.randomUUID();
        UUID y = UUID.randomUUID();
        assertGolden("1.666666666666667", 15, List.of(lot(x, "1", "1")), List.of(lot(y, "2", "2")));
    }

    @Test
    void goldenClosedPricedLotWithDifferentClosingPriceStillCounts() {
        // (1000 - 1200 + 512.5) / 50. A closed priced lot is not dropped, exactly as before.
        UUID x = UUID.randomUUID();
        UUID y = UUID.randomUUID();
        assertGolden("6.25", 2,
                List.of(lot(x, "100", "10"), lot(x, "-100", "12")),
                List.of(lot(y, "50", "10.25")));
    }

    // --- Metric 4, guardrail 4 --------------------------------------------------------------------

    @Test
    void closedUnpricedLotDoesNotBlockOpenPricedLot() {
        UUID closedId = UUID.randomUUID();
        List<TaxLotDelta> closed = List.of(NULL_PRICE.apply(closedId, "100"), NULL_PRICE.apply(closedId, "-100"));
        List<TaxLotDelta> open = List.of(lot(UUID.randomUUID(), "50", "10.25"));

        List<TaxLotDelta> all = new ArrayList<>(closed);
        all.addAll(open);
        BigDecimal single = new TaxLotSummary(all).getAverageCostBasis();
        BigDecimal fromSummaries = TaxLotSummary.getAverageCostBasisFromSummaries(
                List.of(new TaxLotSummary(new ArrayList<>(closed)), new TaxLotSummary(new ArrayList<>(open))));

        assertEquals(0, new BigDecimal("10.25").compareTo(single));
        assertEquals(0, new BigDecimal("10.25").compareTo(fromSummaries));
        assertEquals("10.25", single.toPlainString());
        assertEquals("10.25", fromSummaries.toPlainString());
    }

    // --- helpers ----------------------------------------------------------------------------------

    /** Asserts the golden value and scale from both instance methods and the static overload. */
    private static void assertGolden(String expected, int scale, List<TaxLotDelta> first, List<TaxLotDelta> second) {
        List<TaxLotDelta> all = new ArrayList<>(first);
        all.addAll(second);

        BigDecimal single = new TaxLotSummary(new ArrayList<>(all)).getAverageCostBasis();
        BigDecimal fromSummaries = TaxLotSummary.getAverageCostBasisFromSummaries(
                List.of(new TaxLotSummary(new ArrayList<>(first)), new TaxLotSummary(new ArrayList<>(second))));
        BigDecimal fromStatic = TaxLotSummary.getAverageCostBasis(all);

        for (BigDecimal result : List.of(single, fromSummaries, fromStatic)) {
            assertEquals(expected, result.toPlainString());
            assertEquals(scale, result.scale());
        }
    }

    private static TaxLotSummary summary(TaxLotDelta... deltas) {
        return new TaxLotSummary(new ArrayList<>(List.of(deltas)));
    }

    private static TaxLotDelta lot(UUID id, String quantity, String price) {
        return lot(id, quantity, Price.getPrice(new BigDecimal(price), SECURITY));
    }

    private static TaxLotDelta lot(UUID id, String quantity, Price price) {
        return new TaxLotDelta(id, null, TaxLotDelta.TaxLotStatus.Open, price, LocalDate.now(), null,
                new BigDecimal(quantity), SECURITY, ZonedDateTime.now(), null, EXECUTED);
    }
}
