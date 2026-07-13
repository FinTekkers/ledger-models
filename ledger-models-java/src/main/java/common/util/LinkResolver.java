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

    /**
     * Hydrate the embedded security on each Transaction <b>and on every
     * descendant {@code child_transactions[i].security}</b>, recursively.
     *
     * <p>Children carry their own {@code security} sub-proto. After
     * {@code Transaction.getProto()} applies strip-on-write (Phase 2 #340)
     * <em>every</em> nested security in the tree is rewritten to a link
     * reference — top-level, the BUY's cash-impact WITHDRAWAL leg, the
     * derived MATURATION, the MATURATION's DEPOSIT leg, all of it. The
     * previous top-level-only resolver missed children, so a consumer
     * reading {@code child.getSecurity()} got
     * {@code Security.fromProto(linkProto)} → base {@code Security}, which
     * blew up downstream casts (e.g. {@code TaxLotCalculator.java:61}'s
     * {@code (BondSecurity) txn.getSecurity()} on the MATURATION child —
     * second-brain#348).
     *
     * <p>Two-phase implementation: first walk the whole forest (top-level +
     * every child) collecting link-mode SecurityProto sub-messages, bucket
     * by {@code as_of} and fire one batched {@code GetByIds} per bucket
     * (same dedup contract as the top-level path); then rewrite each
     * Transaction recursively, swapping in the resolved proto wherever a
     * link was previously sitting. Wrappers whose embedded security is
     * already a full proto pass through unchanged.
     */
    public List<TransactionProto> resolveSecuritiesOnTransactions(List<TransactionProto> txns) {
        // Phase 1: cache-warm every link-mode security in the forest.
        List<SecurityProto> allSecurityLinks = new ArrayList<>();
        for (TransactionProto t : txns) {
            collectLinkSecurities(t, allSecurityLinks);
        }
        ensureSecurityLinksCached(allSecurityLinks);

        // Phase 2: rebuild each tree, swapping link-mode → resolved.
        List<TransactionProto> out = new ArrayList<>(txns.size());
        for (TransactionProto t : txns) {
            out.add(rewriteSecuritiesRecursive(t));
        }
        return out;
    }

    /**
     * Hydrate the embedded portfolio on each Transaction <b>and on every
     * descendant {@code child_transactions[i].portfolio}</b>, recursively.
     * Same shape and rationale as
     * {@link #resolveSecuritiesOnTransactions(List)}; the cash-leg and
     * MATURATION children all carry their own portfolio sub-proto and the
     * strip-on-write pass turns them all into links.
     */
    public List<TransactionProto> resolvePortfoliosOnTransactions(List<TransactionProto> txns) {
        List<PortfolioProto> allPortfolioLinks = new ArrayList<>();
        for (TransactionProto t : txns) {
            collectLinkPortfolios(t, allPortfolioLinks);
        }
        ensurePortfolioLinksCached(allPortfolioLinks);

        List<TransactionProto> out = new ArrayList<>(txns.size());
        for (TransactionProto t : txns) {
            out.add(rewritePortfoliosRecursive(t));
        }
        return out;
    }

    // ---------- recursion helpers (second-brain#348) ----------

    private static void collectLinkSecurities(TransactionProto t, List<SecurityProto> sink) {
        if (t.hasSecurity() && t.getSecurity().getIsLink()) {
            sink.add(t.getSecurity());
        }
        for (TransactionProto child : t.getChildTransactionsList()) {
            collectLinkSecurities(child, sink);
        }
    }

    private static void collectLinkPortfolios(TransactionProto t, List<PortfolioProto> sink) {
        if (t.hasPortfolio() && t.getPortfolio().getIsLink()) {
            sink.add(t.getPortfolio());
        }
        for (TransactionProto child : t.getChildTransactionsList()) {
            collectLinkPortfolios(child, sink);
        }
    }

    /**
     * Returns a TransactionProto with every link-mode {@code security}
     * (top-level + every descendant) swapped for the resolved version
     * sitting in {@link LinkCache#SECURITY}. Returns the input unchanged
     * (reference-equal) if nothing in the tree needed rewriting — lets the
     * caller's per-element identity check work.
     */
    private TransactionProto rewriteSecuritiesRecursive(TransactionProto t) {
        boolean anyChildRewritten = false;
        List<TransactionProto> rewrittenChildren = null;
        for (int i = 0; i < t.getChildTransactionsCount(); i++) {
            TransactionProto child = t.getChildTransactions(i);
            TransactionProto newChild = rewriteSecuritiesRecursive(child);
            if (newChild != child) {
                if (rewrittenChildren == null) {
                    rewrittenChildren = new ArrayList<>(t.getChildTransactionsList());
                }
                rewrittenChildren.set(i, newChild);
                anyChildRewritten = true;
            }
        }

        SecurityProto resolvedTop = null;
        if (t.hasSecurity() && t.getSecurity().getIsLink()) {
            resolvedTop = lookupResolvedSecurity(t.getSecurity());
        }

        if (resolvedTop == null && !anyChildRewritten) {
            return t;
        }

        TransactionProto.Builder b = t.toBuilder();
        if (resolvedTop != null) {
            b.setSecurity(resolvedTop);
        }
        if (anyChildRewritten) {
            b.clearChildTransactions();
            for (TransactionProto c : rewrittenChildren) {
                b.addChildTransactions(c);
            }
        }
        return b.build();
    }

    private TransactionProto rewritePortfoliosRecursive(TransactionProto t) {
        boolean anyChildRewritten = false;
        List<TransactionProto> rewrittenChildren = null;
        for (int i = 0; i < t.getChildTransactionsCount(); i++) {
            TransactionProto child = t.getChildTransactions(i);
            TransactionProto newChild = rewritePortfoliosRecursive(child);
            if (newChild != child) {
                if (rewrittenChildren == null) {
                    rewrittenChildren = new ArrayList<>(t.getChildTransactionsList());
                }
                rewrittenChildren.set(i, newChild);
                anyChildRewritten = true;
            }
        }

        PortfolioProto resolvedTop = null;
        if (t.hasPortfolio() && t.getPortfolio().getIsLink()) {
            resolvedTop = lookupResolvedPortfolio(t.getPortfolio());
        }

        if (resolvedTop == null && !anyChildRewritten) {
            return t;
        }

        TransactionProto.Builder b = t.toBuilder();
        if (resolvedTop != null) {
            b.setPortfolio(resolvedTop);
        }
        if (anyChildRewritten) {
            b.clearChildTransactions();
            for (TransactionProto c : rewrittenChildren) {
                b.addChildTransactions(c);
            }
        }
        return b.build();
    }

    // ---------- internals ----------

    /** Walk items, group link UUIDs by as_of, fire one batched GetByIds per
     * bucket, populate {@link LinkCache#SECURITY}. Used by the
     * Price → Security path; the Transaction path
     * collects directly into a {@link SecurityProto} list (which lets it
     * cover {@code child_transactions[i].security} too — second-brain#348) and
     * calls {@link #ensureSecurityLinksCached(Collection)}. */
    private <T> void ensureSecuritiesCached(
            List<T> items,
            java.util.function.Predicate<T> hasSec,
            java.util.function.Function<T, SecurityProto> getSec) {
        List<SecurityProto> links = new ArrayList<>(items.size());
        for (T item : items) {
            if (!hasSec.test(item)) continue;
            SecurityProto sec = getSec.apply(item);
            if (sec.getIsLink()) links.add(sec);
        }
        ensureSecurityLinksCached(links);
    }

    /** Bucket the given link-mode SecurityProtos by as_of, fire one batched
     * GetByIds per bucket, populate {@link LinkCache#SECURITY}. Items that
     * are already cached for a (uuid, as_of) are skipped. */
    private void ensureSecurityLinksCached(Collection<SecurityProto> links) {
        // bucketKey -> uuid -> uuid (deduped) for that as_of
        Map<String, Map<UUID, UUID>> buckets = new HashMap<>();
        Map<String, LocalTimestampProto> bucketAsOfs = new HashMap<>();
        for (SecurityProto sec : links) {
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

    /** Portfolio counterpart to {@link #ensureSecurityLinksCached(Collection)}. */
    private void ensurePortfolioLinksCached(Collection<PortfolioProto> links) {
        Map<String, Map<UUID, UUID>> buckets = new HashMap<>();
        Map<String, LocalTimestampProto> bucketAsOfs = new HashMap<>();
        for (PortfolioProto port : links) {
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
