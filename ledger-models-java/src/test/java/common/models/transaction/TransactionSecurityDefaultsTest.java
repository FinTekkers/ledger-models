package common.models.transaction;

import common.models.security.Security;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-276: a Transaction built from a TransactionProto whose inline security
 * (or that security's inline settlement_currency) has no UUID fills it once,
 * at construction — parity with Python
 * {@code test_transaction_security_defaults.py}, JS
 * {@code transaction_security_defaults.test.ts} and the Rust transaction
 * tests. Case names match across languages.
 */
class TransactionSecurityDefaultsTest {

    private static final LocalTimestampProto AS_OF = ProtoSerializationUtil.serializeTimestamp(
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York")));

    private final Security.Fetcher originalFetcher = Security.getFetcher();

    @AfterEach
    void restoreFetcher() {
        Security.setFetcher(originalFetcher);
    }

    private static SecurityProto.Builder currencyBuilder() {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setAsOf(AS_OF)
                .setProductType(ProductTypeProto.CURRENCY)
                .setAssetClass("Cash")
                .setIssuerName("US Dollar");
    }

    /** LS-17's payload shape: an inline CORP_BOND with no uuid, as_of set. */
    private static SecurityProto.Builder bondBuilder() {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setAsOf(AS_OF)
                .setProductType(ProductTypeProto.CORP_BOND)
                .setAssetClass("Fixed Income")
                .setIssuerName("ACME Corp")
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setCouponRate(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("6.25")))
                        .setCouponType(CouponTypeProto.FIXED)
                        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                        .setFaceValue(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("1000")))
                        .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2020, 1, 15)))
                        .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2030, 1, 15))))
                .setSettlementCurrency(currencyBuilder());
    }

    private static TransactionProto txnWithSecurity(SecurityProto.Builder security) {
        return TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(AS_OF)
                .setSecurity(security)
                .build();
    }

    private static UUID uuidOf(SecurityProto security) {
        return ProtoSerializationUtil.deserializeUUID(security.getUuid());
    }

    @Test
    void missing_security_uuid_is_filled_and_stable() {
        TransactionProto input = txnWithSecurity(bondBuilder());
        Transaction txn = new Transaction(input);

        UUID first = txn.getSecurity().getID();
        assertNotNull(first);
        assertEquals(first, txn.getSecurity().getID());
        assertEquals(first, txn.getSecurity().getID());
        assertEquals(first, uuidOf(txn.getProto().getSecurity()));
        assertEquals(16, txn.getRawProto().getSecurity().getUuid().getRawUuid().size());
        // The caller's proto is not mutated.
        assertFalse(input.getSecurity().hasUuid());
    }

    @Test
    void missing_settlement_currency_uuid_is_filled_and_stable() {
        Transaction txn = new Transaction(txnWithSecurity(bondBuilder()));

        UUID first = txn.getSecurity().getSettlementCurrency().getID();
        assertNotNull(first);
        assertEquals(first, txn.getSecurity().getSettlementCurrency().getID());
        assertEquals(first, txn.getSecurity().getSettlementCurrency().getID());
        // getProto() strips the security to a link, so read the currency raw.
        SecurityProto currency = txn.getRawProto().getSecurity().getSettlementCurrency();
        assertEquals(16, currency.getUuid().getRawUuid().size());
        assertEquals(first, uuidOf(currency));
    }

    @Test
    void existing_security_uuid_is_kept() {
        UUID securityId = UUID.randomUUID();
        UUID currencyId = UUID.randomUUID();
        SecurityProto.Builder security = bondBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(securityId))
                .setSettlementCurrency(currencyBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(currencyId)));
        TransactionProto input = txnWithSecurity(security);
        Transaction txn = new Transaction(input);

        assertEquals(input.getSecurity().getUuid(), txn.getRawProto().getSecurity().getUuid());
        assertEquals(input.getSecurity().getSettlementCurrency().getUuid(),
                txn.getRawProto().getSecurity().getSettlementCurrency().getUuid());
        assertEquals(securityId, txn.getSecurity().getID());
        assertEquals(securityId, uuidOf(txn.getProto().getSecurity()));
        assertEquals(currencyId, txn.getSecurity().getSettlementCurrency().getID());
    }

    @Test
    void link_security_gets_no_uuid() {
        SecurityProto.Builder link = SecurityProto.newBuilder().setIsLink(true).setAsOf(AS_OF)
                .setSettlementCurrency(currencyBuilder());
        TransactionProto input = txnWithSecurity(link);
        Transaction txn = new Transaction(input);

        assertEquals(input.getSecurity(), txn.getRawProto().getSecurity());
        assertFalse(txn.getRawProto().getSecurity().hasUuid());
        assertFalse(txn.getRawProto().getSecurity().getSettlementCurrency().hasUuid());
    }

    @Test
    void link_settlement_currency_gets_no_uuid() {
        SecurityProto.Builder security = bondBuilder()
                .setSettlementCurrency(SecurityProto.newBuilder().setIsLink(true));
        Transaction txn = new Transaction(txnWithSecurity(security));

        SecurityProto raw = txn.getRawProto().getSecurity();
        assertEquals(16, raw.getUuid().getRawUuid().size());
        assertTrue(raw.getSettlementCurrency().getIsLink());
        assertFalse(raw.getSettlementCurrency().hasUuid());
    }

    @Test
    void ls17_inline_bond_without_uuid_round_trips_to_a_resolvable_link() {
        AtomicInteger fetches = new AtomicInteger();
        Security.setFetcher((id, asOf) -> {
            fetches.incrementAndGet();
            throw new AssertionError("unexpected fetch for security " + id);
        });
        Transaction txn = new Transaction(txnWithSecurity(bondBuilder()));

        SecurityProto link = txn.getProto().getSecurity();
        assertTrue(link.getIsLink());
        assertEquals(txn.getSecurity().getID(), uuidOf(link));

        assertFalse(Security.fromProto(link).isCash());
        assertEquals(0, fetches.get());
    }
}
