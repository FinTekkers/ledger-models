package common.models.transaction;

import com.google.protobuf.ByteString;
import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-253: a Transaction built from a TransactionProto whose price has no UUID
 * (or no as_of) fills them once, at construction — parity with Python
 * {@code test_transaction_price_defaults.py} and JS
 * {@code transaction_price_defaults.test.ts}. Case names match across languages.
 */
class TransactionPriceDefaultsTest {

    private static final String AS_OF_RULE =
            "price.as_of defaults to the transaction's as_of (transaction.py / Price.create)";

    private static final LocalTimestampProto TXN_AS_OF = ProtoSerializationUtil.serializeTimestamp(
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York")));
    private static final LocalTimestampProto PRICE_AS_OF = ProtoSerializationUtil.serializeTimestamp(
            ZonedDateTime.of(2024, 6, 14, 16, 0, 0, 0, ZoneId.of("Europe/London")));

    private static PriceProto.Builder priceBuilder() {
        return PriceProto.newBuilder()
                .setObjectClass("Price")
                .setVersion("0.0.1")
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(new java.math.BigDecimal("99.5")))
                .setSecurity(DummyEquityObjects.getDummySecurity().getProto());
    }

    private static TransactionProto txnWithPrice(PriceProto.Builder price, boolean withTxnAsOf) {
        TransactionProto.Builder b = TransactionProto.newBuilder()
                .setObjectClass("Transaction")
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setPrice(price);
        if (withTxnAsOf) b.setAsOf(TXN_AS_OF);
        return b.build();
    }

    private static void assertSixteenBytes(PriceProto price) {
        assertTrue(price.hasUuid(), "price uuid should be set");
        assertEquals(16, price.getUuid().getRawUuid().size(), "price uuid should be 16 bytes");
    }

    @Test
    void missing_price_uuid_is_filled() {
        Transaction txn = new Transaction(txnWithPrice(priceBuilder().setAsOf(PRICE_AS_OF), true));

        assertSixteenBytes(txn.getRawProto().getPrice());
        // getProto() strips to a link; the link must carry the filled UUID.
        PriceProto link = txn.getProto().getPrice();
        assertTrue(link.getIsLink());
        assertSixteenBytes(link);
        assertEquals(txn.getRawProto().getPrice().getUuid(), link.getUuid());
        // The LS-17 failure path: serializing the Price POJO must not throw.
        PriceProto serialized = assertDoesNotThrow(
                () -> PriceSerializer.getInstance().serialize(txn.getPrice()));
        assertEquals(txn.getRawProto().getPrice().getUuid(), serialized.getUuid());
    }

    @Test
    void empty_raw_uuid_is_treated_as_missing() {
        PriceProto.Builder price = priceBuilder().setAsOf(PRICE_AS_OF)
                .setUuid(UUIDProto.newBuilder().setRawUuid(ByteString.EMPTY));
        Transaction txn = new Transaction(txnWithPrice(price, true));

        assertSixteenBytes(txn.getRawProto().getPrice());
        assertDoesNotThrow(() -> PriceSerializer.getInstance().serialize(txn.getPrice()));
    }

    @Test
    void price_uuid_is_assigned_once() {
        Transaction txn = new Transaction(txnWithPrice(priceBuilder().setAsOf(PRICE_AS_OF), true));

        assertEquals(txn.getRawProto().getPrice().getUuid(), txn.getRawProto().getPrice().getUuid());
        assertEquals(txn.getProto().getPrice().getUuid(), txn.getProto().getPrice().getUuid());
        assertEquals(PriceSerializer.getInstance().serialize(txn.getPrice()).getUuid(),
                PriceSerializer.getInstance().serialize(txn.getPrice()).getUuid());
    }

    @Test
    void round_trip_keeps_price_uuid() {
        Transaction first = new Transaction(txnWithPrice(priceBuilder().setAsOf(PRICE_AS_OF), true));
        Transaction second = new Transaction(first.getRawProto());

        assertEquals(first.getRawProto().getPrice().getUuid(), second.getRawProto().getPrice().getUuid());
        assertDoesNotThrow(() -> PriceSerializer.getInstance().serialize(second.getPrice()));
    }

    @Test
    void existing_price_uuid_is_kept() {
        UUID existing = UUID.randomUUID();
        PriceProto.Builder price = priceBuilder().setAsOf(PRICE_AS_OF)
                .setUuid(ProtoSerializationUtil.serializeUUID(existing));
        Transaction txn = new Transaction(txnWithPrice(price, true));

        assertEquals(existing, ProtoSerializationUtil.deserializeUUID(txn.getRawProto().getPrice().getUuid()));
        assertEquals(existing, ProtoSerializationUtil.deserializeUUID(txn.getProto().getPrice().getUuid()));
        assertEquals(existing, txn.getPrice().getID());
    }

    @Test
    void missing_price_as_of_defaults_to_transaction_as_of() {
        Transaction txn = new Transaction(txnWithPrice(priceBuilder(), true));

        assertEquals(TXN_AS_OF, txn.getRawProto().getPrice().getAsOf(), AS_OF_RULE);
        assertEquals(TXN_AS_OF, txn.getProto().getPrice().getAsOf(), AS_OF_RULE);
        assertEquals(txn.getRawProto().getPrice().getAsOf(), txn.getRawProto().getPrice().getAsOf());
        assertEquals(txn.getProto().getPrice().getAsOf(), txn.getProto().getPrice().getAsOf());
    }

    @Test
    void existing_price_as_of_is_kept() {
        Transaction txn = new Transaction(txnWithPrice(priceBuilder().setAsOf(PRICE_AS_OF), true));

        assertEquals(PRICE_AS_OF, txn.getRawProto().getPrice().getAsOf());
        assertEquals(PRICE_AS_OF, txn.getProto().getPrice().getAsOf());
    }

    @Test
    void no_as_of_anywhere_is_rejected() {
        // LM-272: the LS-17 shape. Rejected up front, naming the transaction
        // field; the price is never given a default as_of.
        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> new Transaction(txnWithPrice(priceBuilder(), false)));
        assertEquals(ModelValidationException.class, e.getClass());
        assertEquals("transaction.as_of", e.getField());
    }

    @Test
    void link_price_passes_through_unchanged() {
        PriceProto link = PriceProto.newBuilder().setIsLink(true).build();
        Transaction txn = new Transaction(txnWithPrice(link.toBuilder(), true));

        assertEquals(link, txn.getRawProto().getPrice());
        assertEquals(link, txn.getProto().getPrice());
    }

    @Test
    void serialize_uuid_null_still_throws() {
        assertThrows(NullPointerException.class, () -> ProtoSerializationUtil.serializeUUID(null));
    }
}
