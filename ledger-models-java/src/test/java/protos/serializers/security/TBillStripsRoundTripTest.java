package protos.serializers.security;

import common.models.security.BondSecurity;
import common.models.security.Security;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityQuantityTypeProto;
import fintekkers.models.security.SecurityTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Regression test for the T_BILL / STRIPS_SECURITY round-trip path.
 *
 * Two layered concerns:
 *
 *   1. (#252 / PR #201) Bond-shaped fields (face_value, issue_date,
 *      dated_date, maturity_date, coupon_rate) must survive deserialize.
 *      Fix: route T_BILL + STRIPS_SECURITY through the bond-fields path
 *      in SecuritySerializer.deserialize / BondSerializer.initiatlize.
 *
 *   2. (#201 follow-up / PR #202) The security_type marker itself must
 *      survive deserialize → re-serialize. Fix: BondSecurity.getSecurityType
 *      now reads from the source proto when present, falling back to
 *      BOND_SECURITY only for legacy non-proto-constructed bonds. This is
 *      type-agnostic — adding a future bond-shape security_type to the
 *      proto won't require touching BondSecurity again.
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

    private static SecurityProto usdCashProto() {
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.CASH_SECURITY)
                .setAssetClass("Cash")
                .setIssuerName("Federal Reserve")
                .setQuantityType(SecurityQuantityTypeProto.UNITS)
                .setCashId("USD")
                .build();
    }

    private static SecurityProto.Builder zeroCouponBondShape(SecurityTypeProto type) {
        LocalDate issue = LocalDate.of(2025, 1, 15);
        LocalDate maturity = LocalDate.of(2025, 7, 15);
        return SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(type)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
                .setCouponRate(decimal("0"))
                .setCouponType(CouponTypeProto.ZERO)
                .setCouponFrequency(CouponFrequencyProto.NO_COUPON)
                .setFaceValue(decimal("1000"))
                .setIssueDate(date(issue))
                .setDatedDate(date(issue))
                .setMaturityDate(date(maturity))
                .setSettlementCurrency(usdCashProto());
    }

    @Test
    public void tBillBondFieldsSurviveDeserialize() {
        SecurityProto proto = zeroCouponBondShape(SecurityTypeProto.T_BILL).build();

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
        SecurityProto proto = zeroCouponBondShape(SecurityTypeProto.STRIPS_SECURITY).build();

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

    /**
     * Regression: BondSecurity.getSecurityType() used to hardcode BOND_SECURITY,
     * so a T_BILL proto deserialized → BondSecurity → re-serialized came out as
     * BOND_SECURITY. Empirically observed by data-sourcing-dev: 1,384 T_BILL
     * rows → 0 after a v0.1.143 ledger-service rebuild (rows mutated to
     * BOND_SECURITY in the read/hydrate path).
     *
     * Fix: BondSecurity.getSecurityType() now consults the source proto when
     * the type is T_BILL or STRIPS_SECURITY, falls back to BOND_SECURITY
     * otherwise. This test fails on main without the fix.
     */
    @Test
    public void tBillTypeMarkerSurvivesDeserializeReserialize() {
        SecurityProto original = zeroCouponBondShape(SecurityTypeProto.T_BILL).build();

        SecuritySerializer ser = SecuritySerializer.getInstance();
        Security deserialized = ser.deserialize(original);
        SecurityProto reSerialized = ser.serialize(deserialized);

        assertEquals(SecurityTypeProto.T_BILL, reSerialized.getSecurityType(),
                "T_BILL marker must survive round-trip; on the buggy path it reverts to BOND_SECURITY");
    }

    @Test
    public void stripsSecurityTypeMarkerSurvivesDeserializeReserialize() {
        SecurityProto original = zeroCouponBondShape(SecurityTypeProto.STRIPS_SECURITY).build();

        SecuritySerializer ser = SecuritySerializer.getInstance();
        Security deserialized = ser.deserialize(original);
        SecurityProto reSerialized = ser.serialize(deserialized);

        assertEquals(SecurityTypeProto.STRIPS_SECURITY, reSerialized.getSecurityType(),
                "STRIPS_SECURITY marker must survive round-trip; on the buggy path it reverts to BOND_SECURITY");
    }

    /**
     * Vanilla BOND_SECURITY round-trip: marker preserved (the generic
     * proto-read covers it the same as any other bond-shape type).
     */
    @Test
    public void vanillaBondTypeMarkerStillBondSecurity() {
        SecurityProto original = zeroCouponBondShape(SecurityTypeProto.BOND_SECURITY).build();

        SecuritySerializer ser = SecuritySerializer.getInstance();
        Security deserialized = ser.deserialize(original);
        SecurityProto reSerialized = ser.serialize(deserialized);

        assertEquals(SecurityTypeProto.BOND_SECURITY, reSerialized.getSecurityType());
    }

    /**
     * Locks in the legacy fallback path: a BondSecurity constructed via the
     * (id, issuer, asOf, settlementCurrency) constructor — without a stashed
     * SecurityProto — still reports BOND_SECURITY. Then attaching a proto
     * with a different type via setSecurityProto flips the reported type.
     * This pins the proto-first / legacy-fallback contract independently of
     * the deserialize path.
     */
    @Test
    public void getSecurityTypeFallsBackToBondSecurityWhenProtoUnset() {
        BondSecurity bond = new BondSecurity(
                java.util.UUID.randomUUID(),
                "Issuer",
                java.time.ZonedDateTime.now(),
                common.models.security.CashSecurity.USD);

        assertEquals(SecurityTypeProto.BOND_SECURITY, bond.getSecurityType(),
                "No source proto → legacy fallback to BOND_SECURITY");

        bond.setSecurityProto(zeroCouponBondShape(SecurityTypeProto.T_BILL).build());
        assertEquals(SecurityTypeProto.T_BILL, bond.getSecurityType(),
                "Source proto present → reports the proto's type (generic, not special-cased)");
    }
}
