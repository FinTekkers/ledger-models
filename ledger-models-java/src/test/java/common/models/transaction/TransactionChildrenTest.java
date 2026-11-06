package common.models.transaction;

import common.models.errors.ModelValidationException;
import common.models.errors.transaction.InvalidChildTransactionException;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** LM-438: a transaction has at most one cash child, refused when it is added. */
class TransactionChildrenTest {

    /** Long-form ctor: no cash or derived children. */
    private static Transaction trade(Security security, TransactionType type, BigDecimal quantity, Transaction parent) {
        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(99), security, ZonedDateTime.now());
        return new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(), price,
                LocalDate.now(), LocalDate.now().plusDays(2), quantity,
                security, type, null, ZonedDateTime.now(), parent,
                "No trade name", PositionStatusProto.HYPOTHETICAL);
    }

    private static Transaction equityBuy() {
        return trade(DummyEquityObjects.getDummySecurity(), TransactionType.BUY, BigDecimal.TEN, null);
    }

    private static Transaction cashChild(Transaction parent) {
        return trade(CashSecurity.USD, TransactionType.WITHDRAWAL, BigDecimal.valueOf(990), parent);
    }

    private static BondSecurity bond() {
        BondSecurity security = new BondSecurity(UUID.randomUUID(), "Issuer", ZonedDateTime.now(), CashSecurity.USD);
        security.setFaceValue(BigDecimal.valueOf(1000));
        security.setIssueDate(LocalDate.now().minusYears(1));
        security.setMaturityDate(LocalDate.now().plusYears(5));
        return security;
    }

    /** Short-form ctor: adds the cash child, and for a bond the maturation and its cash child. */
    private static Transaction bondBuy() {
        BondSecurity security = bond();
        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(99), security, ZonedDateTime.now());
        return new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(), price,
                LocalDate.now(), LocalDate.now().plusDays(2), BigDecimal.valueOf(100_000),
                security, TransactionType.BUY, null, ZonedDateTime.now());
    }

    private static void assertNames(InvalidChildTransactionException e, UUID... ids) {
        for (UUID id : ids) assertTrue(e.getMessage().contains(id.toString()), id + " not in: " + e.getMessage());
        assertEquals(InvalidChildTransactionException.CHILD_TRANSACTIONS, e.getField());
        assertEquals(e.getParentId(), e.getObjectId());
        assertEquals(1, e.getViolations().size());
    }

    @Test
    void addChildTransaction_secondCash_throwsTypedErrorNamingParentAndBothChildren() {
        Transaction parent = equityBuy();
        Transaction first = cashChild(parent);
        parent.addChildTransaction(first);
        Transaction second = cashChild(parent);

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> parent.addChildTransaction(second));
        assertInstanceOf(ModelValidationException.class, e);
        assertInstanceOf(IllegalArgumentException.class, e);
        assertEquals(parent.getID(), e.getParentId());
        assertEquals(second.getID(), e.getChildId());
        assertEquals(first.getID(), e.getOtherId());
        assertNames(e, parent.getID(), first.getID(), second.getID());
        assertTrue(e.getMessage().contains("already has a cash impact"));
        assertEquals(List.of(first), parent.getChildTransactions());
    }

    @Test
    void addCashImpactTwice_throwsTypedErrorNamingParentAndBothChildren() {
        Transaction parent = equityBuy();
        Transaction.addCashImpact(parent);
        Transaction first = parent.getCashTransaction();
        assertNotNull(first);

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> Transaction.addCashImpact(parent));
        assertEquals(first.getID(), e.getOtherId());
        assertNotEquals(first.getID(), e.getChildId());
        assertNames(e, parent.getID(), first.getID(), e.getChildId());
        assertEquals(1, parent.getChildTransactions().size());
    }

    @Test
    void bondBuy_secondCashOnMaturation_throwsTypedErrorNamingMaturationAndBothChildren() {
        Transaction buy = bondBuy();
        Transaction maturation = buy.getChildTransactions().stream()
                .filter(t -> t.getTransactionType() == TransactionType.MATURATION)
                .findFirst().orElseThrow();
        Transaction first = maturation.getCashTransaction();
        assertNotNull(first);

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> Transaction.addCashImpact(maturation));
        assertEquals(maturation.getID(), e.getParentId());
        assertEquals(first.getID(), e.getOtherId());
        assertNames(e, maturation.getID(), first.getID(), e.getChildId());
        assertEquals(1, maturation.getChildTransactions().size());
    }

    @Test
    void addChildTransaction_childOfAnotherTransaction_throwsWrongParent() {
        Transaction parent = equityBuy();
        Transaction other = equityBuy();
        Transaction child = cashChild(other);

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> parent.addChildTransaction(child));
        assertEquals(child.getID(), e.getChildId());
        assertEquals(other.getID(), e.getOtherId());
        assertNames(e, parent.getID(), child.getID(), other.getID());
        assertSame(other, child.getParentTransaction());
        assertTrue(parent.getChildTransactions().isEmpty());
    }

    @Test
    void addChildTransaction_nullParent_getsThisTransactionAsParent() {
        Transaction parent = equityBuy();
        Transaction child = cashChild(null);
        assertNull(child.getParentTransaction());

        parent.addChildTransaction(child);
        assertSame(parent, child.getParentTransaction());
        assertSame(child, parent.getCashTransaction());
    }

    @Test
    void addChildTransaction_sameInstanceTwice_throwsDuplicateId() {
        Transaction parent = bondBuy();
        Transaction maturation = parent.getChildTransactions().get(1);

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> parent.addChildTransaction(maturation));
        assertEquals(maturation.getID(), e.getChildId());
        assertNames(e, parent.getID(), maturation.getID());
        assertEquals(2, parent.getChildTransactions().size());
    }

    @Test
    void addChildTransaction_repeatedId_throwsDuplicateId() {
        Transaction parent = equityBuy();
        Transaction first = trade(bond(), TransactionType.MATURATION, BigDecimal.valueOf(1000), parent);
        parent.addChildTransaction(first);
        TransactionProto copy = first.getProto().toBuilder().clearChildTransactions().build();
        Transaction sameId = new Transaction(copy);
        assertEquals(first.getID(), sameId.getID());

        InvalidChildTransactionException e = assertThrows(InvalidChildTransactionException.class,
                () -> parent.addChildTransaction(sameId));
        assertNames(e, parent.getID(), first.getID());
    }

    @Test
    void oneOrNoCashChild_buildsAsToday() {
        Transaction none = equityBuy();
        assertNull(none.getCashTransaction());
        assertTrue(none.getChildTransactions().isEmpty());

        Transaction one = DummyEquityObjects.getDummyTransaction();
        assertEquals(1, one.getChildTransactions().size());
        Transaction cash = one.getCashTransaction();
        assertNotNull(cash);
        assertSame(one, cash.getParentTransaction());
    }

    @Test
    void bondBuy_noLinkResolver_buildsOneMaturationWithOneCashChild() {
        Security.Fetcher previous = Security.getFetcher();
        Security.setFetcher((uuid, asOf) -> fail("building a bond BUY must not fetch a security"));
        try {
            Transaction buy = bondBuy();
            assertEquals(2, buy.getChildTransactions().size());
            assertNotNull(buy.getCashTransaction());
            List<Transaction> maturations = buy.getChildTransactions().stream()
                    .filter(t -> t.getTransactionType() == TransactionType.MATURATION).toList();
            assertEquals(1, maturations.size());
            Transaction maturation = maturations.get(0);
            assertEquals(1, maturation.getChildTransactions().size());
            assertNotNull(maturation.getCashTransaction());
        } finally {
            Security.setFetcher(previous);
        }
    }

    @Test
    void storedTwoCashChildren_loadsAndGetCashTransactionNamesParentAndBothChildren() throws Exception {
        TransactionProto stored = TransactionChildrenFixture.proto("two_cash_children");
        Transaction loaded = assertDoesNotThrow(() -> new Transaction(stored));
        assertEquals(2, loaded.getChildTransactions().size());

        RuntimeException e = assertThrows(RuntimeException.class, loaded::getCashTransaction);
        assertFalse(e instanceof ModelValidationException, "read-time guard stays a plain RuntimeException");
        assertEquals(RuntimeException.class, e.getClass());
        for (TransactionProto p : List.of(stored, stored.getChildTransactions(0), stored.getChildTransactions(1))) {
            String id = ProtoSerializationUtil.deserializeUUID(p.getUuid()).toString();
            assertTrue(e.getMessage().contains(id), id + " not in: " + e.getMessage());
        }
    }

    @Test
    void validBuyAndSell_serializeToGoldenBytes() throws Exception {
        for (String name : List.of("valid_buy", "valid_sell")) {
            byte[] golden = Files.readAllBytes(TransactionChildrenFixture.DIR.resolve(name + ".bin"));
            byte[] actual = new Transaction(TransactionChildrenFixture.proto(name)).getProto().toByteArray();
            assertArrayEquals(golden, actual, name);
        }
    }
}
