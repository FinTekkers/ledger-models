package protos.serializers.util.proto;

import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-304 metric 4: reading the deprecated string logs exactly one warning per
 * process, whatever the message type (LM-307), and the compact form logs none.
 * Other tests trip the flag first, so each test resets it.
 */
class DecimalDeprecationWarningTest {

    private static final Path LEGACY = Paths.get("..", "ledger-models-protos", "fixtures", "legacy_v0433");

    private final Logger logger = Logger.getLogger(DecimalCodec.class.getName());
    private final List<LogRecord> records = new CopyOnWriteArrayList<>();
    private final Handler capture = new Handler() {
        @Override
        public void publish(LogRecord record) {
            records.add(record);
        }

        @Override
        public void flush() {}

        @Override
        public void close() {}
    };

    @BeforeEach
    void attach() {
        DecimalCodec.resetDeprecationWarningForTest();
        logger.addHandler(capture);
    }

    @AfterEach
    void detach() {
        logger.removeHandler(capture);
    }

    private long warnings() {
        return records.stream().filter(r -> r.getLevel() == Level.WARNING).count();
    }

    @Test
    public void threeLegacyMessageTypesLogOneWarning() throws Exception {
        PriceProto price = PriceProto.parseFrom(Files.readAllBytes(LEGACY.resolve("price.bin")));
        SecurityProto security = SecurityProto.parseFrom(Files.readAllBytes(LEGACY.resolve("security.bin")));
        TransactionProto transaction = TransactionProto.parseFrom(Files.readAllBytes(LEGACY.resolve("transaction.bin")));

        assertEquals(new BigDecimal("100.25"), ProtoSerializationUtil.deserializeBigDecimal(price.getPrice()));
        assertEquals(new BigDecimal("4.500"),
                ProtoSerializationUtil.deserializeBigDecimal(security.getBondDetails().getCouponRate()));
        assertEquals(new BigDecimal("1000"), ProtoSerializationUtil.deserializeBigDecimal(transaction.getQuantity()));

        assertEquals(1, warnings(), records.toString());
        assertTrue(records.get(0).getMessage().contains("arbitrary_precision_value"), records.get(0).getMessage());
    }

    @Test
    public void compactOnlyLogsNoWarning() {
        DecimalValueProto compact = ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("1.50"))
                .toBuilder().clearArbitraryPrecisionValue().build();
        for (int i = 0; i < 3; i++) {
            assertEquals(new BigDecimal("1.50"), ProtoSerializationUtil.deserializeBigDecimal(compact));
        }
        assertEquals(0, warnings(), records.toString());
    }
}
