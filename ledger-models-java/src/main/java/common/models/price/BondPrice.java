package common.models.price;

import common.models.security.Security;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

public class BondPrice extends Price {
    private final BigDecimal accruedInterest;

    public static BondPrice getPrice(
            BigDecimal dirtyPrice, Security security, ZonedDateTime asOf) {
        return new BondPrice(UUID.randomUUID(), dirtyPrice, security, asOf);
    }

    public static BondPrice getPrice(BigDecimal cleanPrice, BigDecimal accruedInterest, Security security, ZonedDateTime asOf) {
        return new BondPrice(UUID.randomUUID(), cleanPrice, accruedInterest, security, asOf);
    }

    public BondPrice(UUID id, BigDecimal dirtyPrice, Security security, ZonedDateTime asOf) {
        super(id, dirtyPrice, security, asOf);
        this.accruedInterest = null;
    }

    public BondPrice(UUID id, BigDecimal cleanPrice, BigDecimal accruedInterest, Security security, ZonedDateTime asOf) {
        super(id, cleanPrice.add(accruedInterest), security, asOf);
        this.accruedInterest = accruedInterest;
    }

    public BigDecimal getDirtyPrice() {
        return super.getPrice();
    }

    public BigDecimal getCleanPrice() {
        if (accruedInterest == null) {
            throw new UnsupportedOperationException(
                    "Clean price is unavailable because this BondPrice was constructed from a dirty price only. " +
                    "Use the constructor that accepts both cleanPrice and accruedInterest.");
        }
        return getDirtyPrice().subtract(accruedInterest);
    }

    public BigDecimal getAccruedInterest() {
        if (this.accruedInterest == null)
            throw new UnsupportedOperationException(
                    "Accrued interest is unavailable because this BondPrice was constructed from a dirty price only. " +
                    "Use the constructor that accepts both cleanPrice and accruedInterest.");

        return this.accruedInterest;
    }
}
