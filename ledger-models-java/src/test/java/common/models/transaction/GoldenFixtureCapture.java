package common.models.transaction;

import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.CouponFrequency;
import common.models.security.CouponType;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.position.PositionStatusProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * LM-444: writes the golden fixtures. Run by hand only, against the code whose
 * bytes the fixtures must record:
 * {@code LM444_CAPTURE=1 ./gradlew test --tests '*GoldenFixtureCapture'}.
 * It was run on {@code main} at {@code 18181d1e} (the #340 wrapper) before
 * Transaction was rewritten; see {@code fixtures/README.md}. Do not re-run it
 * on newer code: the point of the fixtures is to pin the wrapper's bytes.
 */
@EnabledIfEnvironmentVariable(named = "LM444_CAPTURE", matches = "1")
class GoldenFixtureCapture {

    static final Path DIR = Path.of("src", "test", "resources", "fixtures");

    static final UUID SOMA_SECURITY_ID = UUID.fromString("9128d0a5-7c11-4b6e-9d2f-20261106a001");
    static final UUID SOMA_TXN_ID = UUID.fromString("9128d0a5-7c11-4b6e-9d2f-20261106b001");
    static final LocalDate SOMA_MATURITY = LocalDate.of(2029, 11, 15);

    @Test
    void capture() throws IOException {
        write("txn_buy_lm444.bin", TransactionGoldenFixtures.buy().getProto().toByteArray());
        write("txn_sell_lm444.bin", TransactionGoldenFixtures.sell().getProto().toByteArray());
        write("txn_tips_lm444.bin", TransactionGoldenFixtures.tipsBuy().getProto().toByteArray());
        write("txn_frn_lm444.bin", TransactionGoldenFixtures.frnBuy().getProto().toByteArray());

        BondSecurity soma = somaSecurity();
        write("soma_security_20261106.bin", soma.getProto().toByteArray());
        write("soma_buy_20261106.bin", somaBuy(soma).getProto().toByteArray());
    }

    /** A SOMA Treasury note as the security store holds it. */
    static BondSecurity somaSecurity() {
        ZonedDateTime asOf = ZonedDateTime.of(2019, 11, 15, 8, 0, 0, 0, ZoneId.of("America/New_York"));
        BondSecurity bond = new BondSecurity(SOMA_SECURITY_ID, "US Treasury", asOf, CashSecurity.USD);
        bond.setCouponFrequency(CouponFrequency.SEMIANNUALLY);
        bond.setCouponType(CouponType.FIXED);
        bond.setCouponRate(new BigDecimal("1.75"));
        bond.addIdentifier(new Identifier(IdentifierType.CUSIP, "912828YS3"));
        bond.setFaceValue(BigDecimal.valueOf(100));
        bond.setDatedDate(LocalDate.of(2019, 11, 15));
        bond.setIssueDate(LocalDate.of(2019, 11, 15));
        bond.setMaturityDate(SOMA_MATURITY);
        return bond;
    }

    /**
     * A SOMA BUY as ledger-service's CreateOrUpdate stores it: built, then
     * {@code addCashImpact} and {@code addDerivedTransactions} attach the
     * cash child and the maturity child (the correct 2-child shape).
     */
    @SuppressWarnings("deprecation")
    static Transaction somaBuy(BondSecurity soma) {
        ZonedDateTime asOf = ZonedDateTime.of(2026, 11, 6, 14, 2, 31, 418_000_000, ZoneId.of("America/New_York"));
        Transaction txn = new Transaction(SOMA_TXN_ID, TransactionGoldenFixtures.portfolio(),
                new Price(UUID.fromString("9128d0a5-7c11-4b6e-9d2f-20261106c001"), new BigDecimal("98.765625"), soma, asOf),
                LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 6), new BigDecimal("25000000.00"), soma,
                TransactionType.BUY, TransactionGoldenFixtures.strategy(), asOf, null, "SOMA holdings 2026-11-05",
                PositionStatusProto.EXECUTED);
        Transaction.addCashImpact(txn);
        Transaction.addDerivedTransactions(txn);
        return txn;
    }

    private static void write(String name, byte[] bytes) throws IOException {
        Files.createDirectories(DIR);
        Files.write(DIR.resolve(name), bytes);
    }
}
