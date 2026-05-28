package common.util;

import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Process-wide cache for proto bodies backing link-mode wrappers. Single
 * slot per UUID with asOf-validating reads, bounded LRU eviction, and
 * per-entity TTL bounds on null-asOf reads.
 *
 * <p><b>Read semantics</b> ({@link #get(UUID, ZonedDateTime)}):
 * <ul>
 *   <li>{@code requestedAsOf == null} ("latest acceptable") — cache hit
 *       allowed; subject to {@code ttlForLatest} to bound cross-process
 *       staleness this process can't observe (e.g. another process wrote
 *       a new version after we cached the prior one). Past TTL ⇒ miss.</li>
 *   <li>{@code requestedAsOf != null} (bitemporal-precise) — cache hit only
 *       when the cached entry's asOf equals the requested. No TTL — history
 *       doesn't change, so a past vintage cached arbitrarily long is fine.</li>
 * </ul>
 *
 * <p><b>Write semantics</b> ({@link #put(UUID, Object, ZonedDateTime)}):
 * newest-vintage wins. An older-vintage put does not evict a newer cached
 * entry — that preserves the cache's "newest known" invariant for
 * {@code requestedAsOf == null} reads.
 *
 * <p><b>Eviction:</b> bounded LRU. When {@code put} causes the map to
 * exceed its cap, the least-recently-used entry is removed. {@code get}
 * bumps recency.
 *
 * <p>Static singletons {@link #SECURITY}, {@link #PORTFOLIO}, {@link #PRICE},
 * {@link #TRANSACTION} are the process-wide caches for each entity type,
 * each constructed with TTL + cap matching its typical access pattern
 * (Portfolio + Security change slowly so TTL is 1 day; Price + Transaction
 * change quickly so TTL is short). Tests can create scoped instances via
 * the public constructor.
 *
 * <p>See {@code docs/adr/lazy-link-hydration.md} for the design rationale.
 */
public final class LinkCache<V> {

    /** Default TTL for null-asOf reads when no entity-specific value is provided. */
    public static final Duration DEFAULT_TTL_FOR_LATEST = Duration.ofSeconds(600);

    /** Default max entries when no entity-specific cap is provided. */
    public static final int DEFAULT_MAX_ENTRIES = 10_000;

    // Per-entity singletons. Tuned for the access pattern of each entity
    // type; production callers should use these and not the no-arg ctor.
    public static final LinkCache<SecurityProto>    SECURITY    =
            new LinkCache<>(Duration.ofDays(1), 100_000);
    public static final LinkCache<PortfolioProto>   PORTFOLIO   =
            new LinkCache<>(Duration.ofDays(1), 10_000);
    public static final LinkCache<PriceProto>       PRICE       =
            new LinkCache<>(Duration.ofSeconds(30), 200_000);
    public static final LinkCache<TransactionProto> TRANSACTION =
            new LinkCache<>(Duration.ofMinutes(1), 100_000);

    private final Duration ttlForLatest;
    private final int maxEntries;
    // accessOrder=true so .get() bumps recency; removeEldestEntry caps the
    // size automatically on .put(). Synchronized on this instance — simple
    // and correct; perf is good enough for the typical lazy-hydrate access
    // pattern (mostly reads, low contention).
    private final LinkedHashMap<UUID, CacheEntry<V>> map;

    public LinkCache() {
        this(DEFAULT_TTL_FOR_LATEST, DEFAULT_MAX_ENTRIES);
    }

    public LinkCache(Duration ttlForLatest) {
        this(ttlForLatest, DEFAULT_MAX_ENTRIES);
    }

    public LinkCache(Duration ttlForLatest, int maxEntries) {
        if (ttlForLatest == null || ttlForLatest.isNegative()) {
            throw new IllegalArgumentException(
                "ttlForLatest must be non-null and non-negative; got " + ttlForLatest);
        }
        if (maxEntries <= 0) {
            throw new IllegalArgumentException(
                "maxEntries must be > 0; got " + maxEntries);
        }
        this.ttlForLatest = ttlForLatest;
        this.maxEntries = maxEntries;
        this.map = new LinkedHashMap<>(16, 0.75f, /* accessOrder = */ true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<UUID, CacheEntry<V>> eldest) {
                return size() > LinkCache.this.maxEntries;
            }
        };
    }

    /**
     * @param id            the entity uuid
     * @param requestedAsOf null = "latest acceptable" (TTL-bounded);
     *                      non-null = exact-vintage match required (no TTL)
     * @return the cached value if the lookup is a hit per the read semantics
     *         above; otherwise null (caller must refetch)
     */
    public synchronized V get(UUID id, ZonedDateTime requestedAsOf) {
        CacheEntry<V> entry = map.get(id);
        if (entry == null) return null;
        if (requestedAsOf == null) {
            if (Duration.between(entry.cachedAt, Instant.now()).compareTo(ttlForLatest) > 0) {
                return null;
            }
            return entry.value;
        }
        if (entry.asOf == null) return null;
        return entry.asOf.equals(requestedAsOf) ? entry.value : null;
    }

    /**
     * Newest-wins write: if a cached entry for {@code id} already exists with
     * an asOf strictly after {@code asOf}, the incoming write is ignored
     * (but recency is still bumped — the caller saw the entry).
     */
    public synchronized void put(UUID id, V value, ZonedDateTime asOf) {
        if (id == null || value == null) {
            throw new IllegalArgumentException(
                "id / value must be non-null; got id=" + id +
                " value=" + (value == null ? "null" : "<non-null>"));
        }
        CacheEntry<V> existing = map.get(id);
        if (existing != null && existing.asOf != null && asOf != null && existing.asOf.isAfter(asOf)) {
            // Recency bump only — older vintage doesn't displace newer cached entry.
            return;
        }
        map.put(id, new CacheEntry<>(value, asOf, Instant.now()));
    }

    public synchronized void evict(UUID id) {
        map.remove(id);
    }

    public synchronized void clear() {
        map.clear();
    }

    public synchronized int size() {
        return map.size();
    }

    record CacheEntry<V>(V value, ZonedDateTime asOf, Instant cachedAt) {}
}
