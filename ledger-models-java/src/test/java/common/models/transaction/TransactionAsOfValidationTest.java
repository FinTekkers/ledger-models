package common.models.transaction;

import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-272: a transaction with no as_of, or a blank as_of time zone, is
 * rejected with {@link ModelValidationException} naming the field (LS-17 used
 * to surface a bare IllegalArgumentException from the price as INTERNAL).
 * The error is never swallowed and as_of is never defaulted.
 */
class TransactionAsOfValidationTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));

    /** A full, valid non-link BUY with no cash impact yet. */
    private static TransactionProto validProto() {
        Transaction txn = new Transaction(UUID.randomUUID(),
                DummyEquityObjects.getDummyPortfolio(),
                common.models.price.Price.getPrice(BigDecimal.TEN, DummyEquityObjects.getDummySecurity()),
                LocalDate.of(2024, 6, 15), LocalDate.of(2024, 6, 17),
                BigDecimal.TEN, DummyEquityObjects.getDummySecurity(), TransactionType.BUY,
                null, AS_OF, null, "No Trade Name", EXECUTED);
        return txn.getRawProto();
    }

    private static void assertTypedError(String field, ModelValidationException e) {
        assertEquals(ModelValidationException.class, e.getClass());
        assertEquals(field, e.getField());
    }

    @Test
    void ls17_noAsOfOnTransactionOrPrice_rejectsNamingTransactionAsOf() {
        TransactionProto proto = validProto().toBuilder()
                .clearAsOf()
                .setPrice(validProto().getPrice().toBuilder().clearAsOf())
                .build();

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> new Transaction(proto));
        assertTypedError("transaction.as_of", e);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankTimeZone_rejectsNamingTransactionAsOfTimeZone(String zone) {
        TransactionProto valid = validProto();
        TransactionProto proto = valid.toBuilder()
                .setAsOf(valid.getAsOf().toBuilder().setTimeZone(zone))
                .build();

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> new Transaction(proto));
        assertTypedError("transaction.as_of.time_zone", e);
    }

    @Test
    void validAsOf_isUnchanged() {
        Transaction txn = new Transaction(validProto());

        assertEquals(AS_OF, txn.getAsOf());
    }

    @Test
    void linkStubWithoutAsOf_stillBuilds() {
        TransactionProto link = TransactionProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .build();

        Transaction txn = assertDoesNotThrow(() -> new Transaction(link));

        assertNull(txn.getAsOf());
        assertFalse(txn.getRawProto().hasAsOf());
    }

    @Test
    void addCashImpact_blankPriceTimeZone_propagatesAndAddsNoCashChild() {
        TransactionProto valid = validProto();
        PriceProto price = valid.getPrice().toBuilder()
                .setAsOf(LocalTimestampProto.newBuilder(valid.getPrice().getAsOf()).setTimeZone(""))
                .build();
        Transaction txn = new Transaction(valid.toBuilder().setPrice(price).build());

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> Transaction.addCashImpact(txn));
        assertTypedError("price.as_of.time_zone", e);
        assertTrue(txn.getChildTransactions().isEmpty());
    }

    @Test
    void childWithoutAsOf_rejectsWholeParent() {
        TransactionProto child = validProto().toBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .clearAsOf()
                .build();
        TransactionProto parent = validProto().toBuilder().addChildTransactions(child).build();

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> new Transaction(parent));
        assertTypedError("transaction.as_of", e);
    }
}
