package common.models.transaction;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.errors.ModelValidationException;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.Security;
import common.models.security.SecurityRules;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** LM-255: transaction validation reuses the shared security rules. */
class TransactionRulesTest {

    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 1, 15);

    /** A bond identified only by its bond_details (no explicit product_type). */
    private static SecurityProto bond(UUID id, BigDecimal faceValue, LocalDate issue, LocalDate maturity) {
        BondDetailsProto.Builder bd = BondDetailsProto.newBuilder();
        if (faceValue != null) bd.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(faceValue));
        if (issue != null) bd.setIssueDate(ProtoSerializationUtil.serializeLocalDate(issue));
        if (maturity != null) bd.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturity));
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setBondDetails(bd)
                .build();
    }

    private static TransactionProto txn(SecurityProto security) {
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setSecurity(security)
                .build();
    }

    private static Set<String> fields(List<FieldViolationProto> violations) {
        return violations.stream().map(FieldViolationProto::getField).collect(Collectors.toSet());
    }

    private static void assertComplete(List<FieldViolationProto> violations, UUID id) {
        for (FieldViolationProto v : violations) {
            assertFalse(v.getField().isEmpty(), "field must be set");
            assertTrue(v.hasObjectId(), "object_id must be set");
            assertEquals(id, ProtoSerializationUtil.deserializeUUID(v.getObjectId()));
            assertFalse(v.getMessage().isEmpty(), "message must be set");
        }
    }

    @Test
    void addCashImpact_missingFaceValue_throwsTypedError() {
        UUID id = UUID.randomUUID();
        BondSecurity security = (BondSecurity) Security.fromProto(bond(id, null, ISSUE, MATURITY));
        Price price = new Price(UUID.randomUUID(), BigDecimal.valueOf(99), security, ZonedDateTime.now());
        Transaction transaction = new Transaction(
                UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(), price,
                LocalDate.now(), LocalDate.now().plusDays(2), BigDecimal.valueOf(100_000),
                security, TransactionType.BUY, null, ZonedDateTime.now(), null,
                "No trade name", PositionStatusProto.HYPOTHETICAL);

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> Transaction.addCashImpact(transaction));
        assertInstanceOf(IllegalArgumentException.class, e);
        assertEquals(SecurityRules.FACE_VALUE, e.getField());
        assertEquals(id, e.getObjectId());
        assertEquals(security.getID(), e.getObjectId());

        // TransactionRules reports the same field, prefixed, for the same security.
        List<FieldViolationProto> violations = TransactionRules.validate(txn(security.getProto()));
        assertEquals(Set.of("security." + SecurityRules.FACE_VALUE), fields(violations));
        assertComplete(violations, id);
    }

    @Test
    void sameRequiredFieldsOnBothPaths() {
        UUID id = UUID.randomUUID();
        SecurityProto security = bond(id, null, null, MATURITY);

        List<FieldViolationProto> violations = TransactionRules.validate(txn(security));
        Set<String> expected = SecurityRules.requiredFields(security).stream()
                .map(f -> TransactionRules.SECURITY_PREFIX + f)
                .collect(Collectors.toSet());
        assertEquals(expected, fields(violations));
        assertEquals(2, violations.size());
        assertComplete(violations, id);
    }

    @Test
    void twoBadFields_returnsBoth() {
        UUID id = UUID.randomUUID();
        TransactionProto p = txn(bond(id, null, ISSUE, ISSUE));

        List<FieldViolationProto> violations = TransactionRules.validate(p);
        assertEquals(Set.of("security." + SecurityRules.FACE_VALUE, "security." + SecurityRules.MATURITY_DATE),
                fields(violations));
        assertEquals(2, violations.size());
        assertComplete(violations, id);

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> TransactionRules.requireValid(p));
        assertEquals(violations, e.getViolations());
    }

    @Test
    void validTransaction_returnsEmpty() {
        TransactionProto p = txn(bond(UUID.randomUUID(), BigDecimal.valueOf(1000), ISSUE, MATURITY));
        assertEquals(List.of(), TransactionRules.validate(p));
        assertDoesNotThrow(() -> TransactionRules.requireValid(p));
    }

    /** LM-438: the shared child-structure cases, the same in Python, Rust and JS. */
    @Test
    void childStructure_sharedFixtureCases() throws Exception {
        Map<String, JsonObject> cases = TransactionChildrenFixture.cases();
        assertEquals(Set.of("valid_buy", "valid_sell", "two_cash_children", "duplicate_child_ids",
                "maturation_with_two_cash", "children_without_uuid"), cases.keySet());
        for (Map.Entry<String, JsonObject> c : cases.entrySet()) {
            String name = c.getKey();
            List<FieldViolationProto> actual = TransactionRules.validate(TransactionChildrenFixture.proto(name));
            JsonArray expected = c.getValue().getAsJsonArray("violations");
            assertEquals(expected.size(), actual.size(), name + ": " + actual);
            for (int i = 0; i < expected.size(); i++) {
                JsonObject want = expected.get(i).getAsJsonObject();
                FieldViolationProto got = actual.get(i);
                assertEquals(want.get("field").getAsString(), got.getField(), name);
                assertEquals(UUID.fromString(want.get("object_id").getAsString()),
                        ProtoSerializationUtil.deserializeUUID(got.getObjectId()), name);
                for (JsonElement id : want.getAsJsonArray("message_ids")) {
                    assertTrue(got.getMessage().contains(id.getAsString()), name + ": " + got.getMessage());
                }
            }
        }
    }

    @Test
    void twoCashChildren_requireValidThrows() throws Exception {
        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> TransactionRules.requireValid(TransactionChildrenFixture.proto("two_cash_children")));
        assertEquals("child_transactions[1]", e.getField());
        assertTrue(e.getViolations().get(0).getMessage().startsWith(TransactionRules.SECOND_CASH_CHILD));
    }

    @Test
    void linkSecurity_returnsEmptyWithoutFetching() {
        Security.Fetcher previous = Security.getFetcher();
        Security.setFetcher((uuid, asOf) -> fail("validator must not fetch a link security"));
        try {
            TransactionProto p = txn(Security.linkOfLatest(UUID.randomUUID()));
            assertEquals(List.of(), TransactionRules.validate(p));
        } finally {
            Security.setFetcher(previous);
        }
    }
}
