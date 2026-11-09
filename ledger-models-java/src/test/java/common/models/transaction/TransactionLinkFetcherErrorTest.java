package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;
import common.models.security.Security;
import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-450: a {@link Transaction.Fetcher} that throws for a link is not
 * swallowed. The link still builds, and every business read rethrows the
 * fetcher's own exception instance, as before LM-444. A miss (no fetcher, or
 * the fetcher returns {@code null}) still raises {@link IllegalStateException}.
 */
class TransactionLinkFetcherErrorTest {

    /** The fetcher's typed error, e.g. ledger-service's UnknownLinkException. */
    static final class UnknownLinkException extends RuntimeException {
        UnknownLinkException(UUID id) {
            super("Unknown transaction link " + id);
        }
    }

    private static final ZonedDateTime AS_OF = ZonedDateTime.parse("2026-11-06T12:00:00Z");

    private Transaction.Fetcher transactionFetcher;
    private Security.Fetcher securityFetcher;
    private Portfolio.Fetcher portfolioFetcher;
    private UUID id;
    private UnknownLinkException boom;

    @BeforeEach
    void saveFetchers() {
        transactionFetcher = Transaction.getFetcher();
        securityFetcher = Security.getFetcher();
        portfolioFetcher = Portfolio.getFetcher();
        LinkCache.TRANSACTION.clear();
        id = UUID.randomUUID();
        boom = new UnknownLinkException(id);
        Transaction.setFetcher((uuid, asOf) -> {
            if (uuid.equals(id)) throw boom;
            return null;
        });
    }

    @AfterEach
    void restoreFetchers() {
        Transaction.setFetcher(transactionFetcher);
        Security.setFetcher(securityFetcher);
        Portfolio.setFetcher(portfolioFetcher);
        LinkCache.TRANSACTION.clear();
    }

    private static TransactionProto link(UUID id) {
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setIsLink(true)
                .build();
    }

    static Stream<Named<Function<Transaction, Object>>> guardedReads() {
        return Stream.of(
                Named.of("getPortfolio", Transaction::getPortfolio),
                Named.of("getSecurity", Transaction::getSecurity),
                Named.of("getStrategyAllocation", Transaction::getStrategyAllocation),
                Named.of("getPrice", Transaction::getPrice),
                Named.of("getSettlementDate", Transaction::getSettlementDate),
                Named.of("getQuantity", Transaction::getQuantity),
                Named.of("getDirectedQuantity", Transaction::getDirectedQuantity),
                Named.of("getTradeDate", Transaction::getTradeDate),
                Named.of("getTransactionType", Transaction::getTransactionType),
                Named.of("isCancelled", Transaction::isCancelled),
                Named.of("getTradeName", Transaction::getTradeName),
                Named.of("getPositionStatus", Transaction::getPositionStatus),
                Named.of("getField(SECURITY_ID)", t -> t.getField(Field.SECURITY_ID)),
                Named.of("getField(TRADE_DATE)", t -> t.getField(Field.TRADE_DATE)),
                Named.of("isMatch(TRADE_DATE)", t -> t.isMatch(PositionFilter.from(Field.TRADE_DATE,
                        PositionFilter.Operator.EQUALS, LocalDate.of(2026, 11, 6)))),
                Named.of("getMeasure(DIRECTED_QUANTITY)", t -> t.getMeasure(Measure.DIRECTED_QUANTITY)));
    }

    @ParameterizedTest
    @MethodSource("guardedReads")
    void firstRead_rethrowsTheFetchersException(Function<Transaction, Object> read) {
        Transaction t = assertDoesNotThrow(() -> new Transaction(link(id)));
        assertTrue(t.isLink());

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> read.apply(t));
        assertSame(boom, thrown);
    }

    @Test
    void repeatRead_rethrowsTheSameInstanceEachTime() {
        Transaction t = new Transaction(link(id));

        assertSame(boom, assertThrows(RuntimeException.class, t::getTradeDate));
        assertSame(boom, assertThrows(RuntimeException.class, t::getTradeDate));
    }

    @Test
    void unknownChildLink_parentBuilds_childRethrows() {
        TransactionProto parentProto = TransactionGoldenFixtures.buy().getProto().toBuilder()
                .clearChildTransactions()
                .addChildTransactions(link(id))
                .build();

        Transaction parent = assertDoesNotThrow(() -> new Transaction(parentProto));
        assertEquals(TransactionGoldenFixtures.TRADE_DATE, parent.getTradeDate());

        Transaction child = parent.getChildTransactions().get(0);
        assertTrue(child.isLink());
        assertSame(boom, assertThrows(RuntimeException.class, child::getQuantity));
    }

    @Test
    void errorLink_getProtoAndToString_doNotThrow() {
        TransactionProto proto = link(id);
        Transaction t = new Transaction(proto);

        assertEquals(proto, assertDoesNotThrow(t::getProto));
        assertEquals("Link[Transaction:" + id + "]", assertDoesNotThrow(t::toString));
    }

    @Test
    void fetcherReturnsNull_stillIllegalState() {
        Transaction.setFetcher((uuid, asOf) -> null);
        Transaction t = new Transaction(link(id));

        assertTrue(t.isLink());
        IllegalStateException e = assertThrows(IllegalStateException.class, t::getTradeDate);
        assertTrue(e.getMessage().startsWith("Cannot read fields on link-mode Transaction uuid=" + id));
    }

    @Test
    void noFetcher_stillIllegalState() {
        Transaction.setFetcher(null);
        Transaction t = new Transaction(link(id));

        assertTrue(t.isLink());
        IllegalStateException e = assertThrows(IllegalStateException.class, t::getTradeDate);
        assertTrue(e.getMessage().startsWith("Cannot read fields on link-mode Transaction uuid=" + id));
    }

    @Test
    void portfolioFetcherThrows_portfolioStaysALink() {
        UUID portfolioId = UUID.randomUUID();
        TransactionProto record = TransactionGoldenFixtures.buy().getProto().toBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setPortfolio(PortfolioProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(portfolioId))
                        .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                        .setIsLink(true))
                .build();
        Transaction.setFetcher((uuid, asOf) -> uuid.equals(id) ? record : null);
        Portfolio.setFetcher((uuid, asOf) -> {
            throw new UnknownLinkException(uuid);
        });

        Transaction t = assertDoesNotThrow(() -> new Transaction(link(id)));

        assertFalse(t.isLink());
        assertEquals(TransactionGoldenFixtures.TRADE_DATE, t.getTradeDate());
        Portfolio portfolio = assertDoesNotThrow(t::getPortfolio);
        assertTrue(portfolio.isLink());
        assertEquals(portfolioId, portfolio.getID());
    }
}
