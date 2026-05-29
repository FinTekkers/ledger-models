package bench;

import common.models.transaction.Transaction;
import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * End-to-end perf bench for Transaction wrapper lazy hydration. Build N
 * link-mode {@link TransactionProto}s, pre-warm {@link LinkCache#TRANSACTION}
 * + {@link LinkCache#PORTFOLIO}, then construct N wrappers and read accessors.
 *
 * <p>Run: {@code ./gradlew test --tests bench.LazyHydrateBench}. Output goes
 * to stdout; not an assertion-based test.
 */
class LazyHydrateBench {

    private static final int[] SIZES = {10, 100, 1_000, 10_000};

    @Test
    void bench_transaction_lazy_hydrate() {
        System.out.println("# java bench: lazy-hydrate Transaction via pre-warmed LinkCache");
        for (int n : SIZES) {
            runBench(n);
        }
    }

    private static void runBench(int n) {
        ZonedDateTime asOf = ZonedDateTime.now().withNano(0);
        LocalTimestampProto asOfProto = ProtoSerializationUtil.serializeTimestamp(asOf);

        List<UUID> txnUuids = new ArrayList<>(n);
        List<UUID> portUuids = new ArrayList<>(n);
        List<TransactionProto> linkProtos = new ArrayList<>(n);

        for (int i = 0; i < n; i++) {
            UUID txnUuid = UUID.randomUUID();
            UUID portUuid = UUID.randomUUID();
            txnUuids.add(txnUuid);
            portUuids.add(portUuid);

            UUIDProto txnUuidProto = ProtoSerializationUtil.serializeUUID(txnUuid);
            UUIDProto portUuidProto = ProtoSerializationUtil.serializeUUID(portUuid);

            PortfolioProto resolvedPortfolio = PortfolioProto.newBuilder()
                    .setUuid(portUuidProto)
                    .setAsOf(asOfProto)
                    .setIsLink(false)
                    .setPortfolioName("P-" + portUuid.toString().substring(0, 8))
                    .build();
            TransactionProto resolved = TransactionProto.newBuilder()
                    .setUuid(txnUuidProto)
                    .setAsOf(asOfProto)
                    .setIsLink(false)
                    .setTradeName("T-" + txnUuid.toString().substring(0, 8))
                    .setPortfolio(resolvedPortfolio)
                    .build();
            LinkCache.TRANSACTION.put(txnUuid, resolved, asOf);
            LinkCache.PORTFOLIO.put(portUuid, resolvedPortfolio, asOf);

            linkProtos.add(TransactionProto.newBuilder()
                    .setUuid(txnUuidProto)
                    .setAsOf(asOfProto)
                    .setIsLink(true)
                    .build());
        }

        System.gc();
        long heapBefore = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
        long t0 = System.nanoTime();
        int sink = 0;
        for (TransactionProto link : linkProtos) {
            Transaction txn = new Transaction(link);
            String name = txn.getTradeName();
            if (name != null && !name.isEmpty()) sink++;
        }
        long t1 = System.nanoTime();
        long heapAfter = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();

        double elapsedMs = (t1 - t0) / 1_000_000.0;
        double perOpUs = ((double) (t1 - t0) / n) / 1_000.0;
        double heapDeltaKb = (heapAfter - heapBefore) / 1024.0;

        System.out.printf(
                "N=%6d  elapsed=%9.2f ms  per_op=%8.2f us  heap_delta=%9.2f KiB  reads=%d%n",
                n, elapsedMs, perOpUs, heapDeltaKb, sink);

        for (UUID u : txnUuids) LinkCache.TRANSACTION.evict(u);
        for (UUID u : portUuids) LinkCache.PORTFOLIO.evict(u);
    }
}
