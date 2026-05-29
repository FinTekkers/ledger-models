package common.models.transaction;

import common.util.LinkCache;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

/** Concurrent-accessor race test for {@link Transaction}. Mirrors
 *  {@code PortfolioLazyHydrateRaceTest} — see that file for the contract. */
class TransactionLazyHydrateRaceTest {

    private Transaction.Fetcher savedFetcher;

    @BeforeEach
    void saveFetcher() {
        savedFetcher = Transaction.getFetcher();
    }

    @AfterEach
    void restoreFetcher() {
        Transaction.setFetcher(savedFetcher);
    }

    @Test
    void concurrent_accessor_reads_on_shared_uuid_all_succeed_and_observe_resolved_trade_name() throws Exception {
        UUID uuid = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now().withNano(0);
        LocalTimestampProto asOfProto = ProtoSerializationUtil.serializeTimestamp(asOf);
        UUIDProto uuidProto = ProtoSerializationUtil.serializeUUID(uuid);

        TransactionProto resolved = TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setVersion("0.0.1")
                .setUuid(uuidProto)
                .setAsOf(asOfProto)
                .setIsLink(false)
                .setTradeName("RESOLVED-TRADE")
                .build();

        AtomicInteger fetcherCallCount = new AtomicInteger(0);
        Transaction.setFetcher((id, ao) -> {
            fetcherCallCount.incrementAndGet();
            return resolved;
        });

        LinkCache.TRANSACTION.evict(uuid);

        int threads = 16;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger seenResolved = new AtomicInteger(0);
        AtomicInteger errors = new AtomicInteger(0);

        TransactionProto linkProto = TransactionProto.newBuilder()
                .setUuid(uuidProto)
                .setAsOf(asOfProto)
                .setIsLink(true)
                .build();

        for (int t = 0; t < threads; t++) {
            new Thread(() -> {
                try {
                    Transaction txn = new Transaction(linkProto);
                    start.await();
                    String name = txn.getTradeName();
                    if ("RESOLVED-TRADE".equals(name)) seenResolved.incrementAndGet();
                } catch (Throwable e) {
                    errors.incrementAndGet();
                } finally {
                    done.countDown();
                }
            }, "race-" + t).start();
        }
        start.countDown();
        done.await();

        assertEquals(0, errors.get(), "no thread should throw");
        assertEquals(threads, seenResolved.get(),
                "every thread should observe the resolved trade_name");
        TransactionProto cached = LinkCache.TRANSACTION.get(uuid, asOf);
        assertSame(resolved, cached, "LinkCache must hold the resolved proto");

        LinkCache.TRANSACTION.evict(uuid);
    }
}
