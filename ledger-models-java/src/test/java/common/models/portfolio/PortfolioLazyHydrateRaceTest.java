package common.models.portfolio;

import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
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

/**
 * Race-condition tests for {@link Portfolio} lazy hydration.
 *
 * <p>Targets the same shape as {@code SecurityLazyHydrateTest} — multi-thread
 * accessor reads on link-mode wrappers that share a UUID. The post-W4 contract
 * is:
 * <ol>
 *   <li>Threads serialize on {@code LinkCache} put/get (LinkCache is
 *       {@code synchronized}), so once one thread writes the resolved proto
 *       all subsequent readers hit the cache.</li>
 *   <li>The Fetcher may be called more than once across N concurrent first-
 *       readers — there is no per-key in-flight dedup on the wrapper itself.
 *       That's an acceptable trade-off; the cache puts converge on the
 *       newest-asOf-wins entry. (LinkResolver provides in-flight dedup for
 *       the batched-API path; wrapper accessors don't.)</li>
 *   <li>Every thread observes the resolved value with no exceptions.</li>
 * </ol>
 */
class PortfolioLazyHydrateRaceTest {

    private Portfolio.Fetcher savedFetcher;

    @BeforeEach
    void saveFetcher() {
        savedFetcher = Portfolio.getFetcher();
    }

    @AfterEach
    void restoreFetcher() {
        Portfolio.setFetcher(savedFetcher);
    }

    @Test
    void concurrent_accessor_reads_on_shared_uuid_all_succeed_and_observe_resolved_name() throws Exception {
        // 16 threads, each holds its own Portfolio wrapper built from the
        // same link-mode proto (same UUID). They all call getPortfolioName().
        // After a CountDownLatch sync, they race into ensureHydrated().
        // Expected: every thread sees "RESOLVED", no exceptions; LinkCache
        // contains exactly the resolved proto.
        UUID uuid = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now().withNano(0);
        LocalTimestampProto asOfProto = ProtoSerializationUtil.serializeTimestamp(asOf);
        UUIDProto uuidProto = ProtoSerializationUtil.serializeUUID(uuid);

        PortfolioProto resolved = PortfolioProto.newBuilder()
                .setObjectClass("Portfolio")
                .setVersion("0.0.1")
                .setUuid(uuidProto)
                .setAsOf(asOfProto)
                .setIsLink(false)
                .setPortfolioName("RESOLVED")
                .build();

        AtomicInteger fetcherCallCount = new AtomicInteger(0);
        Portfolio.setFetcher((id, ao) -> {
            fetcherCallCount.incrementAndGet();
            return resolved;
        });

        // Ensure cache is empty for this UUID — targeted, never .clear().
        LinkCache.PORTFOLIO.evict(uuid);

        int threads = 16;
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger seenResolved = new AtomicInteger(0);
        AtomicInteger errors = new AtomicInteger(0);

        PortfolioProto linkProto = PortfolioProto.newBuilder()
                .setUuid(uuidProto)
                .setAsOf(asOfProto)
                .setIsLink(true)
                .build();

        for (int t = 0; t < threads; t++) {
            new Thread(() -> {
                try {
                    Portfolio p = new Portfolio(linkProto);
                    start.await();
                    String name = p.getPortfolioName();
                    if ("RESOLVED".equals(name)) seenResolved.incrementAndGet();
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
                "every thread should observe the resolved portfolio_name");
        // Fetcher may have fired 1..N times (no wrapper-level in-flight
        // dedup); the cache state must end on the resolved entry regardless.
        PortfolioProto cached = LinkCache.PORTFOLIO.get(uuid, asOf);
        assertSame(resolved, cached, "LinkCache must hold the resolved proto");

        LinkCache.PORTFOLIO.evict(uuid);
    }
}
