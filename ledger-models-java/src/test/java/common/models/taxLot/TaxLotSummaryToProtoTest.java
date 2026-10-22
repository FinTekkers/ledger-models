package common.models.taxLot;

import common.models.portfolio.Portfolio;
import common.models.postion.Measure;
import common.models.price.Price;
import common.models.security.Security;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.position.TaxLotProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static org.junit.jupiter.api.Assertions.*;

class TaxLotSummaryToProtoTest {
    private static final LocalDate OPEN_DATE = LocalDate.of(2026, 3, 2);
    private static final ZonedDateTime OPENED_AT =
            ZonedDateTime.of(2026, 3, 2, 9, 30, 0, 0, ZoneId.of("America/New_York"));

    private final Security bond = DummyBondObjects.getDummySecurity();
    private final Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();

    private TaxLotDelta open() {
        return new TaxLotDelta(UUID.randomUUID(), portfolio, TaxLotDelta.TaxLotStatus.Open,
                Price.getPrice(new BigDecimal("99.5"), bond), OPEN_DATE, null,
                new BigDecimal("1000000"), bond, OPENED_AT, null, EXECUTED);
    }

    // The sell's asOf is now, so the close is later than the open.
    private TaxLotDelta close(TaxLotDelta open) {
        Transaction sell = DummyEquityObjects.getDummyTransaction(LocalDate.now(), portfolio, bond,
                TransactionType.SELL, Price.getPrice(new BigDecimal("101"), bond),
                new BigDecimal("400000"), null);
        TaxLotDelta close = TaxLotDelta.createDelta(open, new BigDecimal("-400000"), sell);
        assertTrue(close.getAsOf().isAfter(open.getAsOf()));
        return close;
    }

    private static void assertLot(TaxLotProto proto, String openQuantity) {
        assertEquals(OPEN_DATE, ProtoSerializationUtil.deserializeRequiredLocalDate(proto.getOpenDate(), "open_date"));
        assertEquals(0, new BigDecimal(openQuantity)
                .compareTo(ProtoSerializationUtil.deserializeBigDecimal(proto.getOpenQuantity())));
        assertEquals(0, new BigDecimal("99.5")
                .compareTo(ProtoSerializationUtil.deserializeBigDecimal(proto.getPrice())));
    }

    @Test
    void partlyClosedLotViaCollectionConstructor() {
        TaxLotDelta open = open();
        TaxLotDelta close = close(open);
        // Close first: the order of the deltas must not decide the answer.
        TaxLotSummary summary = new TaxLotSummary(new ArrayList<>(List.of(close, open)));

        assertLot(summary.toProto(), "600000");
    }

    @Test
    void partlyClosedLotViaAddTaxLot() {
        TaxLotDelta open = open();
        TaxLotSummary summary = new TaxLotSummary(open);
        summary.addTaxLot(close(open));

        assertLot(summary.toProto(), "600000");
    }

    // ledger-service invalidates a delta when it is replaced. The rule matches
    // openQuantity(): every delta counts, and the open date and price are read
    // from the earliest delta, invalidated or not.
    @Test
    void invalidatedOpeningDeltaStillGivesTheLot() {
        TaxLotDelta open = open();
        TaxLotDelta.invalidate(open);
        assertTrue(open.isInvalidated());
        TaxLotSummary summary = new TaxLotSummary(new ArrayList<>(List.of(close(open), open)));

        assertLot(summary.toProto(), "600000");
    }

    @Test
    void lotWithNoDeltasThrowsNamingTheLot() {
        TaxLotDelta open = open();
        TaxLotSummary summary = new TaxLotSummary(open);
        summary.allLots().clear();

        IllegalStateException e = assertThrows(IllegalStateException.class, summary::toProto);
        assertTrue(e.getMessage().contains(open.getID().toString()), e.getMessage());
    }

    @Test
    void openingDeltaWithoutPriceThrowsNamingPrice() {
        TaxLotDelta open = new TaxLotDelta(UUID.randomUUID(), portfolio, TaxLotDelta.TaxLotStatus.Open,
                null, OPEN_DATE, null, new BigDecimal("1000000"), bond, OPENED_AT, null, EXECUTED);

        IllegalStateException e = assertThrows(IllegalStateException.class, new TaxLotSummary(open)::toProto);
        assertTrue(e.getMessage().contains("price"), e.getMessage());
        assertTrue(e.getMessage().contains(open.getID().toString()), e.getMessage());
    }

    // Guardrail: existing TaxLotSummary results are unchanged. The close is made
    // with createDelta, which copies the opening price, so the weighted average
    // stays at 99.5: (99.5 * 1,000,000 - 99.5 * 400,000) / 600,000. Values below
    // are what main gives.
    @Test
    void existingResultsUnchanged() {
        TaxLotDelta open = open();
        TaxLotSummary summary = new TaxLotSummary(open);
        summary.addTaxLot(close(open));
        summary.toProto();

        assertEquals("99.5", summary.getAverageCostBasis().toPlainString());
        assertEquals("99.5", summary.getMeasure(Measure.UNADJUSTED_COST_BASIS).toPlainString());
        assertEquals(0, new BigDecimal("600000").compareTo(summary.getMeasure(Measure.DIRECTED_QUANTITY)));
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> summary.getMeasure(Measure.PROFIT_LOSS));
        assertEquals("Not supported: PROFIT_LOSS", e.getMessage());
        assertEquals(Set.of(Measure.DIRECTED_QUANTITY, Measure.UNADJUSTED_COST_BASIS), summary.getMeasures());
    }
}
