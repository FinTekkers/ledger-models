package common.models.transaction;

import common.models.errors.ModelValidationException;
import common.models.errors.transaction.TransactionProcessingException;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import fintekkers.models.position.PositionStatusProto;
import org.junit.jupiter.api.Test;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** LM-255: state/quantity errors keep TransactionProcessingException; only bond input checks moved. */
class TransactionStateErrorTest {

    private static Transaction buy(BondSecurity security, BigDecimal quantity) {
        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(99), security, ZonedDateTime.now());
        return new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(), price,
                LocalDate.now(), LocalDate.now().plusDays(2), quantity,
                security, TransactionType.BUY, null, ZonedDateTime.now(), null,
                "No trade name", PositionStatusProto.HYPOTHETICAL);
    }

    private static BondSecurity bond() {
        BondSecurity security = new BondSecurity(UUID.randomUUID(), "Issuer", ZonedDateTime.now(), CashSecurity.USD);
        security.setFaceValue(BigDecimal.valueOf(1000));
        security.setMaturityDate(LocalDate.now().plusYears(5));
        return security;
    }

    @Test
    void zeroQuantity_isTransactionProcessingException() {
        TransactionProcessingException e = assertThrows(TransactionProcessingException.class,
                () -> buy(bond(), BigDecimal.ZERO));
        assertFalse(ModelValidationException.class.isInstance(e));
    }

    @Test
    void quantityBelowFaceValue_isTransactionProcessingException() {
        TransactionProcessingException e = assertThrows(TransactionProcessingException.class,
                () -> buy(bond(), BigDecimal.TEN));
        assertFalse(ModelValidationException.class.isInstance(e));
    }
}
