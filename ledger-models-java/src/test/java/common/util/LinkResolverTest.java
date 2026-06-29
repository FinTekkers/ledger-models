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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

        SecurityProto s1 = resolver.getSecurity(uuid);
        SecurityProto s2 = resolver.getSecurity(uuid);

        assertEquals(1, fetcher.callCount);
        assertEquals("AAPL", s1.getIssuerName());
        assertEquals("AAPL", s2.getIssuerName());
    }

    @Test
    void cacheEvictForcesRefetch() {
        // Post-W4 the resolver doesn't own its own cache (LinkCache singletons
        // do). Evicting the entry from LinkCache between calls forces a refetch
        // on the next get — the equivalent of the old `cacheSize=0` semantic.
        UUID uuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(uuid.toString(), fullSecurity(uuid, "AAPL"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()));

        resolver.getSecurity(uuid);
        LinkCache.SECURITY.evict(uuid);
        resolver.getSecurity(uuid);

        assertEquals(2, fetcher.callCount);
    }

    @Test
    void nonLinkItemsPassThroughUnchanged() {
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>());
        LinkResolver resolver = new LinkResolver(fetcher,
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));
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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
                new RecordingPortfolioFetcher(new HashMap<>()));

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
        LinkResolver resolver = new LinkResolver(secFetcher, portFetcher);

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
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

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
                fetcher);

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
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

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

    // ---------- second-brain#348 — child-transaction Security hydration ----------
    //
    // Pre-fix: resolveSecuritiesOnTransactions only walked the top-level
    // `security` field on each TransactionProto. After Transaction.getProto()
    // strip-on-write (Phase 2 #340) the CHILDREN (cash-impact WITHDRAWAL,
    // derived MATURATION, MATURATION's DEPOSIT) also carried link-mode
    // securities. Consumers reading child.getSecurity() got a base Security
    // wrapper — broke the (BondSecurity) cast at
    // ledger-service TaxLotCalculator.java:61 with ClassCastException, which
    // surfaced as Phase 4's 1,209 / 6,857 Transaction.CreateOrUpdate
    // rejections (StatusCode.UNKNOWN: Application error processing RPC).
    //
    // These tests pin the new contract: every link-mode security in the
    // forest — top-level, every child, recursively — is hydrated by a single
    // resolveSecuritiesOnTransactions call, batching across the whole tree.

    private static SecurityProto fullBondSecurity(UUID uuid, String cusip) {
        // TBILL-shape with bond_details so downstream Security.fromProto
        // dispatches to BondSecurity (the cast site we're protecting).
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setIsLink(false)
                .setIssuerName("US TREASURY")
                .setProductType(fintekkers.models.security.ProductTypeProto.TBILL)
                .addIdentifiers(IdentifierProto.newBuilder()
                        .setIdentifierType(fintekkers.models.security.IdentifierTypeProto.CUSIP)
                        .setIdentifierValue(cusip).build())
                .setBondDetails(fintekkers.models.security.BondDetailsProto.newBuilder()
                        .setIssueDate(fintekkers.models.util.LocalDate.LocalDateProto.newBuilder()
                                .setYear(2023).setMonth(5).setDay(16).build())
                        .setDatedDate(fintekkers.models.util.LocalDate.LocalDateProto.newBuilder()
                                .setYear(2023).setMonth(5).setDay(16).build())
                        .setMaturityDate(fintekkers.models.util.LocalDate.LocalDateProto.newBuilder()
                                .setYear(2023).setMonth(9).setDay(12).build())
                        .build())
                .build();
    }

    private static SecurityProto fullCashSecurity(UUID uuid) {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(uuidProto(uuid))
                .setIsLink(false)
                .setIssuerName("USD")
                .setProductType(fintekkers.models.security.ProductTypeProto.CURRENCY)
                .setCashDetails(fintekkers.models.security.CashDetailsProto.newBuilder()
                        .setCashId("USD").build())
                .build();
    }

    /** Build a Transaction tree shaped like a SOMA Treasury BUY after
     *  addCashImpact + addDerivedTransactions ran server-side and then
     *  Transaction.getProto() applied strip-on-write to everything inside:
     *
     *      BUY (bond LINK)
     *      ├── WITHDRAWAL (cash LINK)
     *      └── MATURATION (bond LINK)
     *          └── DEPOSIT (cash LINK)
     *
     *  This is the exact wire shape that hit
     *  TaxLotCalculator.java:61's (BondSecurity) cast and threw
     *  ClassCastException on the MATURATION child (second-brain#348).
     */
    private TransactionProto somaTreasuryChain_allLinkMode(UUID bondUuid, UUID cashUuid) {
        SecurityProto bondLink = linkSecurity(bondUuid);
        SecurityProto cashLink = linkSecurity(cashUuid);

        TransactionProto deposit = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(cashLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.DEPOSIT)
                .build();
        TransactionProto maturation = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(bondLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.MATURATION)
                .addChildTransactions(deposit)
                .build();
        TransactionProto withdrawal = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(cashLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.WITHDRAWAL)
                .build();
        return TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(bondLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.BUY)
                .addChildTransactions(withdrawal)
                .addChildTransactions(maturation)
                .build();
    }

    @Test
    void issue348_childTransactionSecurities_areHydratedByBulkResolve() {
        LinkCache.SECURITY.clear();
        UUID bondUuid = UUID.randomUUID();
        UUID cashUuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(
                bondUuid.toString(), fullBondSecurity(bondUuid, "912797GS0"),
                cashUuid.toString(), fullCashSecurity(cashUuid));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

        TransactionProto buy = somaTreasuryChain_allLinkMode(bondUuid, cashUuid);
        List<TransactionProto> out = resolver.resolveSecuritiesOnTransactions(List.of(buy));

        TransactionProto hydratedBuy = out.get(0);

        // Top-level BUY: bond hydrated.
        assertFalse(hydratedBuy.getSecurity().getIsLink(),
                "Top-level BUY's security must be hydrated");
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                hydratedBuy.getSecurity().getProductType(),
                "Hydrated bond must carry a concrete productType so Security.fromProto dispatches to BondSecurity");

        // Every child's security: also hydrated. This is the exact contract
        // that was broken pre-#348.
        assertEquals(2, hydratedBuy.getChildTransactionsCount());
        TransactionProto withdrawal = hydratedBuy.getChildTransactions(0);
        TransactionProto maturation = hydratedBuy.getChildTransactions(1);

        assertFalse(withdrawal.getSecurity().getIsLink(),
                "WITHDRAWAL (cash leg) security must be hydrated");
        assertEquals(fintekkers.models.security.ProductTypeProto.CURRENCY,
                withdrawal.getSecurity().getProductType());

        assertFalse(maturation.getSecurity().getIsLink(),
                "MATURATION child's security must be hydrated — this is the cast site that blew up #348");
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                maturation.getSecurity().getProductType(),
                "MATURATION child must carry TBILL productType so (BondSecurity) cast at "
                        + "TaxLotCalculator.java:61 succeeds");

        // Grandchild (MATURATION's DEPOSIT cash leg): also hydrated.
        assertEquals(1, maturation.getChildTransactionsCount());
        TransactionProto deposit = maturation.getChildTransactions(0);
        assertFalse(deposit.getSecurity().getIsLink(),
                "DEPOSIT grandchild (MATURATION's cash leg) security must be hydrated");
        assertEquals(fintekkers.models.security.ProductTypeProto.CURRENCY,
                deposit.getSecurity().getProductType());

        LinkCache.SECURITY.clear();
    }

    @Test
    void issue348_bulkResolve_batchesAcrossTreeInSingleRpc() {
        LinkCache.SECURITY.clear();
        UUID bondUuid = UUID.randomUUID();
        UUID cashUuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(
                bondUuid.toString(), fullBondSecurity(bondUuid, "912797GS0"),
                cashUuid.toString(), fullCashSecurity(cashUuid));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

        TransactionProto buy = somaTreasuryChain_allLinkMode(bondUuid, cashUuid);
        // 5 link-mode security sub-protos across the tree (BUY+MATURATION on
        // bond × 2, WITHDRAWAL+DEPOSIT on cash × 2 — wait, BUY has bondLink,
        // WITHDRAWAL cashLink, MATURATION bondLink, DEPOSIT cashLink = 4 link
        // refs total, but only 2 unique UUIDs). The resolver must dedupe
        // across the forest and fire exactly one RPC.
        resolver.resolveSecuritiesOnTransactions(List.of(buy));

        assertEquals(1, fetcher.callCount,
                "All link-mode securities in the tree should be fetched in a single batched RPC");
        assertEquals(2, fetcher.requestedUuids.get(0).size(),
                "Two unique UUIDs (bond + cash) requested in the batch");
        Set<String> requested = new HashSet<>(fetcher.requestedUuids.get(0));
        assertEquals(Set.of(bondUuid.toString(), cashUuid.toString()), requested);

        LinkCache.SECURITY.clear();
    }

    @Test
    void issue348_alreadyFullSecuritiesOnChildren_passThrough() {
        // Defensive: if the producer happens to send a Transaction whose
        // child carries a full inline security (no strip-on-write applied),
        // the resolver must leave it alone and never make any RPC.
        LinkCache.SECURITY.clear();
        UUID bondUuid = UUID.randomUUID();
        UUID cashUuid = UUID.randomUUID();
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>());
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

        SecurityProto fullBond = fullBondSecurity(bondUuid, "912797GS0");
        SecurityProto fullCash = fullCashSecurity(cashUuid);

        TransactionProto maturation = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(fullBond)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.MATURATION)
                .build();
        TransactionProto buy = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(fullBond)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.BUY)
                .addChildTransactions(maturation)
                .build();

        List<TransactionProto> out = resolver.resolveSecuritiesOnTransactions(List.of(buy));

        assertEquals(0, fetcher.callCount, "No link-mode → no RPC");
        // Reference-identity pass-through is a perf optimization, not a
        // contract. Assert observable: still a TBILL bond on both nodes.
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                out.get(0).getSecurity().getProductType());
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                out.get(0).getChildTransactions(0).getSecurity().getProductType());
        // Cash sentinel not needed for this scenario; ensure unused fields
        // are quiet.
        assertEquals(0, fullCash.getIsLink() ? 1 : 0);

        LinkCache.SECURITY.clear();
    }

    @Test
    void issue348_mixedTree_someChildrenLinkSomeFull_isHandled() {
        // Edge case: a producer that sends the parent full but children
        // stripped (or vice-versa). The resolver must hydrate ONLY the
        // link-mode ones.
        LinkCache.SECURITY.clear();
        UUID bondUuid = UUID.randomUUID();
        UUID cashUuid = UUID.randomUUID();
        SecurityProto fullCash = fullCashSecurity(cashUuid);
        SecurityProto bondLink = linkSecurity(bondUuid);

        Map<String, SecurityProto> store = Map.of(
                bondUuid.toString(), fullBondSecurity(bondUuid, "912797GS0"));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

        TransactionProto withdrawal = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(fullCash)  // full
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.WITHDRAWAL)
                .build();
        TransactionProto maturation = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(bondLink)  // link
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.MATURATION)
                .build();
        TransactionProto buy = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setSecurity(bondLink)  // link
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.BUY)
                .addChildTransactions(withdrawal)
                .addChildTransactions(maturation)
                .build();

        List<TransactionProto> out = resolver.resolveSecuritiesOnTransactions(List.of(buy));

        assertEquals(1, fetcher.callCount, "Single RPC for the one unique link UUID");
        assertEquals(1, fetcher.requestedUuids.get(0).size(),
                "Only the bond UUID needs fetching — full cash sub-proto passes through");

        TransactionProto h = out.get(0);
        assertFalse(h.getSecurity().getIsLink());
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                h.getSecurity().getProductType());
        assertEquals(fintekkers.models.security.ProductTypeProto.CURRENCY,
                h.getChildTransactions(0).getSecurity().getProductType());
        assertFalse(h.getChildTransactions(1).getSecurity().getIsLink());
        assertEquals(fintekkers.models.security.ProductTypeProto.TBILL,
                h.getChildTransactions(1).getSecurity().getProductType());

        LinkCache.SECURITY.clear();
    }

    @Test
    void issue348_endToEnd_childMaturationGetSecurityReturnsBondSecurity_notBaseSecurity() {
        // The whole point of this fix: after recursive hydration, wrapping
        // the hydrated proto in a Transaction and calling getSecurity() on
        // the MATURATION child must return a BondSecurity (not a base
        // Security), so the (BondSecurity) cast at
        // ledger-service TaxLotCalculator.java:61 succeeds.
        //
        // Pre-fix this exact call returned a base Security and threw
        // ClassCastException at the cast site (#348 production failure).
        LinkCache.SECURITY.clear();
        UUID bondUuid = UUID.randomUUID();
        UUID cashUuid = UUID.randomUUID();
        Map<String, SecurityProto> store = Map.of(
                bondUuid.toString(), fullBondSecurity(bondUuid, "912797GS0"),
                cashUuid.toString(), fullCashSecurity(cashUuid));
        RecordingSecurityFetcher fetcher = new RecordingSecurityFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(fetcher,
                req -> { throw new IllegalStateException("portfolio fetcher should not be called"); });

        TransactionProto buyProto = somaTreasuryChain_allLinkMode(bondUuid, cashUuid);
        TransactionProto hydrated = resolver.resolveSecuritiesOnTransactions(List.of(buyProto)).get(0);

        // Wrap and traverse via the SAME path TaxLotCalculator takes.
        common.models.transaction.Transaction buy =
                new common.models.transaction.Transaction(hydrated);
        assertEquals(2, buy.getChildTransactions().size());
        common.models.transaction.Transaction maturation = buy.getChildTransactions().get(1);
        assertEquals(fintekkers.models.transaction.TransactionTypeProto.MATURATION.name(),
                maturation.getTransactionType().name());

        // The contract-pinning assertion. This object reference must be a
        // BondSecurity for ledger-service's `(BondSecurity) txn.getSecurity()`
        // to work. Before the recursion fix this returned a base
        // common.models.security.Security → ClassCastException at runtime.
        common.models.security.Security maturationSec = maturation.getSecurity();
        assertNotNull(maturationSec);
        assertTrue(maturationSec instanceof common.models.security.BondSecurity,
                "MATURATION child's getSecurity() must dispatch to BondSecurity. "
                        + "Got: " + maturationSec.getClass().getName()
                        + " — second-brain#348 reproduction guard.");

        // And the (BondSecurity) cast must actually succeed.
        common.models.security.BondSecurity bondCast =
                (common.models.security.BondSecurity) maturationSec;
        assertEquals(java.time.LocalDate.of(2023, 9, 12), bondCast.getMaturityDate());

        LinkCache.SECURITY.clear();
    }

    @Test
    void issue348_portfoliosOnChildren_areHydratedRecursively() {
        // Portfolio counterpart: addCashImpact / addDerivedTransactions
        // propagate parent's portfolio onto every child, and strip-on-write
        // turns all of them into links. The recursive Portfolio hydration
        // must mirror the Security path.
        LinkCache.PORTFOLIO.clear();
        UUID portUuid = UUID.randomUUID();
        PortfolioProto fullPort = fullPortfolio(portUuid, "Federal Reserve SOMA Holdings");
        Map<String, PortfolioProto> store = Map.of(portUuid.toString(), fullPort);
        RecordingPortfolioFetcher fetcher = new RecordingPortfolioFetcher(new HashMap<>(store));
        LinkResolver resolver = new LinkResolver(
                req -> { throw new IllegalStateException("security fetcher should not be called"); },
                fetcher);

        PortfolioProto portLink = PortfolioProto.newBuilder()
                .setUuid(uuidProto(portUuid))
                .setIsLink(true).build();

        TransactionProto maturation = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setPortfolio(portLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.MATURATION)
                .build();
        TransactionProto buy = TransactionProto.newBuilder()
                .setObjectClass("Transaction").setVersion("0.0.1")
                .setUuid(uuidProto(UUID.randomUUID()))
                .setPortfolio(portLink)
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.BUY)
                .addChildTransactions(maturation)
                .build();

        List<TransactionProto> out = resolver.resolvePortfoliosOnTransactions(List.of(buy));

        assertEquals(1, fetcher.callCount, "Single batched RPC for the deduped portfolio UUID across the tree");
        TransactionProto h = out.get(0);
        assertFalse(h.getPortfolio().getIsLink(), "Top-level portfolio hydrated");
        assertEquals("Federal Reserve SOMA Holdings", h.getPortfolio().getPortfolioName());
        assertFalse(h.getChildTransactions(0).getPortfolio().getIsLink(),
                "Child MATURATION's portfolio hydrated — recursive contract");
        assertEquals("Federal Reserve SOMA Holdings",
                h.getChildTransactions(0).getPortfolio().getPortfolioName());

        LinkCache.PORTFOLIO.clear();
    }
}
