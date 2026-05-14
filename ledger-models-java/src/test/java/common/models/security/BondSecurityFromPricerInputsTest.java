package common.models.security;

import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BondSecurityFromPricerInputsTest {

    private static final BigDecimal FACE = new BigDecimal("1000");
    private static final BigDecimal COUPON = new BigDecimal("0.04125");
    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 1, 15);

    @Test
    public void bondFromPricerInputs_populatesBondDetails() {
        SecurityProto proto = BondSecurity.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY,
                ISSUE, MATURITY);

        assertEquals(ProductTypeProto.TREASURY_NOTE, proto.getProductType());
        assertTrue(proto.hasBondDetails(), "bond_details must be populated");
        assertEquals(FACE.toPlainString(),
                proto.getBondDetails().getFaceValue().getArbitraryPrecisionValue());
        assertEquals(COUPON.toPlainString(),
                proto.getBondDetails().getCouponRate().getArbitraryPrecisionValue());
        assertEquals(CouponTypeProto.FIXED, proto.getBondDetails().getCouponType());
        assertEquals(CouponFrequencyProto.SEMIANNUALLY, proto.getBondDetails().getCouponFrequency());
        assertEquals(ISSUE.getYear(), proto.getBondDetails().getIssueDate().getYear());
        assertEquals(MATURITY.getYear(), proto.getBondDetails().getMaturityDate().getYear());
    }

    @Test
    public void bondFromPricerInputs_roundTripsViaBytes() throws Exception {
        SecurityProto original = BondSecurity.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY,
                ISSUE, MATURITY);

        byte[] bytes = original.toByteArray();
        SecurityProto decoded = SecurityProto.parseFrom(bytes);

        assertEquals(original, decoded);
        assertEquals(ProductTypeProto.TREASURY_NOTE, decoded.getProductType());
        assertEquals(FACE.toPlainString(),
                decoded.getBondDetails().getFaceValue().getArbitraryPrecisionValue());
        assertEquals(COUPON.toPlainString(),
                decoded.getBondDetails().getCouponRate().getArbitraryPrecisionValue());
    }
}
