package common.models.transaction;

import com.google.protobuf.Message;
import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.strategy.StrategyAllocation;
import common.util.ObjectTypes;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.security.CashDetailsProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.ObjectTypeProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-444 metric 1. On 6 Nov two ledger-service threads (the database writer and
 * a GetByIds handler) serialised the same BUY at once; the #340 wrapper used
 * one shared builder as scratch space, so stored rows had 0, 3 or 4 children
 * instead of 2. Each {@code getProto()} must now build a fresh proto and only
 * read the transaction.
 */
class TransactionConcurrentSerializeTest {

    private static final int THREADS = 16;
    private static final int CALLS = 10_000;
    private static final int READERS = 4;

    private static final ZonedDateTime AS_OF = TransactionGoldenFixtures.AS_OF;
    private static final UUID BUY_ID = UUID.fromString("0b0e0000-0000-4000-8000-000000000001");
    private static final UUID CASH_ID = UUID.fromString("0b0e0000-0000-4000-8000-000000000002");
    private static final UUID MATURITY_ID = UUID.fromString("0b0e0000-0000-4000-8000-000000000003");
    private static final UUID BOND_ID = UUID.fromString("0b0e0000-0000-4000-8000-0000000000b1");
    private static final UUID CASH_SECURITY_ID = UUID.fromString("0b0e0000-0000-4000-8000-0000000000c1");

    /**
     * A cash security whose proto has no product_type, so its own
     * {@code getProto()} takes the overlay path (Architecture review, Concern 1).
     */
    private static CashSecurity unknownTypeCash() {
        return new CashSecurity(ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY)
                .setUuid(ProtoSerializationUtil.serializeUUID(CASH_SECURITY_ID))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setIssuerName("USD")
                .setCashDetails(CashDetailsProto.newBuilder().setCashId("USD"))
                .build());
    }

    /**
     * A BUY with a cash child and a maturity child, built the way
     * CreateOrUpdate builds one. The BondSecurity is shared with the maturity
     * child, as {@code addMaturationTransaction} does.
     */
    @SuppressWarnings("deprecation")
    private static Transaction buy(BondSecurity bond, CashSecurity cash) {
        Portfolio portfolio = TransactionGoldenFixtures.portfolio();
        StrategyAllocation strategy = TransactionGoldenFixtures.strategy();
        Price price = new Price(TransactionGoldenFixtures.PRICE_ID, new BigDecimal("99.015625"), bond, AS_OF);
        LocalDate trade = TransactionGoldenFixtures.TRADE_DATE;
        LocalDate settle = TransactionGoldenFixtures.SETTLEMENT_DATE;

        Transaction buy = new Transaction(BUY_ID, portfolio, price, trade, settle, new BigDecimal("1000000.00"),
                bond, TransactionType.BUY, strategy, AS_OF, null, "SOMA", PositionStatusProto.EXECUTED);
        Transaction cashChild = new Transaction(CASH_ID, portfolio,
                new Price(TransactionGoldenFixtures.CASH_PRICE_ID, BigDecimal.ONE, cash, AS_OF), trade, settle,
                new BigDecimal("990156.25"), cash, TransactionType.WITHDRAWAL, strategy, AS_OF, buy, "SOMA",
                PositionStatusProto.EXECUTED);
        Transaction maturity = new Transaction(MATURITY_ID, portfolio, price, bond.getMaturityDate(),
                bond.getMaturityDate().plusDays(2), new BigDecimal("1000000.00"), bond, TransactionType.MATURATION,
                strategy, AS_OF, buy, "SOMA", PositionStatusProto.EXECUTED);
        buy.addChildTransaction(cashChild);
        buy.addChildTransaction(maturity);
        // CreateOrUpdate writes fields after construction (createCashTransaction
        // does the same on the cash leg).
        buy.setPositionStatus(PositionStatusProto.EXECUTED);
        cashChild.setPositionStatus(PositionStatusProto.EXECUTED);
        maturity.setPositionStatus(PositionStatusProto.EXECUTED);
        return buy;
    }

    @Test
    void sixteenThreads_getProto_everyResultIsTheBaseline_andNothingSharedChanges() throws Exception {
        BondSecurity bond = new BondSecurity(BOND_ID, "US Treasury", AS_OF, CashSecurity.USD);
        bond.setFaceValue(BigDecimal.valueOf(1000));
        bond.setIssueDate(LocalDate.of(2024, 11, 15));
        bond.setMaturityDate(LocalDate.of(2031, 11, 15));
        CashSecurity cash = unknownTypeCash();

        Transaction buy = buy(bond, cash);
        List<Transaction> childrenBefore = new ArrayList<>(buy.getChildTransactions());
        byte[] baseline = buy.getProto().toByteArray();
        byte[] bondBefore = bond.getProto().toByteArray();
        byte[] cashBefore = cash.getProto().toByteArray();
        assertEquals(2, TransactionProto.parseFrom(baseline).getChildTransactionsCount());

        CyclicBarrier start = new CyclicBarrier(THREADS + READERS);
        AtomicInteger wrongChildren = new AtomicInteger();
        AtomicInteger wrongBytes = new AtomicInteger();
        AtomicInteger errors = new AtomicInteger();
        AtomicReference<Throwable> firstError = new AtomicReference<>();
        AtomicBoolean writersDone = new AtomicBoolean();
        List<Thread> writers = new ArrayList<>();
        List<Thread> readers = new ArrayList<>();

        for (int t = 0; t < THREADS; t++) {
            writers.add(new Thread(() -> {
                try {
                    start.await();
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                }
                for (int i = 0; i < CALLS; i++) {
                    try {
                        TransactionProto out = buy.getProto();
                        if (out.getChildTransactionsCount() != 2
                                || !CASH_ID.equals(idOf(out.getChildTransactions(0)))
                                || !MATURITY_ID.equals(idOf(out.getChildTransactions(1)))) {
                            wrongChildren.incrementAndGet();
                        }
                        if (!Arrays.equals(baseline, out.toByteArray())) wrongBytes.incrementAndGet();
                    } catch (RuntimeException e) {
                        errors.incrementAndGet();
                        firstError.compareAndSet(null, e);
                    }
                }
            }));
        }
        // The GetByIds side: build from the stored bytes and read every getter
        // of the shared transaction while the writers serialise it.
        for (int t = 0; t < READERS; t++) {
            readers.add(new Thread(() -> {
                try {
                    start.await();
                    while (!writersDone.get()) {
                        Transaction loaded = Transaction.fromProto(TransactionProto.parseFrom(baseline));
                        if (loaded.getChildTransactions().size() != 2) wrongChildren.incrementAndGet();
                        readEveryGetter(buy);
                        readEveryGetter(loaded);
                    }
                } catch (Throwable e) {
                    errors.incrementAndGet();
                    firstError.compareAndSet(null, e);
                }
            }));
        }
        writers.forEach(Thread::start);
        readers.forEach(Thread::start);
        for (Thread w : writers) w.join();
        writersDone.set(true);
        for (Thread r : readers) r.join();

        String counts = "of " + THREADS * CALLS + " calls: " + errors.get() + " threw, "
                + wrongChildren.get() + " had the wrong children, " + wrongBytes.get() + " had other bytes"
                + " (first error: " + firstError.get() + ")";
        assertEquals(0, errors.get(), counts);
        assertEquals(0, wrongChildren.get(), counts);
        assertEquals(0, wrongBytes.get(), counts);

        List<Transaction> childrenAfter = buy.getChildTransactions();
        assertEquals(2, childrenAfter.size());
        assertSame(childrenBefore.get(0), childrenAfter.get(0));
        assertSame(childrenBefore.get(1), childrenAfter.get(1));
        assertArrayEquals(baseline, buy.getProto().toByteArray());
        assertArrayEquals(bondBefore, bond.getProto().toByteArray(), "the shared BondSecurity changed");
        assertArrayEquals(cashBefore, cash.getProto().toByteArray(), "the shared CashSecurity changed");
    }

    @Test
    void transactionDeclaresNoProtoOrBuilderField() {
        for (Field f : Transaction.class.getDeclaredFields()) {
            assertNotEquals(TransactionProto.class, f.getType(), "proto field: " + f.getName());
            assertFalse(Message.Builder.class.isAssignableFrom(f.getType()), "builder field: " + f.getName());
        }
    }

    private static void readEveryGetter(Transaction t) {
        t.getID();
        t.getAsOf();
        t.getPortfolio();
        t.getSecurity();
        t.getPrice();
        t.getQuantity();
        t.getDirectedQuantity();
        t.getTradeDate();
        t.getSettlementDate();
        t.getTransactionType();
        t.getPositionStatus();
        t.getTradeName();
        t.getStrategyAllocation();
        t.isCancelled();
        t.getValidFrom();
        t.getValidTo();
        t.getChildTransactions().size();
        t.getParentTransaction();
    }

    private static UUID idOf(TransactionProto p) {
        return ProtoSerializationUtil.deserializeUUID(p.getUuid());
    }
}
