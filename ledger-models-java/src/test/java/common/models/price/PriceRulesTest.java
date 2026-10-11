package common.models.price;

import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** LM-289: the shared price rule set. The same table runs in Rust, Python and JS. */
class PriceRulesTest {

    private static final UUID PRICE_ID = UUID.randomUUID();

    /** A price that passes every rule. */
    private static PriceProto.Builder valid() {
        return PriceProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(PRICE_ID))
                .setSecurity(SecurityProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID())))
                .setPrice(DecimalValueProto.newBuilder().setArbitraryPrecisionValue("100.25"))
                .setPriceType(PriceTypeProto.PERCENTAGE);
    }

    private static List<String> fields(List<FieldViolationProto> violations) {
        return violations.stream().map(FieldViolationProto::getField).collect(Collectors.toList());
    }

    @Test
    void securityAbsent_oneViolationOnSecurity() {
        assertEquals(List.of("security"), fields(PriceRules.validate(valid().clearSecurity().build())));
    }

    @Test
    void securityUuidEmpty_oneViolationOnSecurity() {
        PriceProto p = valid().setSecurity(SecurityProto.newBuilder().setUuid(UUIDProto.newBuilder())).build();
        assertEquals(List.of("security"), fields(PriceRules.validate(p)));
    }

    @Test
    void securityUuidUnset_oneViolationOnSecurity() {
        PriceProto p = valid().setSecurity(SecurityProto.newBuilder()).build();
        assertEquals(List.of("security"), fields(PriceRules.validate(p)));
    }

    @Test
    void priceAbsent_oneViolationOnPrice() {
        assertEquals(List.of("price"), fields(PriceRules.validate(valid().clearPrice().build())));
    }

    @Test
    void priceEmpty_oneViolationOnPrice() {
        PriceProto p = valid().setPrice(DecimalValueProto.newBuilder().setArbitraryPrecisionValue("")).build();
        assertEquals(List.of("price"), fields(PriceRules.validate(p)));
    }

    @Test
    void priceZero_isValid() {
        PriceProto p = valid().setPrice(DecimalValueProto.newBuilder().setArbitraryPrecisionValue("0")).build();
        assertEquals(List.of(), PriceRules.validate(p));
    }

    @Test
    void priceValueIsNotChecked() {
        for (String value : List.of("-1", "abc")) {
            PriceProto p = valid().setPrice(DecimalValueProto.newBuilder().setArbitraryPrecisionValue(value)).build();
            assertEquals(List.of(), PriceRules.validate(p), value);
        }
    }

    @Test
    void unknownPriceType_oneViolationOnPriceType() {
        PriceProto p = valid().setPriceType(PriceTypeProto.UNKNOWN_PRICE_TYPE).build();
        assertEquals(List.of("price_type"), fields(PriceRules.validate(p)));
    }

    @Test
    void unrecognisedPriceType_isValid() {
        PriceProto p = valid().setPriceTypeValue(99).build();
        assertEquals(List.of(), PriceRules.validate(p));
    }

    @Test
    void allThreeProblems_threeViolationsInFieldOrder() {
        PriceProto p = valid().clearSecurity().clearPrice().setPriceType(PriceTypeProto.UNKNOWN_PRICE_TYPE).build();
        List<FieldViolationProto> violations = PriceRules.validate(p);
        assertEquals(List.of("security", "price", "price_type"), fields(violations));
        for (FieldViolationProto v : violations) {
            assertEquals(PRICE_ID, ProtoSerializationUtil.deserializeUUID(v.getObjectId()));
        }
    }

    @Test
    void everyKnownPriceType_isValid() {
        boolean sawPercentage = false;
        for (PriceTypeProto type : PriceTypeProto.values()) {
            if (type == PriceTypeProto.UNKNOWN_PRICE_TYPE || type == PriceTypeProto.UNRECOGNIZED) continue;
            sawPercentage |= type == PriceTypeProto.PERCENTAGE;
            assertEquals(List.of(), PriceRules.validate(valid().setPriceType(type).build()), type.name());
        }
        assertTrue(sawPercentage, "PERCENTAGE must be in the loop");
    }

    @Test
    void emptyOrNullProto_threeViolationsWithoutThrowing() {
        List<String> expected = List.of("security", "price", "price_type");
        assertEquals(expected, fields(PriceRules.validate(PriceProto.getDefaultInstance())));
        assertEquals(expected, fields(PriceRules.validate(null)));
        assertFalse(PriceRules.validate(null).get(0).hasObjectId());
    }

    @Test
    void requireValid_throwsTypedErrorCarryingViolations() {
        PriceProto p = valid().clearPrice().build();
        ModelValidationException e = assertThrows(ModelValidationException.class, () -> PriceRules.requireValid(p));
        assertEquals(PriceRules.validate(p), e.getViolations());
        assertDoesNotThrow(() -> PriceRules.requireValid(valid().build()));
    }
}
