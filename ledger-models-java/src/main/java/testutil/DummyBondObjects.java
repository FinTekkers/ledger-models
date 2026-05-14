package testutil;

import common.models.price.BondPrice;
import common.models.security.*;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import common.models.taxLot.TaxLotDelta;
import common.models.taxLot.TaxLotSource;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static testutil.DummyEquityObjects.getDummyPortfolio;

public class DummyBondObjects {

    public static BondSecurity getDummySecurity() {
        return getDummySecurity(ZonedDateTime.now(), "91282CEP2", LocalDate.of(2022, 5, 16),
                LocalDate.of(2032, 5, 16), BigDecimal.valueOf((double)2 + (double)(7 / 8)));
    }
    public static BondSecurity getDummySecurity(ZonedDateTime asOf, String cusip,
                                                LocalDate issueDate,
                                                LocalDate maturityDate,
                                                BigDecimal couponRate) {
        BondSecurity bond = new BondSecurity(UUID.randomUUID(), "US Treasury", asOf, getCashSecurity());

        int days = (maturityDate.getYear()*365+maturityDate.getDayOfYear())
            - (issueDate.getYear()*365+issueDate.getDayOfYear());

        if(BigDecimal.ZERO.equals(couponRate) && days <= 185) {
            bond.setCouponFrequency(CouponFrequency.NO_COUPON);
            bond.setCouponType(CouponType.ZERO);

        } else {
            bond.setCouponFrequency(CouponFrequency.SEMIANNUALLY);
            bond.setCouponType(CouponType.FIXED);
        }

        bond.setCouponRate(couponRate);
        bond.addIdentifier(new Identifier(IdentifierType.CUSIP, cusip));
        bond.setFaceValue(BigDecimal.valueOf(1000));

        bond.setDatedDate(issueDate);
        bond.setIssueDate(issueDate);
        bond.setMaturityDate(maturityDate);

        return bond;
    }

    public static CashSecurity getCashSecurity() {
        return CashSecurity.USD;
    }

    public static Transaction getDummyTransaction() {
        BondSecurity sec = getDummySecurity();

        Transaction transaction = new Transaction(UUID.randomUUID(), getDummyPortfolio(),
                BondPrice.getPrice(BigDecimal.valueOf(99.414646), sec, ZonedDateTime.now()),
                LocalDate.now(), LocalDate.now(),
                BigDecimal.TEN.multiply(sec.getFaceValue()), sec, TransactionType.BUY,
                new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now()) {{
                    addAllocation(
                            new Strategy(UUID.randomUUID(), "Strat Name", null, ZonedDateTime.now()),
                            BigDecimal.ONE
                    );
                }},
                ZonedDateTime.now(), null, "No Trade Name",
                EXECUTED);

        Transaction.addCashImpact(transaction);
        Transaction.addDerivedTransactions(transaction);

        return transaction;
    }

    public static TaxLotDelta getDummyTaxLot() {
        Transaction t = getDummyTransaction();
        return new TaxLotDelta(UUID.randomUUID(), t.getPortfolio(), TaxLotDelta.TaxLotStatus.Open, t.getPrice(), t.getTradeDate(),
                null, t.getQuantity(), t.getSecurity(),
                t.getAsOf(), new TaxLotSource(t), t.getPositionStatus());
    }
}
