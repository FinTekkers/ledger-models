package protos.serializers.security;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.*;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ISSUE #8: Round-trip tests for the oneof product_details sub-messages.
 *
 * These tests verify that the new oneof variant (tags 200+) survives
 * serialize → bytes → deserialize, and that the oneof discriminator
 * (getProductDetailsCase()) correctly identifies the variant.
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

    private static SecurityProto roundTrip(SecurityProto original) throws InvalidProtocolBufferException {
        byte[] bytes = original.toByteArray();
        return SecurityProto.parseFrom(bytes);
    }

    @Test
    void bondDetails_oneofSurvivesRoundTrip() throws Exception {
        BondDetailsProto bondDetails = BondDetailsProto.newBuilder()
                .setCouponRate(decimal("5.0"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setIssueDate(date(2020, 1, 15))
                .setDatedDate(date(2020, 1, 15))
                .setMaturityDate(date(2030, 1, 15))
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.BOND_SECURITY)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setBondDetails(bondDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.BOND_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasBondDetails());
        assertFalse(parsed.hasTipsDetails());

        BondDetailsProto bond = parsed.getBondDetails();
        assertEquals("5.0", bond.getCouponRate().getArbitraryPrecisionValue());
        assertEquals(CouponTypeProto.FIXED, bond.getCouponType());
        assertEquals(CouponFrequencyProto.SEMIANNUALLY, bond.getCouponFrequency());
        assertEquals("1000", bond.getFaceValue().getArbitraryPrecisionValue());
        assertEquals(2020, bond.getIssueDate().getYear());
        assertEquals(2020, bond.getDatedDate().getYear());
        assertEquals(2030, bond.getMaturityDate().getYear());
    }

    @Test
    void tipsDetails_oneofSurvivesRoundTrip() throws Exception {
        TipsDetailsProto tipsDetails = TipsDetailsProto.newBuilder()
                .setCouponRate(decimal("0.625"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setMaturityDate(date(2030, 1, 15))
                .setBaseCpi(decimal("256.394"))
                .setInflationIndexType(IndexTypeProto.CPI_U)
                .setIndexDate(date(2020, 1, 1))
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.TIPS)
                .setTipsDetails(tipsDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.TIPS_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasTipsDetails());

        TipsDetailsProto tips = parsed.getTipsDetails();
        assertEquals("0.625", tips.getCouponRate().getArbitraryPrecisionValue());
        assertEquals("256.394", tips.getBaseCpi().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.CPI_U, tips.getInflationIndexType());
        assertEquals(2020, tips.getIndexDate().getYear());
        assertEquals(2030, tips.getMaturityDate().getYear());
    }

    @Test
    void frnDetails_oneofSurvivesRoundTrip() throws Exception {
        FrnDetailsProto frnDetails = FrnDetailsProto.newBuilder()
                .setCouponType(CouponTypeProto.FLOAT)
                .setCouponFrequency(CouponFrequencyProto.QUARTERLY)
                .setFaceValue(decimal("100"))
                .setMaturityDate(date(2028, 1, 15))
                .setSpread(decimal("50"))
                .setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK)
                .setResetFrequency(CouponFrequencyProto.QUARTERLY)
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.FRN)
                .setFrnDetails(frnDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.FRN_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasFrnDetails());

        FrnDetailsProto frn = parsed.getFrnDetails();
        assertEquals(CouponTypeProto.FLOAT, frn.getCouponType());
        assertEquals("50", frn.getSpread().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.T_BILL_13_WEEK, frn.getReferenceRateIndex());
        assertEquals(CouponFrequencyProto.QUARTERLY, frn.getResetFrequency());
    }

    @Test
    void indexDetails_oneofSurvivesRoundTrip() throws Exception {
        IndexDetailsProto indexDetails = IndexDetailsProto.newBuilder()
                .setIndexType(IndexTypeProto.CPI_U)
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.INDEX_SECURITY)
                .setIndexDetails(indexDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.INDEX_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasIndexDetails());
        assertEquals(IndexTypeProto.CPI_U, parsed.getIndexDetails().getIndexType());
    }

    @Test
    void cashDetails_oneofSurvivesRoundTrip() throws Exception {
        CashDetailsProto cashDetails = CashDetailsProto.newBuilder()
                .setCashId("USD")
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.CASH_SECURITY)
                .setCashDetails(cashDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.CASH_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasCashDetails());
        assertEquals("USD", parsed.getCashDetails().getCashId());
    }

    @Test
    void equityDetails_oneofSurvivesRoundTrip() throws Exception {
        EquityDetailsProto equityDetails = EquityDetailsProto.newBuilder()
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.EQUITY_SECURITY)
                .setAssetClass("Equity")
                .setEquityDetails(equityDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.EQUITY_DETAILS, parsed.getProductDetailsCase());
        assertTrue(parsed.hasEquityDetails());
    }

    @Test
    void dualWrite_bothFlatAndOneofSurviveRoundTrip() throws Exception {
        // Simulate dual-write: populate BOTH flat fields and oneof
        BondDetailsProto bondDetails = BondDetailsProto.newBuilder()
                .setCouponRate(decimal("5.0"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setMaturityDate(date(2030, 1, 15))
                .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.BOND_SECURITY)
                // Flat fields (legacy)
                .setCouponRate(decimal("5.0"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setMaturityDate(date(2030, 1, 15))
                // oneof (new)
                .setBondDetails(bondDetails)
                .build();

        SecurityProto parsed = roundTrip(original);

        // Both flat and oneof should survive
        assertEquals("5.0", parsed.getCouponRate().getArbitraryPrecisionValue());
        assertEquals("5.0", parsed.getBondDetails().getCouponRate().getArbitraryPrecisionValue());
        assertEquals(SecurityProto.ProductDetailsCase.BOND_DETAILS, parsed.getProductDetailsCase());
        assertEquals(2030, parsed.getMaturityDate().getYear());
        assertEquals(2030, parsed.getBondDetails().getMaturityDate().getYear());
    }

    @Test
    void noProductDetails_caseIsNotSet() throws Exception {
        // A proto with no oneof set should have PRODUCTDETAILS_NOT_SET
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.BOND_SECURITY)
                .setCouponRate(decimal("5.0"))
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityProto.ProductDetailsCase.PRODUCTDETAILS_NOT_SET, parsed.getProductDetailsCase());
        assertFalse(parsed.hasBondDetails());
        // Flat fields still work
        assertEquals("5.0", parsed.getCouponRate().getArbitraryPrecisionValue());
    }
}
