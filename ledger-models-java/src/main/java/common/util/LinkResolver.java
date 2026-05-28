package common.util;

import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.models.price.PriceProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.services.portfolio_service.PortfolioGrpc;
import fintekkers.services.security_service.SecurityGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * LinkResolver — bulk hydration of {@code is_link=true} entity references
 * into full entities. Java parity for the JS / Python implementations
 * shipped in #181 / #183. Implements the consumer side of the {@code is_link}
 * pattern documented in {@code docs/adr/is_link_pattern.md} (and the
 * technical-details addendum that codifies the (uuid, as_of) cache key +
 * per-bucket batching contract).
 *
 * <p><b>W4: the resolver no longer owns its own LRU.</b> Cache reads/writes
 * route through the process-wide {@link LinkCache#SECURITY} / {@link
 * LinkCache#PORTFOLIO} singletons. The resolver still does
 * concurrent-call dedup (single in-flight RPC per (uuid, as_of)) and bulk
 * per-bucket batching; storage and eviction live in LinkCache.
 *
 * <p>Surface:
 * <ul>
 *   <li>{@link #getSecurity(UUID)} / {@link #getSecurity(UUID, LocalTimestampProto)}
 *       and the portfolio counterparts — single-UUID resolution, cached and
 *       concurrent-deduped on (uuid, as_of).</li>
 *   <li>{@link #resolveSecuritiesOnPrices(List)},
 *       {@link #resolveSecuritiesOnTransactions(List)},
 *       {@link #resolvePortfoliosOnTransactions(List)} — bulk hydrate. Java
 *       protobuf messages are immutable, so these return a NEW list with
 *       hydrated copies; the input list is not mutated. Items whose embedded
 *       sub-message is already a full entity pass through unchanged.</li>
 * </ul>
 *
 * <p>Test injection: pass {@link SecurityFetcher} / {@link PortfolioFetcher}
 * implementations into the constructor to mock the gRPC layer in unit tests.
 * Production callers leave them null and the resolver builds blocking stubs
 * against the configured endpoint.
 */
public class LinkResolver {

    /** Functional-interface seam for testability. The default impl wraps
     * {@code SecurityBlockingStub.getByIds}; tests inject a fake. */
    @FunctionalInterface
    public interface SecurityFetcher {
        QuerySecurityResponseProto getByIds(QuerySecurityRequestProto request);
    }

    @FunctionalInterface
    public interface PortfolioFetcher {
        QueryPortfolioResponseProto getByIds(QueryPortfolioRequestProto request);
    }

    private static final String LATEST_BUCKET = "latest";

    private final SecurityFetcher securityFetcher;
    private final PortfolioFetcher portfolioFetcher;

    private final ConcurrentHashMap<String, CompletableFuture<SecurityProto>> securityInFlight
            = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<PortfolioProto>> portfolioInFlight
            = new ConcurrentHashMap<>();

    /** Default constructor: blocking stubs against the configured endpoint. */
    public LinkResolver(String url, int port, boolean isHttp) {
        this(buildSecurityFetcher(url, port, isHttp),
             buildPortfolioFetcher(url, port, isHttp));
    }

    /** Test / advanced constructor.
     *
     * @param securityFetcher  inject a fake here in tests
     * @param portfolioFetcher inject a fake here in tests
     */
    public LinkResolver(SecurityFetcher securityFetcher,
                        PortfolioFetcher portfolioFetcher) {
        this.securityFetcher = securityFetcher;
        this.portfolioFetcher = portfolioFetcher;
    }

    private static SecurityFetcher buildSecurityFetcher(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        SecurityGrpc.SecurityBlockingStub stub = SecurityGrpc.newBlockingStub(channel);
        return stub::getByIds;
    }

    private static PortfolioFetcher buildPortfolioFetcher(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if (isHttp) builder.usePlaintext();
        ManagedChannel channel = builder.build();
        PortfolioGrpc.PortfolioBlockingStub stub = PortfolioGrpc.newBlockingStub(channel);
        return stub::getByIds;
    }

    // ---------- single-UUID accessors ----------

    public SecurityProto getSecurity(UUID uuid) {
        return getSecurity(uuid, null);
    }

    public SecurityProto getSecurity(UUID uuid, LocalTimestampProto asOf) {
        ZonedDateTime asOfZ = toZdt(asOf);
        SecurityProto cached = LinkCache.SECURITY.get(uuid, asOfZ);
        if (cached != null) return cached;

        String key = cacheKey(uuid, asOf);
        // Concurrent-call dedup: putIfAbsent decides who gets to do the fetch.
        CompletableFuture<SecurityProto> existing = securityInFlight.get(key);
        if (existing != null) return joinUnchecked(existing);

        CompletableFuture<SecurityProto> created = new CompletableFuture<>();
        CompletableFuture<SecurityProto> winner = securityInFlight.putIfAbsent(key, created);
        if (winner != null) return joinUnchecked(winner);

        try {
            List<SecurityProto> protos = batchFetchSecurities(List.of(uuid), asOf);
            if (protos.isEmpty()) {
                IllegalStateException e = new IllegalStateException(
                        "Security not found: " + key);
                created.completeExceptionally(e);
                throw e;
            }
            SecurityProto proto = protos.get(0);
            LinkCache.SECURITY.put(uuid, proto, asOfZ);
            created.complete(proto);
            return proto;
        } finally {
            securityInFlight.remove(key);
        }
    }

    public PortfolioProto getPortfolio(UUID uuid) {
        return getPortfolio(uuid, null);
    }

    public PortfolioProto getPortfolio(UUID uuid, LocalTimestampProto asOf) {
        ZonedDateTime asOfZ = toZdt(asOf);
        PortfolioProto cached = LinkCache.PORTFOLIO.get(uuid, asOfZ);
        if (cached != null) return cached;

        String key = cacheKey(uuid, asOf);
        CompletableFuture<PortfolioProto> existing = portfolioInFlight.get(key);
        if (existing != null) return joinUnchecked(existing);

        CompletableFuture<PortfolioProto> created = new CompletableFuture<>();
        CompletableFuture<PortfolioProto> winner = portfolioInFlight.putIfAbsent(key, created);
        if (winner != null) return joinUnchecked(winner);

        try {
            List<PortfolioProto> protos = batchFetchPortfolios(List.of(uuid), asOf);
            if (protos.isEmpty()) {
                IllegalStateException e = new IllegalStateException(
                        "Portfolio not found: " + key);
                created.completeExceptionally(e);
                throw e;
            }
            PortfolioProto proto = protos.get(0);
            LinkCache.PORTFOLIO.put(uuid, proto, asOfZ);
            created.complete(proto);
            return proto;
        } finally {
            portfolioInFlight.remove(key);
        }
    }

    // ---------- bulk accessors ----------

    /** Hydrate the embedded security on each Price. Returns a NEW list —
     * Java protobufs are immutable so we can't mutate in place; PriceProto.toBuilder()
     * is used to swap the security sub-message and rebuild. Items whose embedded
     * security is not a link, or which have no security set, pass through unchanged. */
    public List<PriceProto> resolveSecuritiesOnPrices(List<PriceProto> prices) {
        ensureSecuritiesCached(prices, PriceProto::hasSecurity, PriceProto::getSecurity);
        List<PriceProto> out = new ArrayList<>(prices.size());
        for (PriceProto p : prices) {
            if (!p.hasSecurity() || !p.getSecurity().getIsLink()) {
                out.add(p);
                continue;
            }
            SecurityProto resolved = lookupResolvedSecurity(p.getSecurity());
            if (resolved == null) {
                out.add(p);
            } else {
                out.add(p.toBuilder().setSecurity(resolved).build());
            }
        }
        return out;
    }

    /** Same shape as resolveSecuritiesOnPrices, for embedded security on Transaction. */
    public List<TransactionProto> resolveSecuritiesOnTransactions(List<TransactionProto> txns) {
        ensureSecuritiesCached(txns, TransactionProto::hasSecurity, TransactionProto::getSecurity);
        List<TransactionProto> out = new ArrayList<>(txns.size());
        for (TransactionProto t : txns) {
            if (!t.hasSecurity() || !t.getSecurity().getIsLink()) {
                out.add(t);
                continue;
            }
            SecurityProto resolved = lookupResolvedSecurity(t.getSecurity());
            if (resolved == null) {
                out.add(t);
            } else {
                out.add(t.toBuilder().setSecurity(resolved).build());
            }
        }
        return out;
    }

    /** Hydrate the embedded portfolio on each Transaction. */
    public List<TransactionProto> resolvePortfoliosOnTransactions(List<TransactionProto> txns) {
        ensurePortfoliosCached(txns);
        List<TransactionProto> out = new ArrayList<>(txns.size());
        for (TransactionProto t : txns) {
            if (!t.hasPortfolio() || !t.getPortfolio().getIsLink()) {
                out.add(t);
                continue;
            }
            PortfolioProto resolved = lookupResolvedPortfolio(t.getPortfolio());
            if (resolved == null) {
                out.add(t);
            } else {
                out.add(t.toBuilder().setPortfolio(resolved).build());
            }
        }
        return out;
    }

    // ---------- internals ----------

    /** Walk items, group link UUIDs by as_of, fire one batched GetByIds per
     * bucket, populate {@link LinkCache#SECURITY}. */
    private <T> void ensureSecuritiesCached(
            List<T> items,
            java.util.function.Predicate<T> hasSec,
            java.util.function.Function<T, SecurityProto> getSec) {
        // bucketKey -> uuid -> uuid (deduped) for that as_of
        Map<String, Map<UUID, UUID>> buckets = new HashMap<>();
        Map<String, LocalTimestampProto> bucketAsOfs = new HashMap<>();
        for (T item : items) {
            if (!hasSec.test(item)) continue;
            SecurityProto sec = getSec.apply(item);
            if (!sec.getIsLink()) continue;
            UUID uuid = ProtoSerializationUtil.deserializeUUID(sec.getUuid());
            LocalTimestampProto asOf = sec.hasAsOf() ? sec.getAsOf() : null;
            if (LinkCache.SECURITY.get(uuid, toZdt(asOf)) != null) continue;
            String bucketKey = bucketKey(asOf);
            buckets.computeIfAbsent(bucketKey, k -> new HashMap<>()).putIfAbsent(uuid, uuid);
            bucketAsOfs.put(bucketKey, asOf);
        }
        for (Map.Entry<String, Map<UUID, UUID>> entry : buckets.entrySet()) {
            String bucketKey = entry.getKey();
            Collection<UUID> uuids = entry.getValue().values();
            LocalTimestampProto asOf = bucketAsOfs.get(bucketKey);
            ZonedDateTime asOfZ = toZdt(asOf);
            List<SecurityProto> fetched = batchFetchSecurities(uuids, asOf);
            for (SecurityProto p : fetched) {
                UUID u = ProtoSerializationUtil.deserializeUUID(p.getUuid());
                LinkCache.SECURITY.put(u, p, asOfZ);
            }
        }
    }

    /** Same as ensureSecuritiesCached but for Transaction.portfolio. */
    private void ensurePortfoliosCached(List<TransactionProto> items) {
        Map<String, Map<UUID, UUID>> buckets = new HashMap<>();
        Map<String, LocalTimestampProto> bucketAsOfs = new HashMap<>();
        for (TransactionProto t : items) {
            if (!t.hasPortfolio()) continue;
            PortfolioProto port = t.getPortfolio();
            if (!port.getIsLink()) continue;
            UUID uuid = ProtoSerializationUtil.deserializeUUID(port.getUuid());
            LocalTimestampProto asOf = port.hasAsOf() ? port.getAsOf() : null;
            if (LinkCache.PORTFOLIO.get(uuid, toZdt(asOf)) != null) continue;
            String bucketKey = bucketKey(asOf);
            buckets.computeIfAbsent(bucketKey, k -> new HashMap<>()).putIfAbsent(uuid, uuid);
            bucketAsOfs.put(bucketKey, asOf);
        }
        for (Map.Entry<String, Map<UUID, UUID>> entry : buckets.entrySet()) {
            String bucketKey = entry.getKey();
            Collection<UUID> uuids = entry.getValue().values();
            LocalTimestampProto asOf = bucketAsOfs.get(bucketKey);
            ZonedDateTime asOfZ = toZdt(asOf);
            List<PortfolioProto> fetched = batchFetchPortfolios(uuids, asOf);
            for (PortfolioProto p : fetched) {
                UUID u = ProtoSerializationUtil.deserializeUUID(p.getUuid());
                LinkCache.PORTFOLIO.put(u, p, asOfZ);
            }
        }
    }

    private SecurityProto lookupResolvedSecurity(SecurityProto link) {
        UUID uuid = ProtoSerializationUtil.deserializeUUID(link.getUuid());
        LocalTimestampProto asOf = link.hasAsOf() ? link.getAsOf() : null;
        return LinkCache.SECURITY.get(uuid, toZdt(asOf));
    }

    private PortfolioProto lookupResolvedPortfolio(PortfolioProto link) {
        UUID uuid = ProtoSerializationUtil.deserializeUUID(link.getUuid());
        LocalTimestampProto asOf = link.hasAsOf() ? link.getAsOf() : null;
        return LinkCache.PORTFOLIO.get(uuid, toZdt(asOf));
    }

    private List<SecurityProto> batchFetchSecurities(Collection<UUID> uuids, LocalTimestampProto asOf) {
        if (uuids.isEmpty()) return List.of();
        QuerySecurityRequestProto.Builder b = QuerySecurityRequestProto.newBuilder()
                .setObjectClass("SecurityRequest")
                .setVersion("0.0.1");
        for (UUID u : uuids) b.addUuIds(ProtoSerializationUtil.serializeUUID(u));
        if (asOf != null) b.setAsOf(asOf);
        QuerySecurityResponseProto response = securityFetcher.getByIds(b.build());
        return response.getSecurityResponseList();
    }

    private List<PortfolioProto> batchFetchPortfolios(Collection<UUID> uuids, LocalTimestampProto asOf) {
        if (uuids.isEmpty()) return List.of();
        QueryPortfolioRequestProto.Builder b = QueryPortfolioRequestProto.newBuilder()
                .setObjectClass("PortfolioRequest")
                .setVersion("0.0.1");
        for (UUID u : uuids) b.addUuIds(ProtoSerializationUtil.serializeUUID(u));
        if (asOf != null) b.setAsOf(asOf);
        QueryPortfolioResponseProto response = portfolioFetcher.getByIds(b.build());
        return response.getPortfolioResponseList();
    }

    private static String bucketKey(LocalTimestampProto asOf) {
        if (asOf == null) return LATEST_BUCKET;
        return Base64.getEncoder().encodeToString(asOf.toByteArray());
    }

    private static String cacheKey(UUID uuid, LocalTimestampProto asOf) {
        return uuid.toString() + "@" + bucketKey(asOf);
    }

    private static ZonedDateTime toZdt(LocalTimestampProto asOf) {
        return asOf == null ? null : ProtoSerializationUtil.deserializeTimestamp(asOf);
    }

    private static <T> T joinUnchecked(CompletableFuture<T> f) {
        try {
            return f.get();
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(ie);
        } catch (Exception e) {
            if (e.getCause() instanceof RuntimeException) throw (RuntimeException) e.getCause();
            throw new RuntimeException(e);
        }
    }

    /** Test/debug helper. Clears in-flight maps; the process-wide
     * {@link LinkCache} is left alone (tests that need to drop a specific
     * cached entry call {@code LinkCache.SECURITY.evict(uuid)} directly). */
    public void clearCache() {
        securityInFlight.clear();
        portfolioInFlight.clear();
    }
}
