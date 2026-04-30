package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.security.CashSecurity;
import common.models.strategy.StrategyAllocation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TransactionSetTest {

    private Transaction createTransaction(UUID id, ZonedDateTime asOf) {
        Portfolio portfolio = new Portfolio(UUID.randomUUID(), "Test Portfolio", ZonedDateTime.now());
        Security security = testutil.DummyEquityObjects.getDummySecurity();
        Price price = Price.getPrice(BigDecimal.TEN, security);

        return new Transaction(id, portfolio, price,
                LocalDate.now(), LocalDate.now().plusDays(2),
                BigDecimal.TEN, security, TransactionType.BUY,
                new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now()),
                asOf, null, "", null);
    }

    @Test
    void allLatestTransactions_returnsSingleVersionPerUUID() {
        TransactionSet set = new TransactionSet();

        UUID txnId = UUID.randomUUID();
        ZonedDateTime earlier = ZonedDateTime.now().minusHours(2);
        ZonedDateTime later = ZonedDateTime.now();

        Transaction v1 = createTransaction(txnId, earlier);
        Transaction v2 = createTransaction(txnId, later);

        set.addTransaction(v1);
        set.addTransaction(v2);

        List<Transaction> latest = set.allLatestTransactions();

        assertEquals(1, latest.size());
        assertEquals(later, latest.get(0).getAsOf());
    }

    @Test
    void allLatestTransactions_multipleUUIDs() {
        TransactionSet set = new TransactionSet();

        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        ZonedDateTime now = ZonedDateTime.now();

        set.addTransaction(createTransaction(id1, now.minusHours(1)));
        set.addTransaction(createTransaction(id1, now));
        set.addTransaction(createTransaction(id2, now));

        List<Transaction> latest = set.allLatestTransactions();

        assertEquals(2, latest.size());
    }

    @Test
    void allLatestTransactions_emptySet() {
        TransactionSet set = new TransactionSet();
        List<Transaction> latest = set.allLatestTransactions();
        assertTrue(latest.isEmpty());
    }

    @Test
    void allLatestTransactions_singleVersion() {
        TransactionSet set = new TransactionSet();

        UUID id = UUID.randomUUID();
        Transaction txn = createTransaction(id, ZonedDateTime.now());
        set.addTransaction(txn);

        List<Transaction> latest = set.allLatestTransactions();
        assertEquals(1, latest.size());
        assertSame(txn, latest.get(0));
    }
}
