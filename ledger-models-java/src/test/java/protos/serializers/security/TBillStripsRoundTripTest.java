package protos.serializers.security;

import common.models.security.BondSecurity;
import common.models.security.Security;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityQuantityTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Regression test for #252 — T_BILL and STRIPS_SECURITY were added in v0.1.141
 * but were not wired into SecuritySerializer.deserialize / BondSerializer.initiatlize.
 * They fell through to the default branch and produced a plain Security with all
 * bond fields dropped on round-trip.
 *
 * This test exercises the fix: T_BILL and STRIPS_SECURITY proto → BondSecurity
 * with face_value, issue_date, maturity_date, dated_date, coupon_rate populated.
 */
class TBillStripsRoundTripTest {

    private static DecimalValueProto decimal(String v) {
        return DecimalValueProto.newBuilder().setArbitraryPrecisionValue(v).build();
    }

    private static LocalDateProto date(LocalDate d) {
        return LocalDateProto.newBuilder()
                .setYear(d.getYear()).setMonth(d.getMonthValue()).setDay(d.getDayOfMonth())
                .build();
    }

    private static SecurityProto.Builder zeroCouponBondShape(ProductTypeProto type) {
        LocalDate issue = LocalDate.of(2025, 1, 15);
        LocalDate maturity = LocalDate.of(2025, 7, 15);
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setProductType(type)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
                .setCouponRate(decimal("0"))
                .setCouponType(CouponTypeProto.ZERO)
                .setCouponFrequency(CouponFrequencyProto.NO_COUPON)
                .setFaceValue(decimal("1000"))
                .setIssueDate(date(issue))
                .setDatedDate(date(issue))
                .setMaturityDate(date(maturity));
    }

    @Test
    public void tBillBondFieldsSurviveDeserialize() {
        SecurityProto proto = zeroCouponBondShape(ProductTypeProto.TBILL).build();

        Security security = SecuritySerializer.getInstance().deserialize(proto);

        assertInstanceOf(BondSecurity.class, security,
                "T_BILL must deserialize to BondSecurity, not the default plain Security");
        BondSecurity bond = (BondSecurity) security;
        assertNotNull(bond.getFaceValue());
        assertEquals(0, bond.getFaceValue().compareTo(BigDecimal.valueOf(1000)));
        assertEquals(LocalDate.of(2025, 1, 15), bond.getIssueDate());
        assertEquals(LocalDate.of(2025, 1, 15), bond.getDatedDate());
        assertEquals(LocalDate.of(2025, 7, 15), bond.getMaturityDate());
        assertNotNull(bond.getCouponRate());
        assertEquals(0, bond.getCouponRate().compareTo(BigDecimal.ZERO));
    }

    @Test
    public void stripsSecurityBondFieldsSurviveDeserialize() {
        SecurityProto proto = zeroCouponBondShape(ProductTypeProto.STRIPS).build();

        Security security = SecuritySerializer.getInstance().deserialize(proto);

        assertInstanceOf(BondSecurity.class, security,
                "STRIPS_SECURITY must deserialize to BondSecurity, not the default plain Security");
        BondSecurity bond = (BondSecurity) security;
        assertNotNull(bond.getFaceValue());
        assertEquals(0, bond.getFaceValue().compareTo(BigDecimal.valueOf(1000)));
        assertEquals(LocalDate.of(2025, 1, 15), bond.getIssueDate());
        assertEquals(LocalDate.of(2025, 1, 15), bond.getDatedDate());
        assertEquals(LocalDate.of(2025, 7, 15), bond.getMaturityDate());
    }
}
