package common.models.price;

import common.models.security.CashSecurity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class BondPriceTest {

    @Test
    void getCleanPrice_returnsCleanWhenAccruedInterestProvided() {
        BigDecimal cleanPrice = new BigDecimal("99.50");
        BigDecimal accruedInterest = new BigDecimal("1.25");

        BondPrice bondPrice = new BondPrice(UUID.randomUUID(), cleanPrice, accruedInterest,
                CashSecurity.USD, ZonedDateTime.now());

        assertEquals(new BigDecimal("99.50"), bondPrice.getCleanPrice());
    }

    @Test
    void getDirtyPrice_equalsCleanPlusAccrued() {
        BigDecimal cleanPrice = new BigDecimal("99.50");
        BigDecimal accruedInterest = new BigDecimal("1.25");

        BondPrice bondPrice = new BondPrice(UUID.randomUUID(), cleanPrice, accruedInterest,
                CashSecurity.USD, ZonedDateTime.now());

        assertEquals(new BigDecimal("100.75"), bondPrice.getDirtyPrice());
    }

    @Test
    void getCleanPrice_throwsWhenConstructedFromDirtyPriceOnly() {
        BigDecimal dirtyPrice = new BigDecimal("100.75");

        BondPrice bondPrice = new BondPrice(UUID.randomUUID(), dirtyPrice,
                CashSecurity.USD, ZonedDateTime.now());

        UnsupportedOperationException ex = assertThrows(
                UnsupportedOperationException.class,
                bondPrice::getCleanPrice);

        assertTrue(ex.getMessage().contains("dirty price only"));
    }

    @Test
    void getAccruedInterest_returnsValueWhenProvided() {
        BigDecimal cleanPrice = new BigDecimal("99.50");
        BigDecimal accruedInterest = new BigDecimal("1.25");

        BondPrice bondPrice = new BondPrice(UUID.randomUUID(), cleanPrice, accruedInterest,
                CashSecurity.USD, ZonedDateTime.now());

        assertEquals(new BigDecimal("1.25"), bondPrice.getAccruedInterest());
    }

    @Test
    void factoryMethod_withCleanAndAccrued() {
        BigDecimal cleanPrice = new BigDecimal("98.00");
        BigDecimal accruedInterest = new BigDecimal("0.75");

        BondPrice bondPrice = BondPrice.getPrice(cleanPrice, accruedInterest,
                CashSecurity.USD, ZonedDateTime.now());

        assertEquals(new BigDecimal("98.00"), bondPrice.getCleanPrice());
        assertEquals(new BigDecimal("98.75"), bondPrice.getDirtyPrice());
    }
}
