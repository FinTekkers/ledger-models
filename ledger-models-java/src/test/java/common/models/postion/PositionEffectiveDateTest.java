package common.models.postion;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.security.Security;
import common.models.taxLot.TaxLotDelta;
import common.models.transaction.Transaction;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.Test;
import protos.serializers.position.PositionSerializer;
import testutil.DummyEquityObjects;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-447: EFFECTIVE_DATE packs its declared class, LocalDate, as LocalDateProto. The bytes are shared with the
 * Python, JS and Rust tests through ledger-models-protos/fixtures/position_effective_date_cases.json.
 */
class PositionEffectiveDateTest {
    private static final LocalDate EFFECTIVE = LocalDate.of(2024, 3, 15);
    private static final ZonedDateTime AS_OF = ZonedDateTime.of(2024, 3, 20, 10, 0, 0, 0, ZoneOffset.UTC);

    private static String fixtureHex(String name) throws IOException {
        Path path = Paths.get("..", "ledger-models-protos", "fixtures", "position_effective_date_cases.json");
        JsonObject root;
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            root = new Gson().fromJson(r, JsonObject.class);
        }
        for (JsonElement e : root.getAsJsonArray("cases")) {
            JsonObject c = e.getAsJsonObject();
            if (name.equals(c.get("name").getAsString())) {
                return c.get("entry_hex").getAsString();
            }
        }
        throw new AssertionError("fixture case missing: " + name);
    }

    private static String hex(FieldMapEntry entry) {
        return HexFormat.of().formatHex(entry.toByteArray());
    }

    private static FieldMapEntry effectiveDateEntry(PositionProto proto) {
        return proto.getFieldsList().stream()
                .filter(f -> f.getField() == FieldProto.EFFECTIVE_DATE)
                .findFirst()
                .orElseThrow(() -> new AssertionError("no EFFECTIVE_DATE entry"));
    }

    @Test
    void serializedPositionPacksEffectiveDateAsLocalDate() throws Exception {
        Position position = new Position(Position.PositionType.TRANSACTION);
        position.setAsOfDate(AS_OF);
        position.setFieldValue(Field.AS_OF, AS_OF);
        position.setFieldValue(Field.EFFECTIVE_DATE, EFFECTIVE);

        PositionProto proto = PositionSerializer.getInstance().serialize(position);
        FieldMapEntry entry = effectiveDateEntry(proto);

        assertTrue(entry.getFieldValuePacked().is(LocalDateProto.class));
        LocalDate decoded = (LocalDate) PositionSerializer.getObject(entry);
        assertEquals(EFFECTIVE, decoded);
        assertNotEquals(AS_OF.toLocalDate(), decoded);
        assertEquals(fixtureHex("set"), hex(entry));
    }

    @Test
    void transactionEffectiveDateCopiesOntoPositionAndMatchesFixture() throws Exception {
        Transaction txn = DummyEquityObjects.getDummyTransaction();
        txn.setAsOf(ZonedDateTime.of(2024, 3, 15, 10, 0, 0, 0, ZoneOffset.UTC));

        Position position = new Position(Position.PositionType.TRANSACTION);
        assertDoesNotThrow(() -> position.setFieldValue(Field.EFFECTIVE_DATE, txn.getField(Field.EFFECTIVE_DATE)));

        FieldMapEntry entry = effectiveDateEntry(PositionSerializer.getInstance().serialize(position));
        assertEquals(fixtureHex("set"), hex(entry));
    }

    @Test
    void modelGettersReturnLocalDateForEffectiveDateAndKeepAsOf() {
        Transaction txn = DummyEquityObjects.getDummyTransaction();
        txn.setAsOf(AS_OF);
        TaxLotDelta lot = DummyEquityObjects.getDummyTaxLot();
        lot.setAsOf(AS_OF);
        Security security = DummyEquityObjects.getDummySecurity();
        security.setAsOf(AS_OF);

        assertEquals(LocalDate.of(2024, 3, 20), txn.getField(Field.EFFECTIVE_DATE));
        assertEquals(LocalDate.of(2024, 3, 20), lot.getField(Field.EFFECTIVE_DATE));
        assertEquals(LocalDate.of(2024, 3, 20), security.getField(Field.EFFECTIVE_DATE));

        assertSame(AS_OF, txn.getField(Field.AS_OF));
        assertSame(AS_OF, lot.getField(Field.AS_OF));
        assertSame(AS_OF, security.getField(Field.AS_OF));

        txn.setAsOf(null);
        lot.setAsOf(null);
        security.setAsOf(null);
        assertNull(assertDoesNotThrow(() -> txn.getField(Field.EFFECTIVE_DATE)));
        assertNull(assertDoesNotThrow(() -> lot.getField(Field.EFFECTIVE_DATE)));
        assertNull(assertDoesNotThrow(() -> security.getField(Field.EFFECTIVE_DATE)));
    }

    @Test
    void serializerPacksTimestampAsDateOnlyForLocalDateFields() throws Exception {
        FieldMapEntry effective = PositionSerializer.getFieldMapEntry(Field.EFFECTIVE_DATE, null, AS_OF);
        assertTrue(effective.getFieldValuePacked().is(LocalDateProto.class));
        assertEquals(LocalDate.of(2024, 3, 20), PositionSerializer.getObject(effective));

        FieldMapEntry asOf = PositionSerializer.getFieldMapEntry(Field.AS_OF, null, AS_OF);
        assertTrue(asOf.getFieldValuePacked().is(LocalTimestampProto.class));
    }

    @Test
    void unsetEffectiveDateMatchesFixtureAndDecodesToNull() throws Exception {
        FieldMapEntry entry = PositionSerializer.getFieldMapEntry(Field.EFFECTIVE_DATE, null, null);
        assertEquals(fixtureHex("unset"), hex(entry));
        assertNull(PositionSerializer.getObject(entry));
    }
}
