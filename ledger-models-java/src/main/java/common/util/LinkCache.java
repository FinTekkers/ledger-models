package common.util;

import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Process-wide cache for proto bodies backing link-mode wrappers. Single
 * slot per UUID with asOf-validating reads.
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
 * <p>Static singletons {@link #SECURITY}, {@link #PORTFOLIO}, {@link #PRICE},
 * {@link #TRANSACTION} are the process-wide caches for each entity type.
 * Tests can create scoped instances via the public constructor.
 *
 * <p>See {@code docs/adr/lazy-link-hydration.md} for the design rationale.
 */
public final class LinkCache<V> {

    /**
     * Default TTL for null-asOf reads. Bounds cross-process staleness.
     *
     * <p>Later Portfolio can likely be 1 day, security 1 day, transaction
     * 1 minute, price 30 seconds — once per-entity TTLs are wired up, the
     * shared singletons below should be constructed with those values.
     */
    public static final Duration DEFAULT_TTL_FOR_LATEST = Duration.ofSeconds(600);

    public static final LinkCache<SecurityProto>    SECURITY    = new LinkCache<>();
    public static final LinkCache<PortfolioProto>   PORTFOLIO   = new LinkCache<>();
    public static final LinkCache<PriceProto>       PRICE       = new LinkCache<>();
    public static final LinkCache<TransactionProto> TRANSACTION = new LinkCache<>();

    private final ConcurrentMap<UUID, CacheEntry<V>> map = new ConcurrentHashMap<>();
    private final Duration ttlForLatest;

    public LinkCache() {
        this(DEFAULT_TTL_FOR_LATEST);
    }

    public LinkCache(Duration ttlForLatest) {
        if (ttlForLatest == null || ttlForLatest.isNegative()) {
            throw new IllegalArgumentException(
                "ttlForLatest must be non-null and non-negative; got " + ttlForLatest);
        }
        this.ttlForLatest = ttlForLatest;
    }

    /**
     * @param id            the entity uuid
     * @param requestedAsOf null = "latest acceptable" (TTL-bounded);
     *                      non-null = exact-vintage match required (no TTL)
     * @return the cached value if the lookup is a hit per the read semantics
     *         above; otherwise null (caller must refetch)
     */
    public V get(UUID id, ZonedDateTime requestedAsOf) {
        CacheEntry<V> entry = map.get(id);
        if (entry == null) return null;
        if (requestedAsOf == null) {
            // "Latest" — TTL applies.
            if (Duration.between(entry.cachedAt, Instant.now()).compareTo(ttlForLatest) > 0) {
                return null;
            }
            return entry.value;
        }
        // Bitemporal-precise — exact match or miss.
        return entry.asOf.equals(requestedAsOf) ? entry.value : null;
    }

    /**
     * Newest-wins write: if a cached entry for {@code id} already exists with
     * an asOf strictly after {@code asOf}, the incoming write is ignored.
     */
    public void put(UUID id, V value, ZonedDateTime asOf) {
        if (id == null || value == null || asOf == null) {
            throw new IllegalArgumentException(
                "id / value / asOf must all be non-null; got id=" + id +
                " value=" + (value == null ? "null" : "<non-null>") + " asOf=" + asOf);
        }
        CacheEntry<V> incoming = new CacheEntry<>(value, asOf, Instant.now());
        map.merge(id, incoming, (existing, in) ->
            existing.asOf.isAfter(in.asOf) ? existing : in);
    }

    public void evict(UUID id) {
        map.remove(id);
    }

    public void clear() {
        map.clear();
    }

    /** Test helper — count of live entries. */
    public int size() {
        return map.size();
    }

    /** Cache entry — proto value, its bitemporal asOf, and the wall-clock
     *  moment it was cached (drives the latest-read TTL bound). */
    record CacheEntry<V>(V value, ZonedDateTime asOf, Instant cachedAt) {}
}
