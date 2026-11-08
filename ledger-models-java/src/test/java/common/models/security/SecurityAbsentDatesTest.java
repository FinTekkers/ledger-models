package common.models.security;

import common.models.postion.Field;
import common.models.postion.Position;
import common.models.postion.PositionFilter;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.MortgageBackedSecurity;
import common.models.security.bonds.TIPSBond;
import common.models.transaction.Transaction;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionProto;
import fintekkers.models.position.PositionTypeProto;
import fintekkers.models.position.PositionViewProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import protos.serializers.position.PositionSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-441: {@code getField(MATURITY_DATE)} and {@code getField(ISSUE_DATE)}
 * return null (absent) for a security with no such date, never the
 * placeholders 2999-12-31 or 1900-01-01. Bonds keep their real dates, and an
 * absent date survives the position wire round-trip without throwing.
 */
class SecurityAbsentDatesTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2026, 11, 7, 17, 0, 0, 0, ZoneId.of("America/New_York"));
    private static final LocalDate ISSUE = LocalDate.of(2024, 5, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 5, 15);
    private static final List<LocalDate> PLACEHOLDERS =
            List.of(LocalDate.of(2999, 12, 31), LocalDate.of(1900, 1, 1));

    private static SecurityProto.Builder base(ProductTypeProto type) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(type)
                .setIssuerName("Issuer");
    }

    private static BondDetailsProto datedBondDetails() {
        return BondDetailsProto.newBuilder()
                .setIssueDate(ProtoSerializationUtil.serializeLocalDate(ISSUE))
                .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(MATURITY))
                .build();
    }

    private static SecurityProto dated(ProductTypeProto type) {
        return base(type).setBondDetails(datedBondDetails()).build();
    }

    static Stream<Arguments> nonBonds() {
        return Stream.of(
                Arguments.of(ProductTypeProto.COMMON_STOCK, EquitySecurity.class),
                Arguments.of(ProductTypeProto.EQUITY_INDEX, IndexSecurity.class),
                Arguments.of(ProductTypeProto.CURRENCY, CashSecurity.class),
                Arguments.of(ProductTypeProto.FX_SPOT, Security.class),
                Arguments.of(ProductTypeProto.CRYPTOCURRENCY, Security.class));
    }

    // ---- metric 1: non-bonds are absent --------------------------------

    @ParameterizedTest
    @MethodSource("nonBonds")
    void nonBond_datesAreAbsent(ProductTypeProto type, Class<?> expectedClass) {
        Security noBondDetails = Security.fromProto(base(type).build());
        Security emptyBondDetails = Security.fromProto(
                base(type).setBondDetails(BondDetailsProto.getDefaultInstance()).build());

        for (Security security : List.of(noBondDetails, emptyBondDetails)) {
            assertEquals(expectedClass, security.getClass());
            for (Field field : List.of(Field.MATURITY_DATE, Field.ISSUE_DATE)) {
                Object value = security.getField(field);
                assertNull(value, type + " " + field);
                for (LocalDate placeholder : PLACEHOLDERS) {
                    assertNotEquals(placeholder, value, type + " " + field + " returned a placeholder");
                }
            }
        }
    }

    // ---- metric 1 + guardrail 1: bonds keep their dates ----------------

    @ParameterizedTest
    @EnumSource(value = ProductTypeProto.class,
            names = {"TREASURY_NOTE", "TIPS", "TREASURY_FRN", "MORTGAGE_BACKED"})
    void bondAndSubclasses_returnProtoDates(ProductTypeProto type) {
        Security security = Security.fromProto(dated(type));

        assertInstanceOf(BondSecurity.class, security);
        switch (type) {
            case TIPS -> assertInstanceOf(TIPSBond.class, security);
            case TREASURY_FRN -> assertInstanceOf(FloatingRateNote.class, security);
            case MORTGAGE_BACKED -> assertInstanceOf(MortgageBackedSecurity.class, security);
            default -> assertEquals(BondSecurity.class, security.getClass());
        }
        assertEquals(MATURITY, security.getField(Field.MATURITY_DATE));
        assertEquals(ISSUE, security.getField(Field.ISSUE_DATE));
        assertEquals(MATURITY, ((BondSecurity) security).getMaturityDate());
        assertEquals(ISSUE, ((BondSecurity) security).getIssueDate());
    }

    // ---- metric 2: a plain Security with dates returns them ------------

    @ParameterizedTest
    @EnumSource(value = ProductTypeProto.class, names = {"FX_SPOT", "CRYPTOCURRENCY"})
    void plainSecurity_withDates_returnsThem(ProductTypeProto type) {
        Security security = Security.fromProto(dated(type));

        assertEquals(Security.class, security.getClass());
        assertEquals(MATURITY, security.getField(Field.MATURITY_DATE));
        assertEquals(ISSUE, security.getField(Field.ISSUE_DATE));
    }

    // ---- metric 3: position journey grouped by MATURITY_DATE -----------

    private static Transaction txnOn(SecurityProto security) {
        return new Transaction(TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setSecurity(security)
                .build());
    }

    @Test
    void positionsGroupedByMaturity_haveBondDateAndAbsentKey() {
        List<Transaction> portfolio = List.of(
                txnOn(base(ProductTypeProto.COMMON_STOCK).build()),
                txnOn(dated(ProductTypeProto.TREASURY_NOTE)));

        Map<Object, Integer> groups = new HashMap<>();
        for (Transaction txn : portfolio) {
            Position position = new Position(Position.PositionType.TRANSACTION);
            position.setFieldValue(Field.SECURITY_ID, txn.getSecurity().getID());
            position.setFieldValue(Field.MATURITY_DATE, txn.getField(Field.MATURITY_DATE));

            PositionProto wire = PositionSerializer.getInstance().serialize(position);
            Position received = PositionSerializer.getInstance().deserialize(wire);

            groups.merge(received.getField(Field.MATURITY_DATE), 1, Integer::sum);
        }

        assertEquals(2, groups.size());
        assertTrue(groups.containsKey(null));
        assertTrue(groups.containsKey(MATURITY));
        for (LocalDate placeholder : PLACEHOLDERS) {
            assertFalse(groups.containsKey(placeholder));
        }
    }

    // ---- guardrail 2: an absent date never throws ----------------------

    @Test
    void absentDate_neverThrows() {
        Security stock = Security.fromProto(base(ProductTypeProto.COMMON_STOCK).build());
        Object maturity = stock.getField(Field.MATURITY_DATE);

        Position position = new Position(Position.PositionType.TRANSACTION);
        position.setFieldValue(Field.MATURITY_DATE, maturity);
        assertDoesNotThrow(position::toString);

        for (PositionFilter.Operator op : List.of(PositionFilter.Operator.EQUALS,
                PositionFilter.Operator.MORE_THAN, PositionFilter.Operator.LESS_THAN)) {
            PositionFilter.PositionComparator comparator =
                    PositionFilter.from(Field.MATURITY_DATE, op, MATURITY).getFilters().get(Field.MATURITY_DATE);
            assertFalse(assertDoesNotThrow(() -> PositionFilter.matches(Field.MATURITY_DATE, comparator, maturity)),
                    op.name());
        }

        assertNull(ProtoSerializationUtil.serialize(null));
        assertNull(ProtoSerializationUtil.serializeToAny(null));
        FieldMapEntry entry = PositionSerializer.getFieldMapEntry(Field.MATURITY_DATE, null, maturity);
        assertEquals(FieldMapEntry.FieldMapValueOneOfCase.FIELDMAPVALUEONEOF_NOT_SET, entry.getFieldMapValueOneOfCase());
    }

    @Test
    void unsetFieldMapEntry_deserializesToNull() {
        FieldMapEntry entry = FieldMapEntry.newBuilder().setField(FieldProto.MATURITY_DATE).build();
        assertEquals(FieldMapEntry.FieldMapValueOneOfCase.FIELDMAPVALUEONEOF_NOT_SET, entry.getFieldMapValueOneOfCase());

        assertNull(assertDoesNotThrow(() -> PositionSerializer.getObject(entry)));

        PositionProto proto = PositionProto.newBuilder()
                .setPositionView(PositionViewProto.DEFAULT_VIEW)
                .setPositionType(PositionTypeProto.TRANSACTION)
                .addFields(entry)
                .build();
        Position position = assertDoesNotThrow(() -> PositionSerializer.getInstance().deserialize(proto));
        assertNull(position.getField(Field.MATURITY_DATE));
        assertDoesNotThrow(position::toString);
    }
}
