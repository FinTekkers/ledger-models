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

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Performance-regression guard for the Transaction wrapper's lazy-hydrate
 * read path (pre-warmed cache hit).
 *
 * <p>Baseline measured on a Mac Mini M-series: ~1.06 µs/op at N=10000 in
 * steady state (post-JIT). Default ceiling is the baseline + 15% headroom.
 *
 * <p>Override via {@code -DLAZY_HYDRATE_PERF_CEILING_US=<float>} on slower
 * CI hardware (or {@code LAZY_HYDRATE_PERF_CEILING_US} env var). Trade-off
 * documented in the perf bench commit: this is a wrapper-overhead guard,
 * not an end-to-end gRPC / DB latency guard.
 */
class LazyHydratePerfGuard {

    private static final int N = 10_000;
    private static final double DEFAULT_CEILING_US = 1.22; // 1.06 * 1.15

    @Test
    void per_op_stays_within_15pct_of_baseline_at_n_10000() {
        double ceilingUs = readCeiling();

        // Warmup: same loop, discard timing. Lets the JIT compile getTradeName /
        // ensureHydrated / LinkCache.get before we measure.
        runOnce();
        // Measure
        double perOpUs = runOnce();

        System.out.printf(
                "LazyHydratePerfGuard: N=%d  per_op=%.2f us  ceiling=%.2f us%n",
                N, perOpUs, ceilingUs);

        assertTrue(perOpUs <= ceilingUs,
                String.format(
                        "Transaction lazy-hydrate per-op (%.2f us) exceeded ceiling (%.2f us). "
                        + "Either a regression or noisy hardware; override via "
                        + "-DLAZY_HYDRATE_PERF_CEILING_US=<float> if running on slow CI.",
                        perOpUs, ceilingUs));
    }

    /** Build N link/resolved pairs, prime the cache, run the hot loop, return per-op µs. */
    private static double runOnce() {
        ZonedDateTime asOf = ZonedDateTime.now().withNano(0);
        LocalTimestampProto asOfProto = ProtoSerializationUtil.serializeTimestamp(asOf);

        List<UUID> txnUuids = new ArrayList<>(N);
        List<UUID> portUuids = new ArrayList<>(N);
        List<TransactionProto> linkProtos = new ArrayList<>(N);

        for (int i = 0; i < N; i++) {
            UUID txnUuid = UUID.randomUUID();
            UUID portUuid = UUID.randomUUID();
            txnUuids.add(txnUuid);
            portUuids.add(portUuid);

            UUIDProto txnUuidProto = ProtoSerializationUtil.serializeUUID(txnUuid);
            UUIDProto portUuidProto = ProtoSerializationUtil.serializeUUID(portUuid);

            PortfolioProto resolvedPort = PortfolioProto.newBuilder()
                    .setUuid(portUuidProto).setAsOf(asOfProto).setIsLink(false)
                    .setPortfolioName("P-" + portUuid.toString().substring(0, 8)).build();
            TransactionProto resolved = TransactionProto.newBuilder()
                    .setUuid(txnUuidProto).setAsOf(asOfProto).setIsLink(false)
                    .setTradeName("T-" + txnUuid.toString().substring(0, 8))
                    .setPortfolio(resolvedPort).build();
            LinkCache.TRANSACTION.put(txnUuid, resolved, asOf);
            LinkCache.PORTFOLIO.put(portUuid, resolvedPort, asOf);

            linkProtos.add(TransactionProto.newBuilder()
                    .setUuid(txnUuidProto).setAsOf(asOfProto).setIsLink(true).build());
        }

        System.gc();
        long t0 = System.nanoTime();
        int sink = 0;
        for (TransactionProto link : linkProtos) {
            Transaction txn = new Transaction(link);
            String name = txn.getTradeName();
            if (name != null && !name.isEmpty()) sink++;
        }
        long t1 = System.nanoTime();
        // Sink the read so the JIT can't elide the work.
        if (sink < 0) throw new AssertionError();

        for (UUID u : txnUuids) LinkCache.TRANSACTION.evict(u);
        for (UUID u : portUuids) LinkCache.PORTFOLIO.evict(u);

        return ((double) (t1 - t0) / N) / 1_000.0;
    }

    private static double readCeiling() {
        String fromProp = System.getProperty("LAZY_HYDRATE_PERF_CEILING_US");
        String fromEnv = System.getenv("LAZY_HYDRATE_PERF_CEILING_US");
        String raw = fromProp != null ? fromProp : fromEnv;
        if (raw == null) return DEFAULT_CEILING_US;
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return DEFAULT_CEILING_US;
        }
    }
}
