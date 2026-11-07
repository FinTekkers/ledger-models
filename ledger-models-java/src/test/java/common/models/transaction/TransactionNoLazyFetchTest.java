package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-444 guardrail 4: links resolve only when the transaction is built from a
 * proto. After that, getters and serialising never fetch.
 */
class TransactionNoLazyFetchTest {

    private static final List<Field> FIELDS = List.of(Field.ID, Field.AS_OF, Field.TRANSACTION_TYPE,
            Field.TRADE_DATE, Field.SETTLEMENT_DATE, Field.POSITION_STATUS, Field.PRICE, Field.IS_CANCELLED,
            Field.SECURITY, Field.SECURITY_ISSUER_NAME, Field.ISSUE_DATE, Field.PRODUCT_TYPE, Field.IDENTIFIER,
            Field.ASSET_CLASS, Field.PRODUCT_CLASS, Field.SECURITY_DESCRIPTION, Field.SECURITY_ID,
            Field.MATURITY_DATE, Field.PORTFOLIO, Field.PORTFOLIO_ID, Field.PORTFOLIO_NAME, Field.STRATEGY);

    private final Security.Fetcher securityFetcher = Security.getFetcher();
    private final Portfolio.Fetcher portfolioFetcher = Portfolio.getFetcher();
    private final Transaction.Fetcher transactionFetcher = Transaction.getFetcher();
    private final AtomicInteger securityFetches = new AtomicInteger();
    private final AtomicInteger portfolioFetches = new AtomicInteger();
    private final AtomicInteger transactionFetches = new AtomicInteger();

    @BeforeEach
    void countingFetchers() {
        Transaction.setFetcher((id, asOf) -> {
            transactionFetches.incrementAndGet();
            return null;
        });
    }

    @AfterEach
    void restore() {
        Security.setFetcher(securityFetcher);
        Portfolio.setFetcher(portfolioFetcher);
        Transaction.setFetcher(transactionFetcher);
        TransactionGoldenBytesTest.restoreUsd();
    }

    @Test
    void afterBuild_gettersAndGetProto_neverFetch() throws Exception {
        Transaction written = TransactionGoldenFixtures.buy();
        SecurityProto note = written.getSecurity().getProto();
        SecurityProto usd = CashSecurity.USD.getProto();
        PortfolioProto portfolio = PortfolioSerializer.getInstance().serialize(written.getPortfolio());
        byte[] bytes = written.getProto().toByteArray();

        // Cold start: the transaction's links must come from the fetchers.
        LinkCache.SECURITY.clear();
        LinkCache.PORTFOLIO.clear();
        Security.setFetcher((id, asOf) -> {
            securityFetches.incrementAndGet();
            for (SecurityProto p : List.of(note, usd)) {
                if (ProtoSerializationUtil.deserializeUUID(p.getUuid()).equals(id)) return p;
            }
            return null;
        });
        Portfolio.setFetcher((id, asOf) -> {
            portfolioFetches.incrementAndGet();
            return portfolio;
        });

        Transaction loaded = Transaction.fromProto(TransactionProto.parseFrom(bytes));
        int securityAtBuild = securityFetches.get();
        int portfolioAtBuild = portfolioFetches.get();
        assertTrue(securityAtBuild > 0 && portfolioAtBuild > 0, "the build resolved the links");

        for (int i = 0; i < 5; i++) {
            readEverything(loaded);
            assertArrayEquals(bytes, loaded.getProto().toByteArray());
            loaded.getRawProto();
        }

        assertEquals(securityAtBuild, securityFetches.get(), "a getter or getProto() fetched a security");
        assertEquals(portfolioAtBuild, portfolioFetches.get(), "a getter or getProto() fetched a portfolio");
        assertEquals(0, transactionFetches.get());
    }

    private static void readEverything(Transaction t) {
        for (Field f : FIELDS) t.getField(f);
        t.getSecurity().isCash();
        t.getPortfolio().getPortfolioName();
        t.getPrice().getSecurity().getProductType();
        t.getStrategyAllocation().getAllocations();
        t.getDirectedQuantity();
        t.getTradeName();
        t.getValidFrom();
        t.getValidTo();
        t.toString();
        t.getCashTransaction();
        for (Transaction child : t.getChildTransactions()) readEverything(child);
    }
}
