package common.models.security;

import common.models.errors.ModelValidationException;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** LM-258: a TBILL has no coupon. coupon_rate must be unset or 0. */
class TbillCouponValidationTest {

    private static final UUID ID = UUID.fromString("1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10");

    /** A valid security of {@code type}, except for the coupon. {@code coupon} null leaves coupon_rate unset. */
    private static SecurityProto security(ProductTypeProto type, DecimalValueProto coupon) {
        BondDetailsProto.Builder bd = BondDetailsProto.newBuilder()
                .setFaceValue(ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(1000)))
                .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2026, 1, 6)))
                .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2026, 4, 7)));
        if (coupon != null) bd.setCouponRate(coupon);
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(ID))
                .setProductType(type)
                .setBondDetails(bd)
                .build();
    }

    private static DecimalValueProto decimal(String value) {
        return DecimalValueProto.newBuilder().setArbitraryPrecisionValue(value).build();
    }

    private static void assertRejected(String coupon) {
        SecurityProto p = security(ProductTypeProto.TBILL, decimal(coupon));

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> SecurityRules.requireValid(p));
        assertEquals(1, e.getViolations().size());
        assertEquals(SecurityRules.COUPON_RATE, e.getField());
        assertEquals("bond_details.coupon_rate", e.getField());
        assertEquals(ID, e.getObjectId());
        assertTrue(e.getMessage().contains(ID.toString()), e.getMessage());
        assertTrue(e.getMessage().contains("coupon_rate"), e.getMessage());
    }

    @Test
    void tbillWithCouponSix_isRejected() {
        assertRejected("6.0");
    }

    @Test
    void tbillWithNegativeCoupon_isRejected() {
        assertRejected("-1.0");
    }

    @Test
    void tbillWithNoCouponMessage_isAccepted() {
        SecurityProto p = security(ProductTypeProto.TBILL, null);
        assertFalse(p.getBondDetails().hasCouponRate());
        assertTrue(SecurityRules.validate(p).isEmpty());
    }

    @Test
    void tbillWithEmptyCouponValue_isAccepted() {
        SecurityProto p = security(ProductTypeProto.TBILL, decimal(""));
        assertTrue(p.getBondDetails().hasCouponRate());
        assertTrue(SecurityRules.validate(p).isEmpty());
    }

    @Test
    void tbillWithZeroCoupon_isAccepted() {
        for (String zero : new String[] {"0", "0.00"}) {
            SecurityProto p = security(ProductTypeProto.TBILL, decimal(zero));
            assertTrue(SecurityRules.validate(p).isEmpty(), zero);
            assertDoesNotThrow(() -> SecurityRules.requireValid(p));
        }
    }

    @Test
    void treasuryNoteWithCouponSix_isAccepted() {
        SecurityProto p = security(ProductTypeProto.TREASURY_NOTE, decimal("6.0"));
        assertTrue(SecurityRules.validate(p).isEmpty());
    }

    @Test
    void storedTbillWithCoupon_stillLoadsThroughFromProto() {
        SecurityProto p = security(ProductTypeProto.TBILL, decimal("6.0"));

        Security security = assertDoesNotThrow(() -> Security.fromProto(p));
        assertEquals(ID, security.getID());
        assertEquals(0, new BigDecimal("6.0").compareTo(
                ProtoSerializationUtil.deserializeBigDecimal(security.getProto().getBondDetails().getCouponRate())));
    }
}
