package common.models.security;

import common.util.LinkCache;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Behavior tests for the lazy-hydrate semantics on {@link Security}.
 * Per docs/adr/lazy-link-hydration-checklist.md.
 *
 * <p>Each test follows Given/When/Then. Uses an injected {@link Security.Fetcher}
 * stub that counts invocations so we can assert "exactly one RPC" / "no RPC."
 */
class SecurityLazyHydrateTest {

    private UUID id;
    private ZonedDateTime asOf;
    private AtomicInteger fetcherCallCount;

    private static SecurityProto fullProto(UUID id, ZonedDateTime asOf,
                                            ProductTypeProto productType, String issuer) {
        SecurityProto.Builder b = SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setProductType(productType);
        if (issuer != null) b.setIssuerName(issuer);
        return b.build();
    }

    private static SecurityProto linkProto(UUID id, ZonedDateTime asOf) {
        return Security.linkOf(id, asOf);
    }

    @BeforeEach
    void setup() {
        id = UUID.randomUUID();
        asOf = ZonedDateTime.now().minusHours(1);
        fetcherCallCount = new AtomicInteger(0);
        LinkCache.SECURITY.evict(id);  // start from a known-clean cache
        Security.setFetcher(null);
    }

    @AfterEach
    void teardown() {
        LinkCache.SECURITY.evict(id);
        Security.setFetcher(null);
    }

    // ---------------- A. hydration is called on each non-link-safe accessor

    @Test
    void getProductType_onLinkWrapper_invokesFetcherExactlyOnce() {
        // Given: link-mode wrapper, empty cache, fetcher returns the full proto
        SecurityProto full = fullProto(id, asOf, ProductTypeProto.TREASURY_BOND, "USA");
        Security.setFetcher((u, t) -> { fetcherCallCount.incrementAndGet(); return full; });
        Security wrapper = new Security(linkProto(id, asOf));

        // When
        ProductTypeProto pt = wrapper.getProductType();

        // Then
        assertEquals(ProductTypeProto.TREASURY_BOND, pt);
        assertEquals(1, fetcherCallCount.get(), "fetcher should be called exactly once");
    }

    @Test
    void linkSafeAccessors_doNotInvokeFetcher() {
        // Given: link-mode wrapper, no cache, fetcher throws if invoked
        Security.setFetcher((u, t) -> {
            fetcherCallCount.incrementAndGet();
            throw new AssertionError("link-safe accessors must not trigger fetch");
        });
        Security wrapper = new Security(linkProto(id, asOf));

        // When
        UUID gotId = wrapper.getID();
        ZonedDateTime gotAsOf = wrapper.getAsOf();
        boolean gotLink = wrapper.isLink();

        // Then
        assertEquals(id, gotId);
        assertEquals(asOf.toEpochSecond(), gotAsOf.toEpochSecond());
        assertTrue(gotLink);
        assertEquals(0, fetcherCallCount.get());
    }

    // ---------------- B. cache behavior — three sub-tests

    @Test
    void firstAccessorCall_hydratesAndPopulatesCache() {
        // Given
        SecurityProto full = fullProto(id, asOf, ProductTypeProto.TREASURY_NOTE, "USA");
        Security.setFetcher((u, t) -> { fetcherCallCount.incrementAndGet(); return full; });
        Security wrapper = new Security(linkProto(id, asOf));

        // When
        wrapper.getProductType();

        // Then: cache now holds the resolved proto AND wrapper is hydrated
        assertNotNull(LinkCache.SECURITY.get(id, asOf));
        assertFalse(wrapper.isLink(), "after hydration isLink must report false");
    }

    @Test
    void secondAccessorCallOnSameWrapper_doesNotInvokeFetcherAgain() {
        // Given: wrapper already hydrated by a first call
        SecurityProto full = fullProto(id, asOf, ProductTypeProto.TREASURY_NOTE, "USA");
        Security.setFetcher((u, t) -> { fetcherCallCount.incrementAndGet(); return full; });
        Security wrapper = new Security(linkProto(id, asOf));
        wrapper.getProductType();
        assertEquals(1, fetcherCallCount.get());

        // When: read more fields on the same wrapper
        wrapper.getIssuer();
        wrapper.getAssetClass();
        wrapper.getProductType();

        // Then: still just one fetch — internal proto serves all subsequent reads
        assertEquals(1, fetcherCallCount.get(), "subsequent reads must not refetch");
    }

    @Test
    void subsequentNewWrapper_sameUuidSameAsOf_hitsCache() {
        // Given: cache pre-populated; fetcher throws if invoked
        SecurityProto full = fullProto(id, asOf, ProductTypeProto.TREASURY_NOTE, "USA");
        LinkCache.SECURITY.put(id, full, asOf);
        Security.setFetcher((u, t) -> { throw new AssertionError("fetch must not happen — cache should hit"); });

        // When: fresh wrapper built from a link proto with the same (uuid, asOf)
        Security freshWrapper = new Security(linkProto(id, asOf));
        ProductTypeProto pt = freshWrapper.getProductType();

        // Then
        assertEquals(ProductTypeProto.TREASURY_NOTE, pt);
    }

    // ---------------- C. asOf semantics

    @Test
    void linkAsOfMatchesCachedAsOf_isCacheHit() {
        // Given
        SecurityProto cached = fullProto(id, asOf, ProductTypeProto.TREASURY_BOND, "USA");
        LinkCache.SECURITY.put(id, cached, asOf);
        Security.setFetcher((u, t) -> { throw new AssertionError("must not refetch"); });

        // When
        Security wrapper = new Security(linkProto(id, asOf));
        ProductTypeProto pt = wrapper.getProductType();

        // Then
        assertEquals(ProductTypeProto.TREASURY_BOND, pt);
    }

    @Test
    void linkAsOfDiffersFromCachedAsOf_forcesRefetch() {
        // Given: cache has T2; link asks for T1
        ZonedDateTime t1 = asOf;
        ZonedDateTime t2 = asOf.plusDays(1);
        SecurityProto cachedT2 = fullProto(id, t2, ProductTypeProto.TREASURY_BOND, "USA");
        SecurityProto fetchedT1 = fullProto(id, t1, ProductTypeProto.TREASURY_NOTE, "USA");
        LinkCache.SECURITY.put(id, cachedT2, t2);
        Security.setFetcher((u, t) -> { fetcherCallCount.incrementAndGet(); return fetchedT1; });

        // When
        Security wrapper = new Security(linkProto(id, t1));
        ProductTypeProto pt = wrapper.getProductType();

        // Then: refetch happened, T1 vintage returned (not the cached T2)
        assertEquals(1, fetcherCallCount.get());
        assertEquals(ProductTypeProto.TREASURY_NOTE, pt);
    }

    // ---------------- D. resolve-failure surfaces clearly

    @Test
    void getProductType_cacheMissAndFetcherReturnsNull_throwsIllegalStateException() {
        // Given
        Security.setFetcher((u, t) -> { fetcherCallCount.incrementAndGet(); return null; });
        Security wrapper = new Security(linkProto(id, asOf));

        // When / Then
        IllegalStateException e = assertThrows(IllegalStateException.class,
                wrapper::getProductType);
        assertTrue(e.getMessage().contains(id.toString()),
                "error message must contain the uuid for diagnosability");
    }

    @Test
    void getProductType_cacheMissAndNoFetcherConfigured_throwsIllegalStateException() {
        // Given: no cache, no fetcher
        Security.setFetcher(null);
        Security wrapper = new Security(linkProto(id, asOf));

        // When / Then
        IllegalStateException e = assertThrows(IllegalStateException.class,
                wrapper::getProductType);
        assertTrue(e.getMessage().contains(id.toString()));
        assertTrue(e.getMessage().contains("LinkResolver"),
                "error message should point caller at the pre-warm path");
    }

    // ---------------- Identifiers hydrate too

    @Test
    void getIdentifiers_onLinkWrapper_returnsResolvedIdentifiers() {
        // Given
        SecurityProto full = SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setProductType(ProductTypeProto.TREASURY_BOND)
                .addIdentifiers(IdentifierProto.newBuilder()
                        .setIdentifierType(IdentifierTypeProto.CUSIP)
                        .setIdentifierValue("912828ABC"))
                .build();
        LinkCache.SECURITY.put(id, full, asOf);

        // When
        Security wrapper = new Security(linkProto(id, asOf));

        // Then: identifiers list is empty before hydration; populated after.
        // Reading getIdentifiers triggers hydration.
        assertEquals(1, wrapper.getIdentifiers().size());
        assertEquals("912828ABC",
                wrapper.getIdentifiers().get(0).getIdentifier());
    }
}
