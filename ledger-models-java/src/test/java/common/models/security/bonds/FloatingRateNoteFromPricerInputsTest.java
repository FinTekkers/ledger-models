package common.models.security.bonds;

import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.index.IndexTypeProto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FloatingRateNoteFromPricerInputsTest {

    private static final BigDecimal FACE = new BigDecimal("1000");
    private static final BigDecimal COUPON = new BigDecimal("0.0001");
    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 31);
    private static final LocalDate MATURITY = LocalDate.of(2026, 1, 31);
    private static final BigDecimal SPREAD = new BigDecimal("0.0014");

    @Test
    public void frnFromPricerInputs_populatesBondDetailsAndFrnExtension() {
        SecurityProto proto = FloatingRateNote.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FLOAT, CouponFrequencyProto.QUARTERLY,
                ISSUE, MATURITY, SPREAD, IndexTypeProto.T_BILL_13_WEEK,
                CouponFrequencyProto.MONTHLY);

        assertEquals(ProductTypeProto.TREASURY_FRN, proto.getProductType());
        assertTrue(proto.hasBondDetails(), "bond_details must be populated");
        assertTrue(proto.hasFrnExtension(), "frn_extension must be populated");

        assertEquals(SPREAD.toPlainString(),
                proto.getFrnExtension().getSpread().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.T_BILL_13_WEEK,
                proto.getFrnExtension().getReferenceRateIndex());
        assertEquals(CouponFrequencyProto.MONTHLY,
                proto.getFrnExtension().getResetFrequency());
    }

    @Test
    public void frnFromPricerInputs_roundTripsViaBytes() throws Exception {
        SecurityProto original = FloatingRateNote.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FLOAT, CouponFrequencyProto.QUARTERLY,
                ISSUE, MATURITY, SPREAD, IndexTypeProto.T_BILL_13_WEEK,
                CouponFrequencyProto.MONTHLY);

        byte[] bytes = original.toByteArray();
        SecurityProto decoded = SecurityProto.parseFrom(bytes);

        assertEquals(original, decoded);
        assertEquals(ProductTypeProto.TREASURY_FRN, decoded.getProductType());
        assertEquals(SPREAD.toPlainString(),
                decoded.getFrnExtension().getSpread().getArbitraryPrecisionValue());
    }
}
