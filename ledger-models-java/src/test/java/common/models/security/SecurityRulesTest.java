package common.models.security;

import common.models.errors.ModelValidationException;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.util.errors.Error.ErrorProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import fintekkers.requests.util.errors.Summary.SummaryProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** LM-255: the shared security rule set and its typed input error. */
class SecurityRulesTest {

    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 1, 15);

    /** A bond identified only by its bond_details (no explicit product_type). */
    static SecurityProto bond(UUID id, BigDecimal faceValue, LocalDate issue, LocalDate maturity) {
        BondDetailsProto.Builder bd = BondDetailsProto.newBuilder();
        if (faceValue != null) bd.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(faceValue));
        if (issue != null) bd.setIssueDate(ProtoSerializationUtil.serializeLocalDate(issue));
        if (maturity != null) bd.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturity));
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setBondDetails(bd)
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
    void missingFaceValue_namesFieldAndId() {
        UUID id = UUID.randomUUID();
        SecurityProto p = bond(id, null, ISSUE, MATURITY);

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> SecurityRules.requireValid(p));
        assertInstanceOf(IllegalArgumentException.class, e);
        assertEquals(SecurityRules.FACE_VALUE, e.getField());
        assertEquals(id, e.getObjectId());
        assertEquals(1, e.getViolations().size());
    }

    @Test
    void missingIssueDate_namesFieldAndId() {
        UUID id = UUID.randomUUID();
        SecurityProto p = bond(id, BigDecimal.valueOf(1000), null, MATURITY);

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> SecurityRules.requireValid(p));
        assertEquals(SecurityRules.ISSUE_DATE, e.getField());
        assertEquals(id, e.getObjectId());
        assertEquals(1, e.getViolations().size());
    }

    @Test
    void maturityNotAfterIssue_fromProtoThrowsTyped() {
        for (LocalDate maturity : List.of(ISSUE.minusDays(1), ISSUE)) {
            UUID id = UUID.randomUUID();
            SecurityProto p = bond(id, BigDecimal.valueOf(1000), ISSUE, maturity);

            ModelValidationException e = assertThrows(ModelValidationException.class,
                    () -> Security.fromProto(p), "maturity=" + maturity);
            assertEquals(SecurityRules.MATURITY_DATE, e.getField());
            assertEquals(id, e.getObjectId());
            assertTrue(e.getMessage().contains("maturity_date must be after issue_date"), e.getMessage());

            // validate reports the same rule without throwing.
            assertEquals(Set.of(SecurityRules.MATURITY_DATE), fields(SecurityRules.validate(p)));
        }
    }

    @Test
    void bondDetailsWithoutProductType_sameAnswerBothPaths() {
        SecurityProto p = bond(UUID.randomUUID(), BigDecimal.valueOf(1000), ISSUE, MATURITY);
        assertEquals(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, p.getProductType());

        Security security = Security.fromProto(p);
        assertInstanceOf(BondSecurity.class, security);
        assertEquals(ProductTypeProto.TREASURY_NOTE, security.getProductType());
        assertEquals(ProductTypeProto.TREASURY_NOTE, SecurityRules.inferProductType(p));
        assertTrue(SecurityRules.isBond(p));
        assertTrue(ProductHierarchy.isDescendantOf(security.getProductType(), "BOND"));
        assertEquals(List.of(SecurityRules.FACE_VALUE, SecurityRules.ISSUE_DATE),
                SecurityRules.requiredFields(p));
        assertEquals(SecurityRules.requiredFields(p), SecurityRules.requiredFields(security.getProto()));
    }

    @Test
    void twoBadFields_returnsBoth() {
        UUID id = UUID.randomUUID();
        SecurityProto p = bond(id, null, ISSUE, ISSUE.minusYears(1));

        List<FieldViolationProto> violations = SecurityRules.validate(p);
        assertEquals(Set.of(SecurityRules.FACE_VALUE, SecurityRules.MATURITY_DATE), fields(violations));
        assertEquals(2, violations.size());
        assertComplete(violations, id);

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> SecurityRules.requireValid(p));
        assertEquals(violations, e.getViolations());
    }

    @Test
    void validBond_returnsEmpty() {
        SecurityProto p = bond(UUID.randomUUID(), BigDecimal.valueOf(1000), ISSUE, MATURITY);
        assertEquals(List.of(), SecurityRules.validate(p));
        assertDoesNotThrow(() -> SecurityRules.requireValid(p));
    }

    @Test
    void bondMissingFaceValueAndIssueDate_stillConstructs() {
        UUID id = UUID.randomUUID();
        SecurityProto p = bond(id, null, null, MATURITY);

        Security security = assertDoesNotThrow(() -> Security.fromProto(p));
        assertInstanceOf(BondSecurity.class, security);

        List<FieldViolationProto> violations = SecurityRules.validate(p);
        assertEquals(Set.of(SecurityRules.FACE_VALUE, SecurityRules.ISSUE_DATE), fields(violations));
        assertEquals(2, violations.size());
        assertComplete(violations, id);
    }

    @Test
    void violations_roundTripAsIsInErrorProto() throws Exception {
        UUID id = UUID.randomUUID();
        // A service receives the security as bytes on the wire.
        byte[] wire = bond(id, null, ISSUE, ISSUE).toByteArray();
        SecurityProto received = SecurityProto.parseFrom(wire);

        List<FieldViolationProto> violations = SecurityRules.validate(received);
        SummaryProto summary = SummaryProto.newBuilder()
                .addErrors(ErrorProto.newBuilder().addAllViolations(violations))
                .build();

        SummaryProto parsed = SummaryProto.parseFrom(summary.toByteArray());
        List<FieldViolationProto> returned = parsed.getErrors(0).getViolationsList();
        assertEquals(violations, returned);
        assertEquals(Set.of(SecurityRules.FACE_VALUE, SecurityRules.MATURITY_DATE), fields(returned));
        assertComplete(returned, id);
    }
}
