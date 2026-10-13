package common.models.security.bonds;

import common.models.security.CashSecurity;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.bond.AgencyProto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;
import testutil.Decimals;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MortgageBackedSecurityFromPricerInputsTest {

    private static final BigDecimal FACE = new BigDecimal("1000");
    private static final BigDecimal COUPON = new BigDecimal("0.04");
    private static final LocalDate ISSUE = LocalDate.of(2024, 2, 1);
    private static final LocalDate MATURITY = LocalDate.of(2054, 1, 1);

    private static final String POOL_NUMBER = "FN AS1234";
    private static final AgencyProto AGENCY = AgencyProto.FNMA;
    private static final BigDecimal WAC = new BigDecimal("0.045");
    private static final int WAM = 358;
    private static final BigDecimal PASS_THROUGH_RATE = new BigDecimal("0.04");
    private static final BigDecimal CURRENT_FACTOR = new BigDecimal("0.95");
    private static final BigDecimal ORIGINAL_FACE_VALUE = new BigDecimal("250000000");
    private static final BigDecimal CURRENT_UPB = new BigDecimal("237500000");
    private static final BigDecimal PSA_SPEED = new BigDecimal("150");

    @Test
    public void mbsFromPricerInputs_populatesBondDetailsAndMbsExtension() {
        SecurityProto proto = MortgageBackedSecurity.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.MONTHLY,
                ISSUE, MATURITY,
                POOL_NUMBER, AGENCY, WAC, WAM, PASS_THROUGH_RATE,
                CURRENT_FACTOR, ORIGINAL_FACE_VALUE, CURRENT_UPB, PSA_SPEED);

        assertEquals(ProductTypeProto.MORTGAGE_BACKED, proto.getProductType());
        assertTrue(proto.hasBondDetails(), "bond_details must be populated");
        assertTrue(proto.hasMbsExtension(), "mbs_extension must be populated");

        assertEquals(FACE.toPlainString(),
                Decimals.text(proto.getBondDetails().getFaceValue()));
        assertEquals(COUPON.toPlainString(),
                Decimals.text(proto.getBondDetails().getCouponRate()));

        assertEquals(POOL_NUMBER, proto.getMbsExtension().getPoolNumber());
        assertEquals(AGENCY, proto.getMbsExtension().getAgency());
        assertEquals(WAC.toPlainString(),
                Decimals.text(proto.getMbsExtension().getWac()));
        assertEquals(WAM, proto.getMbsExtension().getWam());
        assertEquals(PASS_THROUGH_RATE.toPlainString(),
                Decimals.text(proto.getMbsExtension().getPassThroughRate()));
        assertEquals(CURRENT_FACTOR.toPlainString(),
                Decimals.text(proto.getMbsExtension().getCurrentFactor()));
        assertEquals(ORIGINAL_FACE_VALUE.toPlainString(),
                Decimals.text(proto.getMbsExtension().getOriginalFaceValue()));
        assertEquals(CURRENT_UPB.toPlainString(),
                Decimals.text(proto.getMbsExtension().getCurrentUpb()));
        assertEquals(PSA_SPEED.toPlainString(),
                Decimals.text(proto.getMbsExtension().getPsaSpeed()));
    }

    @Test
    public void mbsFromPricerInputs_roundTripsViaBytes() throws Exception {
        SecurityProto original = MortgageBackedSecurity.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.MONTHLY,
                ISSUE, MATURITY,
                POOL_NUMBER, AGENCY, WAC, WAM, PASS_THROUGH_RATE,
                CURRENT_FACTOR, ORIGINAL_FACE_VALUE, CURRENT_UPB, PSA_SPEED);

        byte[] bytes = original.toByteArray();
        SecurityProto decoded = SecurityProto.parseFrom(bytes);

        assertEquals(original, decoded);
        assertEquals(ProductTypeProto.MORTGAGE_BACKED, decoded.getProductType());

        // Re-wrap into the typed domain object and verify each typed accessor.
        MortgageBackedSecurity wrapper = new MortgageBackedSecurity(
                UUID.randomUUID(), "Test", ZonedDateTime.now(), CashSecurity.USD);
        wrapper.setSecurityProto(decoded);

        assertEquals(POOL_NUMBER, wrapper.getPoolNumber());
        assertEquals(AGENCY, wrapper.getAgency());
        assertEquals(0, WAC.compareTo(wrapper.getWac()));
        assertEquals(WAM, wrapper.getWam());
        assertEquals(0, PASS_THROUGH_RATE.compareTo(wrapper.getPassThroughRate()));
        assertEquals(0, CURRENT_FACTOR.compareTo(wrapper.getCurrentFactor()));
        assertEquals(0, ORIGINAL_FACE_VALUE.compareTo(wrapper.getOriginalFaceValue()));
        assertEquals(0, CURRENT_UPB.compareTo(wrapper.getCurrentUpb()));
        assertEquals(0, PSA_SPEED.compareTo(wrapper.getPsaSpeed()));
    }
}
