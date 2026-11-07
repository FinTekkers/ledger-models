package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.util.LinkCache;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-444 metric 3 and guardrail 1: the plain object writes the bytes the #340
 * wrapper wrote. The fixtures were captured from {@code main} at
 * {@code 18181d1e} by {@link GoldenFixtureCapture}, before Transaction was
 * rewritten. Both directions: the same transaction built here serialises to
 * the fixture, and the fixture read back serialises to itself.
 */
class TransactionGoldenBytesTest {

    static final Path DIR = Path.of("src", "test", "resources", "fixtures");

    private final Security.Fetcher securityFetcher = Security.getFetcher();
    private final Portfolio.Fetcher portfolioFetcher = Portfolio.getFetcher();

    @BeforeEach
    void noFetchers() {
        Security.setFetcher(null);
        Portfolio.setFetcher(null);
    }

    @AfterEach
    void restore() {
        Security.setFetcher(securityFetcher);
        Portfolio.setFetcher(portfolioFetcher);
        restoreUsd();
    }

    /** CashSecurity primes USD once, at class load; put it back after a test clears the cache. */
    static void restoreUsd() {
        CashSecurity usd = CashSecurity.USD;
        LinkCache.SECURITY.put(usd.getID(), usd.getProto(), usd.getAsOf());
    }

    static byte[] fixture(String name) throws IOException {
        return Files.readAllBytes(DIR.resolve(name));
    }

    static Stream<Arguments> goldens() {
        return Stream.of(
                Arguments.of("txn_buy_lm444.bin", (Supplier<Transaction>) TransactionGoldenFixtures::buy),
                Arguments.of("txn_sell_lm444.bin", (Supplier<Transaction>) TransactionGoldenFixtures::sell),
                Arguments.of("txn_tips_lm444.bin", (Supplier<Transaction>) TransactionGoldenFixtures::tipsBuy),
                Arguments.of("txn_frn_lm444.bin", (Supplier<Transaction>) TransactionGoldenFixtures::frnBuy));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("goldens")
    void sameTransaction_serialisesToTheWrapperBytes(String name, Supplier<Transaction> build) throws IOException {
        assertArrayEquals(fixture(name), build.get().getProto().toByteArray());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("goldens")
    void fixtureReadBack_serialisesToItself_whetherLinksResolveOrNot(String name, Supplier<Transaction> build)
            throws IOException {
        byte[] golden = fixture(name);

        build.get();   // primes LinkCache with the full securities and portfolio
        assertArrayEquals(golden, Transaction.fromProto(TransactionProto.parseFrom(golden)).getProto().toByteArray(),
                "links resolved from the cache");

        LinkCache.SECURITY.clear();
        LinkCache.PORTFOLIO.clear();
        assertArrayEquals(golden, Transaction.fromProto(TransactionProto.parseFrom(golden)).getProto().toByteArray(),
                "links not resolved");
    }

    /** The full-field fixture really sets every field it is meant to pin. */
    @ParameterizedTest
    @ValueSource(strings = "txn_frn_lm444.bin")
    void frnFixture_setsEveryTransactionField(String name) throws IOException {
        TransactionProto p = TransactionProto.parseFrom(fixture(name));
        assertTrue(p.hasVersion());
        assertTrue(p.hasValidFrom());
        assertTrue(p.hasValidTo());
        assertTrue(p.hasStrategyAllocation());
        assertTrue(p.getIsCancelled());
        assertFalse(p.getTradeName().isEmpty());
        assertNotEquals(0, p.getPositionStatusValue());
        assertEquals("America/New_York", p.getAsOf().getTimeZone());
        assertNotEquals(0, p.getAsOf().getTimestamp().getNanos());
        assertEquals(2, p.getChildTransactionsCount());
    }

    /** R6: a stored row written under the wrapper reads back and re-serialises to the same bytes. */
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void storedSomaRow_bytesRoundTrip(boolean securityCached) throws IOException {
        byte[] row = fixture("soma_buy_20261106.bin");
        LinkCache.SECURITY.clear();
        LinkCache.PORTFOLIO.clear();
        if (securityCached) TransactionSomaFixtureTest.primeSomaAndUsd();

        Transaction loaded = Transaction.fromProto(TransactionProto.parseFrom(row));

        assertArrayEquals(row, loaded.getProto().toByteArray());
    }

    /**
     * A row Java cannot fully decode re-serialises unchanged, as under the
     * wrapper: a transaction_type with no Java constant (PRINCIPAL_PAYDOWN),
     * enum numbers this build does not know, an unset quantity, an all-zero
     * trade_date and an invalid settlement_date.
     */
    @ParameterizedTest
    @ValueSource(ints = {7, 8})
    void rowJavaCannotDecode_serialisesToItself(int transactionType) throws IOException {
        TransactionProto.Builder b = TransactionProto.parseFrom(fixture("txn_buy_lm444.bin")).toBuilder()
                .setTransactionTypeValue(transactionType)
                .setObjectTypeValue(99)
                .setPositionStatusValue(99)
                .setQuantity(DecimalValueProto.getDefaultInstance())
                .setTradeDate(LocalDateProto.getDefaultInstance())
                .setSettlementDate(LocalDateProto.newBuilder().setYear(2026).setMonth(13).setDay(1));
        byte[] row = b.build().toByteArray();
        assertEquals(TransactionTypeProto.forNumber(transactionType), b.getTransactionType());

        Transaction loaded = Transaction.fromProto(TransactionProto.parseFrom(row));

        assertArrayEquals(row, loaded.getProto().toByteArray());
        TransactionProto raw = loaded.getRawProto();
        assertEquals(transactionType, raw.getTransactionTypeValue());
        assertEquals(99, raw.getObjectTypeValue());
        assertEquals(99, raw.getPositionStatusValue());
        assertEquals(b.getQuantity(), raw.getQuantity());
        assertEquals(b.getTradeDate(), raw.getTradeDate());
        assertTrue(raw.hasTradeDate());
        assertEquals(b.getSettlementDate(), raw.getSettlementDate());
    }

    /** A setter replaces a kept wire value. */
    @ParameterizedTest
    @ValueSource(ints = 7)
    void setterReplacesTheKeptWireValue(int transactionType) throws IOException {
        TransactionProto row = TransactionProto.parseFrom(fixture("txn_buy_lm444.bin")).toBuilder()
                .setTransactionTypeValue(transactionType)
                .setTradeDate(LocalDateProto.getDefaultInstance())
                .build();
        Transaction loaded = Transaction.fromProto(row);

        loaded.setTransactionType(null);
        loaded.setTradeDate(null);

        TransactionProto out = loaded.getProto();
        assertEquals(TransactionTypeProto.UNKNOWN, out.getTransactionType());
        assertFalse(out.hasTradeDate());
    }
}
