package protos.serializers.security;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.*;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * v0.3.0 / #272: Round-trip tests for the consolidated SecurityProto shape.
 *
 * Shared bond fields live in the canonical {@code bond_details} field for
 * every product type descending from BOND in hierarchy.json. TIPS and FRN
 * additionally populate {@code tips_extension} / {@code frn_extension} —
 * these CO-EXIST with bond_details, not replace it. Non-bond products use
 * the {@code non_bond_details} oneof.
 *
 * One test per active bond-shape leaf in hierarchy.json:
 * TBILL, TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN, STRIPS,
 * SOVEREIGN_BOND, CORP_BOND, MUNI_BOND.
 */
class OneofProductDetailsRoundTripTest {

    private static DecimalValueProto decimal(String value) {
        return DecimalValueProto.newBuilder()
                .setArbitraryPrecisionValue(value)
                .build();
    }

    private static LocalDateProto date(int year, int month, int day) {
        return LocalDateProto.newBuilder()
                .setYear(year).setMonth(month).setDay(day)
                .build();
    }

    private static BondDetailsProto bondDetails(String coupon, String face, int matYear) {
        return BondDetailsProto.newBuilder()
                .setCouponRate(decimal(coupon))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal(face))
                .setIssueDate(date(2020, 1, 15))
                .setDatedDate(date(2020, 1, 15))
                .setMaturityDate(date(matYear, 1, 15))
                .build();
    }

    private static SecurityProto roundTrip(SecurityProto original) throws InvalidProtocolBufferException {
        byte[] bytes = original.toByteArray();
        return SecurityProto.parseFrom(bytes);
    }

    private static void assertBondDetailsRoundTrip(SecurityProto parsed, String coupon, String face, int matYear) {
        assertTrue(parsed.hasBondDetails(), "bond_details must be populated for bond-shape products");
        BondDetailsProto bond = parsed.getBondDetails();
        assertEquals(coupon, bond.getCouponRate().getArbitraryPrecisionValue());
        assertEquals(CouponTypeProto.FIXED, bond.getCouponType());
        assertEquals(CouponFrequencyProto.SEMIANNUALLY, bond.getCouponFrequency());
        assertEquals(face, bond.getFaceValue().getArbitraryPrecisionValue());
        assertEquals(2020, bond.getIssueDate().getYear());
        assertEquals(matYear, bond.getMaturityDate().getYear());
    }

    // ---------------- 9 active bond-shape leaves from hierarchy.json ----------------

    @Test
    void tbill_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TBILL)
                .setBondDetails(bondDetails("0.0", "100", 2024))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.TBILL, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "0.0", "100", 2024);
        assertFalse(parsed.hasTipsExtension(), "TBILL must not populate tips_extension");
        assertFalse(parsed.hasFrnExtension(), "TBILL must not populate frn_extension");
    }

    @Test
    void treasuryNote_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TREASURY_NOTE)
                .setBondDetails(bondDetails("4.5", "1000", 2030))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.TREASURY_NOTE, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "4.5", "1000", 2030);
    }

    @Test
    void treasuryBond_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TREASURY_BOND)
                .setBondDetails(bondDetails("3.875", "1000", 2050))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.TREASURY_BOND, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "3.875", "1000", 2050);
    }

    @Test
    void tips_roundTripPopulatesBondDetailsAndTipsExtension() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TIPS)
                .setBondDetails(bondDetails("0.625", "1000", 2030))
                .setTipsExtension(TipsExtensionProto.newBuilder()
                        .setBaseCpi(decimal("256.394"))
                        .setIndexDate(date(2020, 1, 1))
                        .setInflationIndexType(IndexTypeProto.CPI_U)
                        .build())
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(ProductTypeProto.TIPS, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "0.625", "1000", 2030);
        assertTrue(parsed.hasTipsExtension(), "TIPS must populate tips_extension");
        TipsExtensionProto tips = parsed.getTipsExtension();
        assertEquals("256.394", tips.getBaseCpi().getArbitraryPrecisionValue());
        assertEquals(2020, tips.getIndexDate().getYear());
        assertEquals(IndexTypeProto.CPI_U, tips.getInflationIndexType());
        assertFalse(parsed.hasFrnExtension(), "TIPS must not populate frn_extension");
    }

    @Test
    void treasuryFrn_roundTripPopulatesBondDetailsAndFrnExtension() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TREASURY_FRN)
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setCouponType(CouponTypeProto.FLOAT)
                        .setCouponFrequency(CouponFrequencyProto.QUARTERLY)
                        .setFaceValue(decimal("100"))
                        .setIssueDate(date(2025, 1, 15))
                        .setMaturityDate(date(2028, 1, 15))
                        .build())
                .setFrnExtension(FrnExtensionProto.newBuilder()
                        .setSpread(decimal("50"))
                        .setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK)
                        .setResetFrequency(CouponFrequencyProto.QUARTERLY)
                        .build())
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(ProductTypeProto.TREASURY_FRN, parsed.getProductType());
        assertTrue(parsed.hasBondDetails());
        assertEquals(CouponTypeProto.FLOAT, parsed.getBondDetails().getCouponType());
        assertEquals(2028, parsed.getBondDetails().getMaturityDate().getYear());

        assertTrue(parsed.hasFrnExtension(), "FRN must populate frn_extension");
        FrnExtensionProto frn = parsed.getFrnExtension();
        assertEquals("50", frn.getSpread().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.T_BILL_13_WEEK, frn.getReferenceRateIndex());
        assertEquals(CouponFrequencyProto.QUARTERLY, frn.getResetFrequency());
        assertFalse(parsed.hasTipsExtension(), "FRN must not populate tips_extension");
    }

    @Test
    void strips_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.STRIPS)
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setCouponType(CouponTypeProto.ZERO)
                        .setFaceValue(decimal("100"))
                        .setIssueDate(date(2020, 1, 15))
                        .setMaturityDate(date(2032, 1, 15))
                        .build())
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.STRIPS, parsed.getProductType());
        assertTrue(parsed.hasBondDetails());
        assertEquals(CouponTypeProto.ZERO, parsed.getBondDetails().getCouponType());
    }

    @Test
    void sovereignBond_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.SOVEREIGN_BOND)
                .setBondDetails(bondDetails("2.5", "100", 2035))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.SOVEREIGN_BOND, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "2.5", "100", 2035);
    }

    @Test
    void corpBond_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.CORP_BOND)
                .setBondDetails(bondDetails("6.25", "1000", 2030))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.CORP_BOND, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "6.25", "1000", 2030);
    }

    @Test
    void muniBond_roundTripPopulatesBondDetails() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.MUNI_BOND)
                .setBondDetails(bondDetails("3.0", "5000", 2040))
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(ProductTypeProto.MUNI_BOND, parsed.getProductType());
        assertBondDetailsRoundTrip(parsed, "3.0", "5000", 2040);
    }

    // ---------------- Non-bond oneof variants ----------------

    @Test
    void cashDetails_oneofSurvivesRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.CURRENCY)
                .setCashDetails(CashDetailsProto.newBuilder().setCashId("USD").build())
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(SecurityProto.NonBondDetailsCase.CASH_DETAILS, parsed.getNonBondDetailsCase());
        assertEquals("USD", parsed.getCashDetails().getCashId());
        assertFalse(parsed.hasBondDetails(), "non-bond must not populate bond_details");
    }

    @Test
    void equityDetails_oneofSurvivesRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.COMMON_STOCK)
                .setEquityDetails(EquityDetailsProto.newBuilder().build())
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(SecurityProto.NonBondDetailsCase.EQUITY_DETAILS, parsed.getNonBondDetailsCase());
        assertTrue(parsed.hasEquityDetails());
        assertFalse(parsed.hasBondDetails());
    }

    @Test
    void indexDetails_oneofSurvivesRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.EQUITY_INDEX)
                .setIndexDetails(IndexDetailsProto.newBuilder()
                        .setIndexType(IndexTypeProto.CPI_U)
                        .build())
                .build();
        SecurityProto parsed = roundTrip(original);
        assertEquals(SecurityProto.NonBondDetailsCase.INDEX_DETAILS, parsed.getNonBondDetailsCase());
        assertEquals(IndexTypeProto.CPI_U, parsed.getIndexDetails().getIndexType());
    }

    @Test
    void nonBondOneofIsMutuallyExclusive() throws Exception {
        // Setting one variant clears any previously-set variant in the oneof.
        SecurityProto original = SecurityProto.newBuilder()
                .setCashDetails(CashDetailsProto.newBuilder().setCashId("USD").build())
                .setEquityDetails(EquityDetailsProto.newBuilder().build())
                .build();
        // Last setter wins inside a oneof
        assertEquals(SecurityProto.NonBondDetailsCase.EQUITY_DETAILS, original.getNonBondDetailsCase());
    }

    @Test
    void bondDetailsAndNonBondOneofCanCoexist() throws Exception {
        // bond_details and the non_bond_details oneof are independent. A
        // bond-shape product would not populate non_bond_details in practice,
        // but the wire layout allows both — this guards against an accidental
        // promotion of bond_details back into the oneof.
        SecurityProto original = SecurityProto.newBuilder()
                .setBondDetails(bondDetails("5.0", "1000", 2030))
                .setIndexDetails(IndexDetailsProto.newBuilder()
                        .setIndexType(IndexTypeProto.CPI_U)
                        .build())
                .build();
        SecurityProto parsed = roundTrip(original);
        assertTrue(parsed.hasBondDetails());
        assertTrue(parsed.hasIndexDetails());
    }
}
