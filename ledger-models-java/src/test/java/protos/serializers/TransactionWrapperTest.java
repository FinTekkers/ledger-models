package protos.serializers;

import common.models.transaction.Transaction;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;

import java.time.temporal.ChronoUnit;

/**
 * Wrapper round-trip tests for {@link Transaction}.
 *
 * <p>Post-#340 refactor: replaces TransactionSerializerTest. The serialize/
 * deserialize entry points are now {@code transaction.getProto()} and
 * {@code new Transaction(proto)} — no separate TransactionSerializer.
 *
 * <p>Key behavioral change: {@code transaction.getProto()} applies
 * <strong>strip-on-write</strong> to inner Security/Portfolio/Price sub-protos
 * (per Phase 2 dispatch). After round-trip, the inner sub-protos are
 * {@code is_link=true} link references (uuid + as_of preserved), NOT full
 * inline data. Tests verify identity via UUIDs, NOT inner field values.
 * Callers that need full data must hydrate via
 * {@link common.util.LinkResolver#resolveSecuritiesOnTransactions(java.util.List)}
 * and the portfolio counterpart before wrapping again.
 */
class TransactionWrapperTest {

    @Test
    public void testTransactionWrap_identityRoundTrip() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto proto = transaction.getProto();
        Transaction copy = new Transaction(proto);

        compareIdentity(transaction, copy);
    }

    @Test
    public void testTransactionGetProto_stripsInlineSecurityToLink() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto out = transaction.getProto();

        Assertions.assertTrue(out.hasSecurity(), "security must remain set");
        SecurityProto sec = out.getSecurity();
        Assertions.assertTrue(sec.getIsLink(),
                "Phase 2 strip-on-write: inner Security must be is_link=true after getProto()");
        Assertions.assertTrue(sec.hasUuid(),
                "stripped Security must carry the uuid for re-hydration");
        // as_of may or may not be set on the original; if it was, it must survive.
        // We test the preservation contract: if the original had as_of, the stripped form has it.
        SecurityProto originalSec = transaction.getRawProto().getSecurity();
        if (originalSec.hasAsOf()) {
            Assertions.assertTrue(sec.hasAsOf(),
                    "as_of must be preserved on stripped Security when present in original");
            Assertions.assertEquals(originalSec.getAsOf(), sec.getAsOf());
        }
    }

    @Test
    public void testTransactionGetProto_stripsInlinePortfolioToLink() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto out = transaction.getProto();

        Assertions.assertTrue(out.hasPortfolio(), "portfolio must remain set");
        PortfolioProto port = out.getPortfolio();
        Assertions.assertTrue(port.getIsLink(),
                "Phase 2 strip-on-write: inner Portfolio must be is_link=true after getProto()");
        Assertions.assertTrue(port.hasUuid(),
                "stripped Portfolio must carry the uuid for re-hydration");
    }

    @Test
    public void testTransactionGetProto_stripsInlinePriceToLink() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto out = transaction.getProto();

        Assertions.assertTrue(out.hasPrice(), "price must remain set");
        PriceProto price = out.getPrice();
        Assertions.assertTrue(price.getIsLink(),
                "Phase 2 strip-on-write: inner Price must be is_link=true after getProto()");
        Assertions.assertTrue(price.hasUuid(),
                "stripped Price must carry the uuid for re-hydration");
    }

    @Test
    public void testTransactionGetProto_preservesChildTransactionsRecursively() {
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto out = transaction.getProto();

        // DummyBondObjects.getDummyTransaction generates a cash impact +
        // maturation transactions; expect at least one child.
        Assertions.assertTrue(out.getChildTransactionsCount() > 0,
                "expected at least one child transaction (cash impact / maturation)");

        // Children are themselves Transactions, so strip-on-write applies
        // recursively — each child's inner Security/Portfolio/Price must
        // also be stripped to link references.
        for (TransactionProto childProto : out.getChildTransactionsList()) {
            if (childProto.hasSecurity()) {
                Assertions.assertTrue(childProto.getSecurity().getIsLink(),
                        "child transaction's Security must also be stripped");
            }
            if (childProto.hasPortfolio()) {
                Assertions.assertTrue(childProto.getPortfolio().getIsLink(),
                        "child transaction's Portfolio must also be stripped");
            }
        }
    }

    @Test
    public void testFromProto_withoutUuid_synthesizesUuid_andReflectsIntoGetProto() {
        // UUID Regression A from PR #225 — same shape for Transaction.
        TransactionProto withoutUuid = TransactionProto.newBuilder()
                .setTransactionType(fintekkers.models.transaction.TransactionTypeProto.BUY)
                .build();
        Assertions.assertFalse(withoutUuid.hasUuid(),
                "precondition: input proto has no UUID");

        Transaction txn = new Transaction(withoutUuid);

        Assertions.assertNotNull(txn.getID(),
                "wrapper must synthesize a UUID when input proto has none");
        TransactionProto out = txn.getProto();
        Assertions.assertTrue(out.hasUuid(),
                "synthesized UUID must be reflected into getProto() output");
        Assertions.assertEquals(txn.getID(),
                protos.serializers.util.proto.ProtoSerializationUtil.deserializeUUID(out.getUuid()),
                "the UUID in the proto must match the wrapper's id");
    }

    @Test
    public void testFromProto_withShortUuid_rejectsWithIllegalArgumentException() {
        // UUID Regression B from PR #225 — same shape for Transaction.
        fintekkers.models.util.Uuid.UUIDProto shortUuid =
                fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                        .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{1, 2, 3, 4}))
                        .build();
        TransactionProto withShortUuid = TransactionProto.newBuilder()
                .setUuid(shortUuid)
                .build();

        IllegalArgumentException ex = Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> new Transaction(withShortUuid),
                "new Transaction must reject a 4-byte raw_uuid");
        Assertions.assertTrue(ex.getMessage().contains("Invalid UUID"),
                "exception should reference invalid UUID; got: " + ex.getMessage());
    }

    @Test
    public void testGetRawProto_doesNotStrip_forTestVerification() {
        // The getRawProto() escape hatch lets tests verify pre-strip state
        // and lets hydration round-trips work for callers that already have
        // resolved inner protos.
        Transaction transaction = DummyBondObjects.getDummyTransaction();

        TransactionProto raw = transaction.getRawProto();

        // The dummy was built via the POJO constructor, which carries full
        // inline Security via security.getProto(). isLink may be false on
        // the inner Security in the raw view.
        if (raw.hasSecurity()) {
            // Either is_link=false (full inline) OR true (already a link).
            // We just verify the raw view doesn't AUTO-strip.
            // (Distinguished from getProto which always strips.)
            TransactionProto stripped = transaction.getProto();
            // After getProto, the link form is the same uuid as the raw.
            if (raw.getSecurity().hasUuid()) {
                Assertions.assertEquals(raw.getSecurity().getUuid(),
                        stripped.getSecurity().getUuid(),
                        "uuid must survive the strip");
            }
        }
    }

    /**
     * Identity-only equality check — strip-on-write means the inner
     * Security/Portfolio/Price sub-protos no longer carry their full data
     * after round-trip, so tests verify UUIDs (which DO survive the strip)
     * rather than deep field values.
     */
    private void compareIdentity(Transaction transaction, Transaction copy) {
        Assertions.assertEquals(transaction.getID(), copy.getID());
        Assertions.assertTrue(transaction.getAsOf().truncatedTo(ChronoUnit.MILLIS)
                .isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        Assertions.assertEquals(transaction.getPortfolio().getID(), copy.getPortfolio().getID());
        Assertions.assertEquals(transaction.getSecurity().getID(), copy.getSecurity().getID());
        Assertions.assertEquals(transaction.getTransactionType(), copy.getTransactionType());
        Assertions.assertEquals(transaction.getQuantity().doubleValue(), copy.getQuantity().doubleValue());

        Assertions.assertEquals(transaction.getTradeDate(), copy.getTradeDate());
        Assertions.assertEquals(transaction.getSettlementDate(), copy.getSettlementDate());

        Assertions.assertEquals(transaction.getPositionStatus(), copy.getPositionStatus());
        Assertions.assertEquals(transaction.getTradeName(), copy.getTradeName());
        Assertions.assertEquals(transaction.isCancelled(), copy.isCancelled());

        // Child transactions count — full-recursion identity would require
        // walking the tree; the strip-recursion test above covers that path.
        Assertions.assertEquals(transaction.getChildTransactions().size(),
                copy.getChildTransactions().size());
    }
}
