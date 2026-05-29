package common.util;

import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;

/** Tests for {@link LinkCache} — proves the read/write semantics from
 *  {@code docs/adr/lazy-link-hydration.md}: single-slot per UUID,
 *  asOf-validating reads, TTL-bounded null-asOf reads, newest-wins puts. */
class LinkCacheTest {

    private static SecurityProto secProto(UUID id, ZonedDateTime asOf) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .build();
    }

    // ---------- Basic miss/hit shape ----------

    @Test
    void get_onEmptyCache_returnsNull() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        assertNull(cache.get(UUID.randomUUID(), null));
        assertNull(cache.get(UUID.randomUUID(), ZonedDateTime.now()));
    }

    @Test
    void put_thenGet_withMatchingAsOf_returnsValue() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now().minusHours(1);
        SecurityProto value = secProto(id, asOf);

        cache.put(id, value, asOf);

        assertSame(value, cache.get(id, asOf));
    }

    // ---------- C.iii — null requestedAsOf within TTL ----------

    @Test
    void get_nullRequestedAsOf_withinTtl_returnsCachedValue() {
        LinkCache<SecurityProto> cache = new LinkCache<>(Duration.ofSeconds(60));
        UUID id = UUID.randomUUID();
        SecurityProto value = secProto(id, ZonedDateTime.now());
        cache.put(id, value, ZonedDateTime.now());

        // Immediately after put — well within the 60s TTL.
        assertSame(value, cache.get(id, null));
    }

    // ---------- C.iv — null requestedAsOf past TTL ----------

    @Test
    void get_nullRequestedAsOf_pastTtl_returnsNull() throws InterruptedException {
        LinkCache<SecurityProto> cache = new LinkCache<>(Duration.ofMillis(50));
        UUID id = UUID.randomUUID();
        cache.put(id, secProto(id, ZonedDateTime.now()), ZonedDateTime.now());

        Thread.sleep(100);   // exceed the 50ms TTL

        assertNull(cache.get(id, null),
            "Past TTL on a null-asOf read must return null (force refetch)");
    }

    // ---------- C.v — bitemporal-precise read never TTL-expires ----------

    @Test
    void get_nonNullAsOf_neverExpiresByTtl() throws InterruptedException {
        LinkCache<SecurityProto> cache = new LinkCache<>(Duration.ofMillis(50));
        UUID id = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now().minusYears(1);
        SecurityProto value = secProto(id, asOf);
        cache.put(id, value, asOf);

        Thread.sleep(100);

        assertSame(value, cache.get(id, asOf),
            "Bitemporal-precise reads must never TTL-expire — history doesn't change");
    }

    // ---------- C.vi — older-vintage put does NOT evict newer ----------

    @Test
    void put_olderVintage_doesNotEvictNewerCachedEntry() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        ZonedDateTime newer = ZonedDateTime.now();
        ZonedDateTime older = newer.minusDays(1);

        SecurityProto newerValue = secProto(id, newer);
        SecurityProto olderValue = secProto(id, older);
        cache.put(id, newerValue, newer);
        cache.put(id, olderValue, older);

        // Cache should still hold newerValue (the older put was ignored).
        assertSame(newerValue, cache.get(id, newer));
        assertNull(cache.get(id, older),
            "The older-vintage put was a no-op; querying for the older asOf must miss");
    }

    // ---------- C.vii — newer-vintage put overwrites older ----------

    @Test
    void put_newerVintage_overwritesOlderCachedEntry() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        ZonedDateTime older = ZonedDateTime.now().minusDays(1);
        ZonedDateTime newer = ZonedDateTime.now();

        SecurityProto olderValue = secProto(id, older);
        SecurityProto newerValue = secProto(id, newer);
        cache.put(id, olderValue, older);
        cache.put(id, newerValue, newer);

        // Cache now holds newerValue; the older one is gone.
        assertSame(newerValue, cache.get(id, newer));
        assertNull(cache.get(id, older),
            "The older entry is gone — its slot was reused by the newer-vintage write");
    }

    // ---------- asOf mismatch on non-null read forces refetch ----------

    @Test
    void get_asOfMismatch_returnsNullToForceRefetch() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        ZonedDateTime t1 = ZonedDateTime.now().minusDays(2);
        ZonedDateTime t2 = ZonedDateTime.now().minusDays(1);

        cache.put(id, secProto(id, t1), t1);

        assertNull(cache.get(id, t2),
            "Cache must not silently return a different vintage than the caller requested");
    }

    // ---------- evict + clear ----------

    @Test
    void evict_removesEntry_subsequentGetReturnsNull() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now();
        cache.put(id, secProto(id, asOf), asOf);
        assertNotNull(cache.get(id, asOf));

        cache.evict(id);

        assertNull(cache.get(id, asOf));
    }

    @Test
    void clear_emptiesCache() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        for (int i = 0; i < 5; i++) {
            UUID id = UUID.randomUUID();
            cache.put(id, secProto(id, ZonedDateTime.now()), ZonedDateTime.now());
        }
        assertEquals(5, cache.size());

        cache.clear();

        assertEquals(0, cache.size());
    }

    // ---------- Singleton isolation ----------

    @Test
    void staticSingletons_isolatedByEntityType() {
        UUID id = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now();
        LinkCache.SECURITY.put(id, secProto(id, asOf), asOf);

        // Writing to SECURITY doesn't leak into PORTFOLIO.
        assertNull(LinkCache.PORTFOLIO.get(id, asOf));
        assertNotNull(LinkCache.SECURITY.get(id, asOf));

        // Cleanup so other tests aren't affected.
        LinkCache.SECURITY.evict(id);
    }

    // ---------- Null-input validation ----------

    @Test
    void put_nullId_throws() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        ZonedDateTime asOf = ZonedDateTime.now();
        assertThrows(IllegalArgumentException.class,
            () -> cache.put(null, secProto(UUID.randomUUID(), asOf), asOf));
    }

    @Test
    void put_nullValue_throws() {
        LinkCache<SecurityProto> cache = new LinkCache<>();
        assertThrows(IllegalArgumentException.class,
            () -> cache.put(UUID.randomUUID(), null, ZonedDateTime.now()));
    }

    @Test
    void put_nullAsOf_acceptsAsLatestEntry() {
        // Post-W4: null asOf is allowed on put — represents a "latest at
        // caching time" entry. Subsequent null-asOf reads within TTL hit;
        // specific-asOf reads miss. Mirrors the Python semantic.
        LinkCache<SecurityProto> cache = new LinkCache<>();
        UUID id = UUID.randomUUID();
        SecurityProto value = secProto(id, ZonedDateTime.now());
        cache.put(id, value, null);
        // null-asOf read within TTL: hit.
        assertSame(value, cache.get(id, null));
        // Specific-asOf read: miss (cached entry has no asOf to match against).
        assertNull(cache.get(id, ZonedDateTime.now()));
    }

    @Test
    void ctor_nullTtl_throws() {
        assertThrows(IllegalArgumentException.class, () -> new LinkCache<>(null));
    }

    @Test
    void ctor_negativeTtl_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> new LinkCache<>(Duration.ofSeconds(-1)));
    }

    // ---------- F. LRU bound (W4) ----------

    @Test
    void lru_capacity_evictsLeastRecentlyUsed() {
        LinkCache<SecurityProto> cache =
                new LinkCache<>(Duration.ofSeconds(60), /*maxEntries=*/3);
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();
        UUID u4 = UUID.randomUUID();
        ZonedDateTime asOf = ZonedDateTime.now();

        cache.put(u1, secProto(u1, asOf), asOf);
        cache.put(u2, secProto(u2, asOf), asOf);
        cache.put(u3, secProto(u3, asOf), asOf);
        assertEquals(3, cache.size());

        // Touch u1 → MRU.
        assertNotNull(cache.get(u1, asOf));

        // Insert u4 → evicts u2 (LRU).
        cache.put(u4, secProto(u4, asOf), asOf);
        assertEquals(3, cache.size());
        assertNotNull(cache.get(u1, asOf));
        assertNull(cache.get(u2, asOf), "u2 should have been evicted (it was LRU)");
        assertNotNull(cache.get(u3, asOf));
        assertNotNull(cache.get(u4, asOf));
    }

    @Test
    void ctor_zeroMaxEntries_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> new LinkCache<SecurityProto>(Duration.ofSeconds(60), 0));
    }
}
