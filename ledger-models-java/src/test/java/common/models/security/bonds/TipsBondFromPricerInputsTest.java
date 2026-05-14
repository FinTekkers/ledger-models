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

class TipsBondFromPricerInputsTest {

    private static final BigDecimal FACE = new BigDecimal("1000");
    private static final BigDecimal COUPON = new BigDecimal("0.01125");
    private static final LocalDate ISSUE = LocalDate.of(2024, 1, 15);
    private static final LocalDate MATURITY = LocalDate.of(2034, 1, 15);
    private static final BigDecimal BASE_CPI = new BigDecimal("256.394");
    private static final LocalDate INDEX_DATE = LocalDate.of(2024, 1, 1);

    @Test
    public void tipsFromPricerInputs_populatesBondDetailsAndTipsExtension() {
        SecurityProto proto = TIPSBond.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY,
                ISSUE, MATURITY, BASE_CPI, INDEX_DATE, IndexTypeProto.CPI_U);

        assertEquals(ProductTypeProto.TIPS, proto.getProductType());
        assertTrue(proto.hasBondDetails(), "bond_details must be populated");
        assertTrue(proto.hasTipsExtension(), "tips_extension must be populated");

        assertEquals(FACE.toPlainString(),
                proto.getBondDetails().getFaceValue().getArbitraryPrecisionValue());
        assertEquals(BASE_CPI.toPlainString(),
                proto.getTipsExtension().getBaseCpi().getArbitraryPrecisionValue());
        assertEquals(INDEX_DATE.getYear(), proto.getTipsExtension().getIndexDate().getYear());
        assertEquals(IndexTypeProto.CPI_U, proto.getTipsExtension().getInflationIndexType());
    }

    @Test
    public void tipsFromPricerInputs_roundTripsViaBytes() throws Exception {
        SecurityProto original = TIPSBond.fromPricerInputs(
                FACE, COUPON, CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY,
                ISSUE, MATURITY, BASE_CPI, INDEX_DATE, IndexTypeProto.CPI_U);

        byte[] bytes = original.toByteArray();
        SecurityProto decoded = SecurityProto.parseFrom(bytes);

        assertEquals(original, decoded);
        assertEquals(ProductTypeProto.TIPS, decoded.getProductType());
        assertEquals(BASE_CPI.toPlainString(),
                decoded.getTipsExtension().getBaseCpi().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.CPI_U, decoded.getTipsExtension().getInflationIndexType());
    }
}
