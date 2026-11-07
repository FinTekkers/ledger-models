package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.function.Supplier;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-444 metric 2: a BUY, a SELL, a TIPS and an FRN, each with children,
 * serialize and deserialize to equal objects, compared field by field
 * ({@link Transaction#equals} only compares ID and as_of). In the bytes the
 * nested Security and Portfolio are links and the trade price is inline.
 */
class TransactionRoundTripTest {

    private final Security.Fetcher securityFetcher = Security.getFetcher();
    private final Portfolio.Fetcher portfolioFetcher = Portfolio.getFetcher();

    @BeforeEach
    void noFetchers() {
        Security.setFetcher(null);
        Portfolio.setFetcher(null);
    }

    @AfterEach
    void restore() {
        Security.setFetcher(securityFetcher);
        Portfolio.setFetcher(portfolioFetcher);
    }

    static Stream<Arguments> transactions() {
        return Stream.of(
                Arguments.of("BUY", (Supplier<Transaction>) TransactionGoldenFixtures::buy, BondSecurity.class),
                Arguments.of("SELL", (Supplier<Transaction>) TransactionGoldenFixtures::sell, BondSecurity.class),
                Arguments.of("TIPS", (Supplier<Transaction>) TransactionGoldenFixtures::tipsBuy, TIPSBond.class),
                Arguments.of("FRN", (Supplier<Transaction>) TransactionGoldenFixtures::frnBuy, FloatingRateNote.class));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("transactions")
    void serializeThenDeserialize_givesAnEqualObject(String name, Supplier<Transaction> build,
                                                    Class<? extends Security> securityClass) throws Exception {
        // Building primes LinkCache with the full security and portfolio, as a
        // ledger-service write does before a same-process read.
        Transaction original = build.get();
        TransactionProto bytes = TransactionProto.parseFrom(
                TransactionSerializer.getInstance().serialize(original).toByteArray());

        Transaction copy = TransactionSerializer.getInstance().deserialize(bytes);

        assertEquals(securityClass, copy.getSecurity().getClass());
        assertFieldsEqual(original, copy);
        assertEquals(2, copy.getChildTransactions().size());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("transactions")
    void bytes_linkSecurityAndPortfolio_keepPriceInline(String name, Supplier<Transaction> build,
                                                       Class<? extends Security> securityClass) {
        TransactionProto out = build.get().getProto();

        assertLinksAndInlinePrice(out);
        for (TransactionProto child : out.getChildTransactionsList()) assertLinksAndInlinePrice(child);
    }

    private static void assertLinksAndInlinePrice(TransactionProto p) {
        assertTrue(p.getSecurity().getIsLink(), "security is a link");
        assertFalse(p.getSecurity().hasBondDetails());
        assertTrue(p.getPortfolio().getIsLink(), "portfolio is a link");
        assertFalse(p.getPrice().getIsLink(), "price is inline");
        assertFalse(p.getPrice().getPrice().getUnscaledValue().isEmpty(), "price decimal is present");
        assertTrue(p.getPrice().getSecurity().getIsLink(), "the price's security is a link");
    }

    /** Every field a getter exposes, recursively over the children. */
    private static void assertFieldsEqual(Transaction expected, Transaction actual) {
        assertEquals(expected.getID(), actual.getID());
        assertEquals(expected.getAsOf(), actual.getAsOf());
        assertEquals(expected.validFrom, actual.validFrom);
        assertEquals(expected.getValidTo(), actual.getValidTo());
        assertEquals(expected.isLink(), actual.isLink());

        assertEquals(expected.getPortfolio().getID(), actual.getPortfolio().getID());
        assertEquals(expected.getPortfolio().getAsOf(), actual.getPortfolio().getAsOf());
        assertEquals(expected.getPortfolio().getPortfolioName(), actual.getPortfolio().getPortfolioName());

        Security es = expected.getSecurity();
        Security as = actual.getSecurity();
        assertEquals(es.getClass(), as.getClass());
        assertEquals(es.getID(), as.getID());
        assertEquals(es.getAsOf(), as.getAsOf());
        assertEquals(es.getProductType(), as.getProductType());
        assertEquals(es.getField(Field.MATURITY_DATE), as.getField(Field.MATURITY_DATE));
        if (es instanceof BondSecurity eb) {
            assertEquals(eb.getFaceValue(), ((BondSecurity) as).getFaceValue());
        }
        if (es instanceof CashSecurity) assertTrue(as.isCash());

        Price ep = expected.getPrice();
        Price ap = actual.getPrice();
        assertEquals(ep.getID(), ap.getID());
        assertEquals(ep.getAsOf(), ap.getAsOf());
        assertEquals(ep.getPrice(), ap.getPrice());
        assertEquals(ep.getSecurity().getID(), ap.getSecurity().getID());

        assertEquals(expected.getTransactionType(), actual.getTransactionType());
        assertEquals(expected.getQuantity(), actual.getQuantity());
        assertEquals(expected.getTradeDate(), actual.getTradeDate());
        assertEquals(expected.getSettlementDate(), actual.getSettlementDate());
        assertEquals(expected.getPositionStatus(), actual.getPositionStatus());
        assertEquals(expected.getTradeName(), actual.getTradeName());
        assertEquals(expected.isCancelled(), actual.isCancelled());
        assertEquals(expected.getStrategyAllocation().getID(), actual.getStrategyAllocation().getID());
        assertEquals(expected.getStrategyAllocation().getProto(), actual.getStrategyAllocation().getProto());

        assertEquals(expected.getChildTransactions().size(), actual.getChildTransactions().size());
        for (int i = 0; i < expected.getChildTransactions().size(); i++) {
            Transaction actualChild = actual.getChildTransactions().get(i);
            assertSame(actual, actualChild.getParentTransaction());
            assertFieldsEqual(expected.getChildTransactions().get(i), actualChild);
        }
    }
}
