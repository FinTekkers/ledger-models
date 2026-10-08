package common.models.transaction;

import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-271: a BUY whose portfolio is a link with no as_of gets its cash impact
 * (createCashTransaction copies the parent's portfolio) and serializes
 * without an NPE. The link stays a link and as_of stays unset.
 */
class TransactionLinkPortfolioTest {

    private Portfolio.Fetcher savedFetcher;

    // No fetcher: any hydration throws instead of making a gRPC call.
    @BeforeEach
    void noFetcher() {
        savedFetcher = Portfolio.getFetcher();
        Portfolio.setFetcher(null);
    }

    @AfterEach
    void restoreFetcher() {
        Portfolio.setFetcher(savedFetcher);
    }

    private static void assertLinkWithoutAsOf(UUID id, PortfolioProto proto) {
        assertEquals(id, ProtoSerializationUtil.deserializeUUID(proto.getUuid()));
        assertTrue(proto.getIsLink());
        assertFalse(proto.hasAsOf());
    }

    @Test
    void cashImpactOnLinkPortfolioDoesNotThrow() {
        UUID id = UUID.randomUUID();
        Portfolio link = new Portfolio(PortfolioProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setIsLink(true)
                .build());

        Transaction buy = assertDoesNotThrow(() ->
                DummyEquityObjects.getDummyTransaction(link, DummyEquityObjects.getDummySecurity()));
        assertEquals(TransactionType.BUY, buy.getTransactionType());

        Transaction cash = buy.getCashTransaction();
        assertNotNull(cash);
        Portfolio cashPortfolio = cash.getPortfolio();
        assertEquals(id, cashPortfolio.getID());
        assertTrue(cashPortfolio.isLink());

        assertLinkWithoutAsOf(id, assertDoesNotThrow(buy::getProto).getPortfolio());
        assertLinkWithoutAsOf(id, assertDoesNotThrow(cash::getProto).getPortfolio());
        assertLinkWithoutAsOf(id, PortfolioSerializer.getInstance().serialize(cashPortfolio));
    }
}
