package common.models.transaction;

import common.models.security.BondSecurity;
import common.models.security.Security;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.MortgageBackedSecurity;
import common.models.security.bonds.TIPSBond;
import common.models.postion.Field;
import common.util.LinkCache;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-440: a transaction's security stored as a link (strip-on-write, #340)
 * reads as the class its resolved product type implies — a Treasury link is
 * a {@link BondSecurity} with its real maturity, never the base-class
 * {@code 2999-12-31} placeholder. The link is resolved once, when the
 * transaction is built (LM-444), and never written back into its proto.
 */
class TransactionLinkSecurityClassTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2026, 11, 4, 17, 0, 0, 0, ZoneId.of("America/New_York"));
    private static final LocalDate PLACEHOLDER = LocalDate.of(2999, 12, 31);

    private final Security.Fetcher originalFetcher = Security.getFetcher();
    private final List<UUID> ids = new ArrayList<>();
    private final AtomicInteger fetches = new AtomicInteger();

    @BeforeEach
    void noFetcher() {
        Security.setFetcher(null);
    }

    @AfterEach
    void restore() {
        Security.setFetcher(originalFetcher);
        ids.forEach(LinkCache.SECURITY::evict);
    }

    private UUID newId() {
        UUID id = UUID.randomUUID();
        ids.add(id);
        LinkCache.SECURITY.evict(id);
        return id;
    }

    private static SecurityProto bond(UUID id, ProductTypeProto type, LocalDate maturity) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(type)
                .setIssuerName("US Government")
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 1, 15)))
                        .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturity)))
                .build();
    }

    private static TransactionProto txnOn(SecurityProto security) {
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setSecurity(security)
                .build();
    }

    private static Transaction linkTxn(UUID securityId) {
        return new Transaction(txnOn(Security.linkOf(securityId, AS_OF)));
    }

    /** Counting stub fetcher that serves the given full protos by UUID. */
    private void serve(SecurityProto... full) {
        Security.setFetcher((id, asOf) -> {
            fetches.incrementAndGet();
            for (SecurityProto p : full) {
                if (ProtoSerializationUtil.deserializeUUID(p.getUuid()).equals(id)) return p;
            }
            return null;
        });
    }

    // ---- metric 1 ------------------------------------------------------

    @Test
    void treasuryNoteLink_resolvesToBondSecurity_withRealMaturity() {
        UUID id = newId();
        LocalDate maturity = LocalDate.of(2026, 11, 15);
        serve(bond(id, ProductTypeProto.TREASURY_NOTE, maturity));
        Transaction txn = linkTxn(id);

        Security security = txn.getSecurity();

        assertInstanceOf(BondSecurity.class, security);
        assertEquals(maturity, security.getField(Field.MATURITY_DATE));
        assertEquals(maturity, txn.getField(Field.MATURITY_DATE));
    }

    // ---- metric 2 ------------------------------------------------------

    static Stream<Arguments> bondSubclasses() {
        return Stream.of(
                Arguments.of(ProductTypeProto.TIPS, TIPSBond.class, LocalDate.of(2034, 7, 15)),
                Arguments.of(ProductTypeProto.TREASURY_FRN, FloatingRateNote.class, LocalDate.of(2027, 10, 31)),
                Arguments.of(ProductTypeProto.MORTGAGE_BACKED, MortgageBackedSecurity.class, LocalDate.of(2052, 3, 1)));
    }

    @ParameterizedTest
    @MethodSource("bondSubclasses")
    void tipsFrnMbsLinks_resolveToOwnClass_withOwnMaturity(ProductTypeProto type,
                                                          Class<? extends BondSecurity> expected,
                                                          LocalDate maturity) {
        UUID id = newId();
        serve(bond(id, type, maturity));
        Transaction txn = linkTxn(id);

        Security security = txn.getSecurity();

        assertEquals(expected, security.getClass());
        assertEquals(maturity, security.getField(Field.MATURITY_DATE));
        assertEquals(maturity, txn.getField(Field.MATURITY_DATE));
    }

    // ---- metric 3 / guardrail 4 ----------------------------------------

    @Test
    void noFetcher_maturityReadOnLink_raisesLinkModeError() {
        UUID id = newId();
        Transaction txn = linkTxn(id);

        Security security = assertDoesNotThrow(txn::getSecurity);
        assertNotNull(security);
        assertEquals(id, security.getID());
        assertEquals(AS_OF.toInstant(), security.getAsOf().toInstant());
        assertEquals(id, txn.getField(Field.SECURITY_ID));

        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> security.getField(Field.MATURITY_DATE));
        assertTrue(e.getMessage().contains("link-mode Security"), e.getMessage());
        assertTrue(e.getMessage().contains("no Security.Fetcher configured"), e.getMessage());
    }

    @Test
    void noFetcher_transactionGetFieldMaturity_raises() {
        Transaction txn = linkTxn(newId());

        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> txn.getField(Field.MATURITY_DATE));
        assertTrue(e.getMessage().contains("no Security.Fetcher configured"), e.getMessage());
    }

    // ---- guardrail 1 ---------------------------------------------------

    @Test
    void getProto_bytesUnchangedAfterResolve() {
        UUID id = newId();
        LocalDate maturity = LocalDate.of(2026, 11, 15);
        serve(bond(id, ProductTypeProto.TREASURY_NOTE, maturity));
        Transaction txn = linkTxn(id);

        byte[] before = txn.getProto().toByteArray();
        assertEquals(maturity, txn.getSecurity().getField(Field.MATURITY_DATE));
        assertEquals(maturity, txn.getField(Field.MATURITY_DATE));
        byte[] after = txn.getProto().toByteArray();

        assertArrayEquals(before, after);
        assertTrue(txn.getProto().getSecurity().getIsLink());
        assertFalse(txn.getProto().getSecurity().hasBondDetails());
    }

    // ---- guardrail 3 ---------------------------------------------------

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void repeatedGetSecurity_fetchesOnce(boolean fetcherWorks) {
        UUID id = newId();
        SecurityProto full = bond(id, ProductTypeProto.TREASURY_NOTE, LocalDate.of(2026, 11, 15));
        Security.setFetcher((u, t) -> {
            fetches.incrementAndGet();
            if (!fetcherWorks) throw new RuntimeException("SecurityService unavailable");
            return full;
        });
        Transaction txn = linkTxn(id);

        for (int i = 0; i < 3; i++) {
            Security security = txn.getSecurity();
            assertEquals(fetcherWorks, security instanceof BondSecurity);
        }

        assertEquals(1, fetches.get());
    }

    @Test
    void cacheHit_neverFetches() {
        UUID id = newId();
        LocalDate maturity = LocalDate.of(2026, 11, 15);
        LinkCache.SECURITY.put(id, bond(id, ProductTypeProto.TREASURY_NOTE, maturity), AS_OF);
        serve();
        Transaction txn = linkTxn(id);

        Security security = txn.getSecurity();

        assertInstanceOf(BondSecurity.class, security);
        assertEquals(maturity, security.getField(Field.MATURITY_DATE));
        assertEquals(0, fetches.get());
    }

    // ---- guardrail 4 ---------------------------------------------------

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void fetcherFails_getSecurityReturnsLinkWrapper(boolean fetcherThrows) {
        UUID id = newId();
        Security.setFetcher((u, t) -> {
            fetches.incrementAndGet();
            if (fetcherThrows) throw new RuntimeException("SecurityService unavailable");
            return null;
        });
        Transaction txn = linkTxn(id);

        Security security = assertDoesNotThrow(txn::getSecurity);
        assertNotNull(security);
        assertEquals(id, security.getID());
        assertEquals(AS_OF.toInstant(), security.getAsOf().toInstant());

        // The failure surfaces on the field read, never as the placeholder.
        assertThrows(RuntimeException.class, () -> security.getField(Field.MATURITY_DATE),
                "an unresolved link must raise, never return " + PLACEHOLDER);
        assertTrue(fetches.get() <= 2, "at most one retry on the failure path, got " + fetches.get());
    }
}
