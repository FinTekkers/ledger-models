package common.util;

import com.google.protobuf.ByteString;
import com.google.protobuf.Timestamp;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import org.junit.jupiter.api.Test;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link LinkResolver}. Mocks the {@link LinkResolver.SecurityFetcher}
 * and {@link LinkResolver.PortfolioFetcher} seams to avoid any gRPC over the wire.
 */
class LinkResolverTest {

    // ---------- helpers ----------

    /** Recording fetcher that satisfies queries from a UUID->Proto store and
     * logs each call for assertion. */
    private static final class RecordingSecurityFetcher implements LinkResolver.SecurityFetcher {
        final Map<String, SecurityProto> store;
        int callCount = 0;
        final List<List<String>> requestedUuids = new ArrayList<>();
        final List<Long> requestedAsOfSeconds = new ArrayList<>(); // null seconds → -1

        RecordingSecurityFetcher(Map<String, SecurityProto> store) { this.store = store; }

        @Override
        public QuerySecurityResponseProto getByIds(QuerySecurityRequestProto request) {
            callCount++;
            List<String> uids = new ArrayList<>();
            for (UUIDProto u : request.getUuIdsList()) uids.add(uuidStrFromProto(u));
            requestedUuids.add(uids);
            requestedAsOfSeconds.add(request.hasAsOf() ? request.getAsOf().getTimestamp().getSeconds() : -1L);
            QuerySecurityResponseProto.Builder b = QuerySecurityResponseProto.newBuilder();
            for (String u : uids) {
                SecurityProto p = store.get(u);
                if (p != null) b.addSecurityResponse(p);
            }
            return b.build();
        }
    }

    private static final class RecordingPortfolioFetcher implements LinkResolver.PortfolioFetcher {
        final Map<String, PortfolioProto> store;
        int callCount = 0;
        final List<List<String>> requestedUuids = new ArrayList<>();

        RecordingPortfolioFetcher(Map<String, PortfolioProto> store) { this.store = store; }

        @Override
        public QueryPortfolioResponseProto getByIds(QueryPortfolioRequestProto request) {
            callCount++;
            List<String> uids = new ArrayList<>();
            for (UUIDProto u : request.getUuIdsList()) uids.add(uuidStrFromProto(u));
            requestedUuids.add(uids);
            QueryPortfolioResponseProto.Builder b = QueryPortfolioResponseProto.newBuilder();
            for (String u : uids) {
                PortfolioProto p = store.get(u);
                if (p != null) b.addPortfolioResponse(p);
            }
            return b.build();
        }
    }

    private static UUIDProto uuidProto(UUID uuid) {
        ByteBuffer bb = ByteBuffer.allocate(16);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return UUIDProto.newBuilder().setRawUuid(ByteString.copyFrom(bb.array())).build();
    }

    private static String uuidStrFromProto(UUIDProto p) {
        ByteBuffer bb = ByteBuffer.wrap(p.getRawUuid().toByteArray());
        return new UUID(bb.getLong(), bb.getLong()).toString();
    }

    private static SecurityProto fullSecurity(UUID uuid, String issuer) {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setIsLink(false)
                .setIssuerName(issuer)
                .addIdentifiers(IdentifierProto.newBuilder().setIdentifierValue("TICKER-" + issuer).build())
                .build();
    }

    private static PortfolioProto fullPortfolio(UUID uuid, String name) {
        return PortfolioProto.newBuilder()
                .setObjectClass("Portfolio")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setIsLink(false)
                .setPortfolioName(name)
                .build();
    }

    private static SecurityProto linkSecurity(UUID uuid) {
        return SecurityProto.newBuilder().setUuid(uuidProto(uuid)).setIsLink(true).build();
    }

    private static SecurityProto linkSecurityWithAsOf(UUID uuid, LocalTimestampProto asOf) {
        return SecurityProto.newBuilder()
                .setUuid(uuidProto(uuid))
                .setIsLink(true)
                .setAsOf(asOf)
                .build();
    }

    private static PriceProto linkPrice(UUID securityUuid) {
        return PriceProto.newBuilder()
                .setObjectClass("Price")
                .setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurity(securityUuid))
                .build();
    }

    private static PriceProto linkPriceWithAsOf(UUID securityUuid, LocalTimestampProto asOf) {
        return PriceProto.newBuilder()
                .setObjectClass("Price")
                .setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurityWithAsOf(securityUuid, asOf))
                .build();
    }

    private static LocalTimestampProto asOfAt(long epochSeconds) {
        return LocalTimestampProto.newBuilder()
                .setTimestamp(Timestamp.newBuilder().setSeconds(epochSeconds).setNanos(0).build())
                .setTimeZone("UTC")
                .build();
    }

    // ---------- tests ----------

    @Test
    void bulkResolveSecuritiesDedupesUuids() {
        UUID a = UUID.randomUUID(), b = UUID.randomUUID(), c = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(
                a.toString(), fullSecurity(a, "AAPL"),
                b.toString(), fullSecurity(b, "MSFT"),
                c.toString(), fullSecurity(c, "GOOG"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        List<PriceProto> prices = List.of(
                linkPrice(a), linkPrice(a), linkPrice(b), linkPrice(a), linkPrice(c));

        List<PriceProto> out = resolver.resolveSecuritiesOnPrices(prices);

        assertEquals(1, fetcher.callCount, "5 prices, 3 unique → exactly 1 RPC");
        assertEquals(3, fetcher.requestedUuids.get(0).size(), "RPC carries 3 deduped UUIDs");
        Set<String> requested = new HashSet<>(fetcher.requestedUuids.get(0));
        assertEquals(Set.of(a.toString(), b.toString(), c.toString()), requested);

        for (PriceProto p : out) {
            assertFalse(p.getSecurity().getIsLink(), "embedded security hydrated");
            assertNotNull(p.getSecurity().getIssuerName());
        }
    }

    @Test
    void cacheHitSkipsSecondRpc() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        SecurityProto s1 = resolver.getSecurity(uuid);
        SecurityProto s2 = resolver.getSecurity(uuid);

        assertEquals(1, fetcher.callCount);
        assertEquals("AAPL", s1.getIssuerName());
        assertEquals("AAPL", s2.getIssuerName());
    }

    @Test
    void cacheDisabledReRpcs() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), /* cacheSize */ 0, 0);

        resolver.getSecurity(uuid);
        resolver.getSecurity(uuid);

        assertEquals(2, fetcher.callCount);
    }

    @Test
    void nonLinkItemsPassThroughUnchanged() {
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>());
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        SecurityProto fullSec = fullSecurity(UUID.randomUUID(), "AAPL");
        PriceProto p = PriceProto.newBuilder()
                .setObjectClass("Price")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(fullSec)
                .build();

        List<PriceProto> out = resolver.resolveSecuritiesOnPrices(List.of(p));
        assertEquals(0, fetcher.callCount, "no link → no RPC");
        assertEquals("AAPL", out.get(0).getSecurity().getIssuerName());
    }

    @Test
    void itemsMissingSecuritySkippedCleanly() {
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>());
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);
        PriceProto p = PriceProto.newBuilder()
                .setObjectClass("Price")
                .setUuid(uuidProto(UUID.randomUUID()))
                .build();
        // No security set on this Price.
        List<PriceProto> out = resolver.resolveSecuritiesOnPrices(List.of(p));
        assertEquals(0, fetcher.callCount);
        assertEquals(1, out.size());
    }

    @Test
    void crossCallCacheReuse() {
        UUID a = UUID.randomUUID(), b = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(
                a.toString(), fullSecurity(a, "AAPL"),
                b.toString(), fullSecurity(b, "MSFT"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        resolver.resolveSecuritiesOnPrices(List.of(linkPrice(a), linkPrice(b)));
        assertEquals(1, fetcher.callCount);

        // Both UUIDs cached → 0 additional RPCs.
        resolver.resolveSecuritiesOnPrices(List.of(linkPrice(a), linkPrice(b)));
        assertEquals(1, fetcher.callCount);
    }

    // ---------- as_of-aware ----------

    @Test
    void linkWithoutAsOfOmitsAsOfOnRequest() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        resolver.resolveSecuritiesOnPrices(List.of(linkPrice(uuid)));

        assertEquals(1, fetcher.callCount);
        assertEquals(-1L, fetcher.requestedAsOfSeconds.get(0), "unset → sentinel -1");
    }

    @Test
    void linkWithAsOfCarriesAsOfOnRequest() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        LocalTimestampProto t1 = asOfAt(1_700_000_000L);
        resolver.resolveSecuritiesOnPrices(List.of(linkPriceWithAsOf(uuid, t1)));

        assertEquals(1, fetcher.callCount);
        assertEquals(1_700_000_000L, fetcher.requestedAsOfSeconds.get(0));
    }

    @Test
    void twoAsOfBucketsForSameUuidFireSeparateRpcs() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        LocalTimestampProto t1 = asOfAt(1_700_000_000L);
        LocalTimestampProto t2 = asOfAt(1_800_000_000L);

        resolver.resolveSecuritiesOnPrices(
                List.of(linkPriceWithAsOf(uuid, t1), linkPriceWithAsOf(uuid, t2)));

        assertEquals(2, fetcher.callCount, "two as_of buckets for same uuid → 2 RPCs");
        Set<Long> seen = new HashSet<>(fetcher.requestedAsOfSeconds);
        assertEquals(Set.of(1_700_000_000L, 1_800_000_000L), seen);
    }

    @Test
    void sameAsOfForSameUuidDedupsToOneRpc() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        LocalTimestampProto t1a = asOfAt(1_700_000_000L);
        LocalTimestampProto t1b = asOfAt(1_700_000_000L);

        resolver.resolveSecuritiesOnPrices(
                List.of(linkPriceWithAsOf(uuid, t1a), linkPriceWithAsOf(uuid, t1b)));

        assertEquals(1, fetcher.callCount);
        assertEquals(1, fetcher.requestedUuids.get(0).size());
    }

    @Test
    void cacheKeyIncludesAsOf() {
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()), 1000, 0);

        LocalTimestampProto t1 = asOfAt(1_700_000_000L);

        resolver.getSecurity(uuid);
        assertEquals(1, fetcher.callCount);
        assertEquals(-1L, fetcher.requestedAsOfSeconds.get(0));

        resolver.getSecurity(uuid, t1);
        assertEquals(2, fetcher.callCount, "(uuid, t1) is a different cache key from (uuid, latest)");
        assertEquals(1_700_000_000L, fetcher.requestedAsOfSeconds.get(1));

        resolver.getSecurity(uuid, asOfAt(1_700_000_000L));
        assertEquals(2, fetcher.callCount, "cache hit on (uuid, t1)");
    }

    // ---------- transaction (security + portfolio) ----------

    @Test
    void resolveBothSecurityAndPortfolioOnTransactions() {
        UUID secA = UUID.randomUUID(), secB = UUID.randomUUID();
        UUID portX = UUID.randomUUID(), portY = UUID.randomUUID();

        Map<String, SecurityProto> secStore = Map.of(
                secA.toString(), fullSecurity(secA, "AAPL"),
                secB.toString(), fullSecurity(secB, "MSFT"));
        Map<String, PortfolioProto> portStore = Map.of(
                portX.toString(), fullPortfolio(portX, "Strategy X"),
                portY.toString(), fullPortfolio(portY, "Strategy Y"));

        RecordingSecurityFetcher secFetcher = new RecordingSecurityFetcher(new HashMap<>(secStore));
        RecordingPortfolioFetcher portFetcher = new RecordingPortfolioFetcher(new HashMap<>(portStore));
        LinkResolver resolver = new LinkResolver(secFetcher, portFetcher, 1000, 0);

        TransactionProto t1 = TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurity(secA))
                .setPortfolio(PortfolioProto.newBuilder().setUuid(uuidProto(portX)).setIsLink(true).build())
                .build();
        TransactionProto t2 = TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurity(secB))
                .setPortfolio(PortfolioProto.newBuilder().setUuid(uuidProto(portY)).setIsLink(true).build())
                .build();
        TransactionProto t3 = TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurity(secA))
                .setPortfolio(PortfolioProto.newBuilder().setUuid(uuidProto(portX)).setIsLink(true).build())
                .build();

        List<TransactionProto> hydrated = resolver.resolveSecuritiesOnTransactions(List.of(t1, t2, t3));
        hydrated = resolver.resolvePortfoliosOnTransactions(hydrated);

        assertEquals(1, secFetcher.callCount, "security side: 1 batched RPC for 2 unique UUIDs");
        assertEquals(1, portFetcher.callCount, "portfolio side: 1 batched RPC for 2 unique UUIDs");

        for (TransactionProto t : hydrated) {
            assertFalse(t.getSecurity().getIsLink());
            assertFalse(t.getPortfolio().getIsLink());
            assertTrue(Set.of("AAPL", "MSFT").contains(t.getSecurity().getIssuerName()));
            assertTrue(Set.of("Strategy X", "Strategy Y").contains(t.getPortfolio().getPortfolioName()));
        }
    }

    // ---------- LinkCache write-through ----------

    private static SecurityProto fullSecurityWithAsOf(UUID uuid, String issuer, LocalTimestampProto asOf) {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setAsOf(asOf)
                .setIsLink(false)
                .setIssuerName(issuer)
                .build();
    }

    private static PortfolioProto fullPortfolioWithAsOf(UUID uuid, String name, LocalTimestampProto asOf) {
        return PortfolioProto.newBuilder()
                .setObjectClass("Portfolio")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setAsOf(asOf)
                .setIsLink(false)
                .setPortfolioName(name)
                .build();
    }

    @Test
    void getSecurity_populatesLinkCache() {
        LinkCache.SECURITY.clear();
        UUID uuid = UUID.randomUUID();
        LocalTimestampProto asOf = asOfAt(1_700_000_000L);
        SecurityProto resolved = fullSecurityWithAsOf(uuid, "ACME", asOf);
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(Map.of(uuid.toString(), resolved));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); },
                1000, 0L);

        SecurityProto out = resolver.getSecurity(uuid, asOf);
        assertEquals("ACME", out.getIssuerName());

        java.time.ZonedDateTime asOfZ = protos.serializers.util.proto.ProtoSerializationUtil
                .deserializeTimestamp(asOf);
        SecurityProto fromLinkCache = LinkCache.SECURITY.get(uuid, asOfZ);
        assertNotNull(fromLinkCache, "LinkCache.SECURITY must contain the resolved proto after getSecurity");
        assertEquals("ACME", fromLinkCache.getIssuerName());
        LinkCache.SECURITY.clear();
    }

    @Test
    void getPortfolio_populatesLinkCache() {
        LinkCache.PORTFOLIO.clear();
        UUID uuid = UUID.randomUUID();
        LocalTimestampProto asOf = asOfAt(1_700_000_001L);
        PortfolioProto resolved = fullPortfolioWithAsOf(uuid, "Strategy Z", asOf);
        RecordingPortfolioFetcher fetcher = new RecordingPortfolioFetcher(Map.of(uuid.toString(), resolved));
        LinkResolver resolver = new LinkResolver(
                req -> { throw new IllegalStateException("security fetcher should not be called"); },
                fetcher, 1000, 0L);

        PortfolioProto out = resolver.getPortfolio(uuid, asOf);
        assertEquals("Strategy Z", out.getPortfolioName());

        java.time.ZonedDateTime asOfZ = protos.serializers.util.proto.ProtoSerializationUtil
                .deserializeTimestamp(asOf);
        PortfolioProto fromLinkCache = LinkCache.PORTFOLIO.get(uuid, asOfZ);
        assertNotNull(fromLinkCache, "LinkCache.PORTFOLIO must contain the resolved proto after getPortfolio");
        assertEquals("Strategy Z", fromLinkCache.getPortfolioName());
        LinkCache.PORTFOLIO.clear();
    }

    @Test
    void bulkResolveSecuritiesOnTransactions_populatesLinkCache() {
        LinkCache.SECURITY.clear();
        UUID secUuid = UUID.randomUUID();
        LocalTimestampProto asOf = asOfAt(1_700_000_002L);
        SecurityProto resolved = fullSecurityWithAsOf(secUuid, "BULK", asOf);
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(Map.of(secUuid.toString(), resolved));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); },
                1000, 0L);

        TransactionProto txn = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(linkSecurityWithAsOf(secUuid, asOf))
                .build();
        resolver.resolveSecuritiesOnTransactions(List.of(txn));

        java.time.ZonedDateTime asOfZ = protos.serializers.util.proto.ProtoSerializationUtil
                .deserializeTimestamp(asOf);
        SecurityProto fromLinkCache = LinkCache.SECURITY.get(secUuid, asOfZ);
        assertNotNull(fromLinkCache, "Bulk resolve must populate LinkCache.SECURITY");
        assertEquals("BULK", fromLinkCache.getIssuerName());
        LinkCache.SECURITY.clear();
    }
}
