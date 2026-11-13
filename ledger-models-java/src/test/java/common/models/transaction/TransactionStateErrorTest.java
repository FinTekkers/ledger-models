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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** LM-255: state/quantity errors keep TransactionProcessingException; only bond input checks moved. */
class TransactionStateErrorTest {

    private static Transaction buy(BondSecurity security, BigDecimal quantity) {
        return trade(security, quantity, TransactionType.BUY);
    }

    private static Transaction trade(BondSecurity security, BigDecimal quantity, TransactionType type) {
        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(99), security, ZonedDateTime.now());
        return new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(), price,
                LocalDate.now(), LocalDate.now().plusDays(2), quantity,
                security, type, null, ZonedDateTime.now(), null,
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

    /** LM-471: bond quantity is par, so a par amount below face value (SOMA BUY/SELL 39) warns, not rejects. */
    @Test
    void quantityBelowFaceValue_buyAndSellOf39_acceptedWithWarning() {
        Logger logger = Logger.getLogger(Transaction.class.getName());
        List<LogRecord> records = new CopyOnWriteArrayList<>();
        Handler handler = new Handler() {
            @Override public void publish(LogRecord record) { records.add(record); }
            @Override public void flush() {}
            @Override public void close() {}
        };
        handler.setLevel(Level.ALL);
        logger.addHandler(handler);
        try {
            BondSecurity security = bond();
            String securityId = security.getID().toString();

            Transaction buy = assertDoesNotThrow(() -> trade(security, BigDecimal.valueOf(39), TransactionType.BUY));
            Transaction sell = assertDoesNotThrow(() -> trade(security, BigDecimal.valueOf(39), TransactionType.SELL));
            assertEquals(0, BigDecimal.valueOf(39).compareTo(buy.getQuantity()));
            assertEquals(0, BigDecimal.valueOf(39).compareTo(sell.getQuantity()));

            SimpleFormatter formatter = new SimpleFormatter();
            List<String> warnings = records.stream()
                    .filter(r -> r.getLevel() == Level.WARNING)
                    .map(formatter::formatMessage)
                    .filter(m -> m.contains(securityId))
                    .collect(Collectors.toList());
            assertEquals(2, warnings.size(), "one warning per below-face-value trade: " + warnings);
            for (String message : warnings) {
                assertTrue(message.contains("39"), message);
                assertTrue(message.contains("1000"), message);
            }
        } finally {
            logger.removeHandler(handler);
        }
    }
}
