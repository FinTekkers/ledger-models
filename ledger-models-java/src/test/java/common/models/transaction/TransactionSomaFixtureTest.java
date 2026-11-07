package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.util.LinkCache;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-444 metric 4: a SOMA BUY stored in the 6 Nov shape (2 children: the cash
 * leg and the maturity) reads back with its security as a
 * {@link BondSecurity} and the real maturity, which {@code /free/soma}'s
 * buckets need (LS-217, LM-440). Covers the primed cache, the cold cache that
 * startup replay starts from, and a lookup miss, which must not halt the load.
 */
class TransactionSomaFixtureTest {

    private final Security.Fetcher securityFetcher = Security.getFetcher();
    private final Portfolio.Fetcher portfolioFetcher = Portfolio.getFetcher();

    @BeforeEach
    void coldCache() {
        LinkCache.SECURITY.clear();
        LinkCache.PORTFOLIO.clear();
        Security.setFetcher(null);
        Portfolio.setFetcher(null);
    }

    @AfterEach
    void restore() {
        Security.setFetcher(securityFetcher);
        Portfolio.setFetcher(portfolioFetcher);
        TransactionGoldenBytesTest.restoreUsd();
    }

    static SecurityProto somaSecurity() {
        try {
            return SecurityProto.parseFrom(TransactionGoldenBytesTest.fixture("soma_security_20261106.bin"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static Transaction loadSomaRow() {
        try {
            return Transaction.fromProto(TransactionProto.parseFrom(
                    TransactionGoldenBytesTest.fixture("soma_buy_20261106.bin")));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static void primeSomaAndUsd() {
        SecurityProto soma = somaSecurity();
        LinkCache.SECURITY.put(ProtoSerializationUtil.deserializeUUID(soma.getUuid()), soma,
                ProtoSerializationUtil.deserializeTimestamp(soma.getAsOf()));
        TransactionGoldenBytesTest.restoreUsd();
    }

    private static LocalDate somaMaturity() {
        return ProtoSerializationUtil.deserializeLocalDate(somaSecurity().getBondDetails().getMaturityDate());
    }

    private static void assertResolvedShape(Transaction buy) {
        assertInstanceOf(BondSecurity.class, buy.getSecurity());
        assertEquals(somaMaturity(), buy.getSecurity().getField(Field.MATURITY_DATE));
        assertEquals(somaMaturity(), buy.getField(Field.MATURITY_DATE));

        List<Transaction> children = buy.getChildTransactions();
        assertEquals(2, children.size());
        Transaction cash = buy.getCashTransaction();
        assertNotNull(cash);
        assertInstanceOf(CashSecurity.class, cash.getSecurity());
        Transaction maturity = children.stream().filter(c -> c != cash).findFirst().orElseThrow();
        assertEquals(TransactionType.MATURATION, maturity.getTransactionType());
        assertInstanceOf(BondSecurity.class, maturity.getSecurity());
        for (Transaction child : children) assertSame(buy, child.getParentTransaction());
    }

    @Test
    void primedCache_securityIsBondSecurity_withRealMaturity() {
        primeSomaAndUsd();

        assertResolvedShape(loadSomaRow());
    }

    @Test
    void coldCache_fetchesEachSecurityOnce_andResolves() {
        SecurityProto soma = somaSecurity();
        SecurityProto usd = CashSecurity.USD.getProto();
        LinkCache.SECURITY.clear();
        Map<UUID, AtomicInteger> fetches = new ConcurrentHashMap<>();
        Security.setFetcher((id, asOf) -> {
            fetches.computeIfAbsent(id, k -> new AtomicInteger()).incrementAndGet();
            for (SecurityProto p : List.of(soma, usd)) {
                if (ProtoSerializationUtil.deserializeUUID(p.getUuid()).equals(id)) return p;
            }
            return null;
        });

        Transaction buy = loadSomaRow();

        assertResolvedShape(buy);
        UUID somaId = ProtoSerializationUtil.deserializeUUID(soma.getUuid());
        assertEquals(1, fetches.get(somaId).get(), "the SOMA note is fetched once, for the BUY, its price and the maturity");
        assertEquals(1, fetches.get(CashSecurity.USD.getID()).get(), "USD is fetched once");
        assertEquals(2, fetches.size());
    }

    @Test
    void miss_loadsWithoutThrowing_keepsTheLink_andWritesTheSameBytes() throws IOException {
        LinkCache.SECURITY.clear();
        AtomicInteger fetches = new AtomicInteger();
        Security.setFetcher((id, asOf) -> {
            fetches.incrementAndGet();
            return null;
        });

        Transaction buy = assertDoesNotThrow(TransactionSomaFixtureTest::loadSomaRow);

        assertTrue(fetches.get() > 0);
        Security security = buy.getSecurity();
        assertTrue(security.isLink());
        assertFalse(security instanceof BondSecurity);
        assertEquals(ProtoSerializationUtil.deserializeUUID(somaSecurity().getUuid()), security.getID());
        assertEquals(2, buy.getChildTransactions().size());
        assertArrayEquals(TransactionGoldenBytesTest.fixture("soma_buy_20261106.bin"), buy.getProto().toByteArray());
    }
}
