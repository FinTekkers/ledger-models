package protos.serializers.security;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.*;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
 *
 * For each type: construct → serialize to bytes → deserialize → verify all fields match.
 */
class SecurityProtoRoundTripTest {

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

    private static IdentifierProto identifier(IdentifierTypeProto type, String value) {
        return IdentifierProto.newBuilder()
                .setIdentifierType(type)
                .setIdentifierValue(value)
                .build();
    }

    private static SecurityProto roundTrip(SecurityProto original) throws InvalidProtocolBufferException {
        byte[] bytes = original.toByteArray();
        return SecurityProto.parseFrom(bytes);
    }

    @Test
    void bondSecurity_allFieldsSurviveRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.BOND_SECURITY)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
                .setIdentifier(identifier(IdentifierTypeProto.CUSIP, "912828ZT0"))
                .setDescription("UST 5% 2030")
                .setCouponRate(decimal("5.0"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setIssueDate(date(2020, 1, 15))
                .setDatedDate(date(2020, 1, 15))
                .setMaturityDate(date(2030, 1, 15))
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.BOND_SECURITY, parsed.getSecurityType());
        assertEquals("Fixed Income", parsed.getAssetClass());
        assertEquals("US Treasury", parsed.getIssuerName());
        assertEquals("UST 5% 2030", parsed.getDescription());
        assertEquals(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE, parsed.getQuantityType());
        assertEquals("5.0", parsed.getCouponRate().getArbitraryPrecisionValue());
        assertEquals(CouponTypeProto.FIXED, parsed.getCouponType());
        assertEquals(CouponFrequencyProto.SEMIANNUALLY, parsed.getCouponFrequency());
        assertEquals("1000", parsed.getFaceValue().getArbitraryPrecisionValue());
        assertEquals(2020, parsed.getIssueDate().getYear());
        assertEquals(1, parsed.getDatedDate().getMonth());
        assertEquals(2030, parsed.getMaturityDate().getYear());
        assertEquals(1, parsed.getMaturityDate().getMonth());
        assertEquals(15, parsed.getMaturityDate().getDay());
        assertEquals("912828ZT0", parsed.getIdentifier().getIdentifierValue());
        assertEquals(IdentifierTypeProto.CUSIP, parsed.getIdentifier().getIdentifierType());
    }

    @Test
    void tipsSecurity_bondFieldsPlusCpiSurviveRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.TIPS)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setCouponRate(decimal("0.625"))
                .setCouponType(CouponTypeProto.FIXED)
                .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                .setFaceValue(decimal("1000"))
                .setMaturityDate(date(2030, 1, 15))
                .setBaseCpi(decimal("256.394"))
                .setInflationIndexType(IndexTypeProto.CPI_U)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.TIPS, parsed.getSecurityType());
        assertEquals("0.625", parsed.getCouponRate().getArbitraryPrecisionValue());
        assertEquals(CouponTypeProto.FIXED, parsed.getCouponType());
        assertEquals(CouponFrequencyProto.SEMIANNUALLY, parsed.getCouponFrequency());
        assertEquals("1000", parsed.getFaceValue().getArbitraryPrecisionValue());
        assertEquals(2030, parsed.getMaturityDate().getYear());
        assertEquals("256.394", parsed.getBaseCpi().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.CPI_U, parsed.getInflationIndexType());
    }

    @Test
    void frnSecurity_spreadAndReferenceRateSurviveRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.FRN)
                .setAssetClass("Fixed Income")
                .setIssuerName("US Treasury")
                .setCouponType(CouponTypeProto.FLOAT)
                .setCouponFrequency(CouponFrequencyProto.QUARTERLY)
                .setFaceValue(decimal("100"))
                .setMaturityDate(date(2028, 1, 15))
                .setSpread(decimal("50"))
                .setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK)
                .setResetFrequency(CouponFrequencyProto.QUARTERLY)
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.FRN, parsed.getSecurityType());
        assertEquals(CouponTypeProto.FLOAT, parsed.getCouponType());
        assertEquals(CouponFrequencyProto.QUARTERLY, parsed.getCouponFrequency());
        assertEquals("100", parsed.getFaceValue().getArbitraryPrecisionValue());
        assertEquals(2028, parsed.getMaturityDate().getYear());
        assertEquals("50", parsed.getSpread().getArbitraryPrecisionValue());
        assertEquals(IndexTypeProto.T_BILL_13_WEEK, parsed.getReferenceRateIndex());
        assertEquals(CouponFrequencyProto.QUARTERLY, parsed.getResetFrequency());
    }

    @Test
    void equitySecurity_identifierAndAssetClassSurviveRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.EQUITY_SECURITY)
                .setAssetClass("Equity")
                .setIssuerName("Apple Inc.")
                .setQuantityType(SecurityQuantityTypeProto.UNITS)
                .setIdentifier(identifier(IdentifierTypeProto.EXCH_TICKER, "AAPL"))
                .setDescription("Apple Inc. Common Stock")
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.EQUITY_SECURITY, parsed.getSecurityType());
        assertEquals("Equity", parsed.getAssetClass());
        assertEquals("Apple Inc.", parsed.getIssuerName());
        assertEquals(SecurityQuantityTypeProto.UNITS, parsed.getQuantityType());
        assertEquals("Apple Inc. Common Stock", parsed.getDescription());
        assertEquals("AAPL", parsed.getIdentifier().getIdentifierValue());
        assertEquals(IdentifierTypeProto.EXCH_TICKER, parsed.getIdentifier().getIdentifierType());
    }

    @Test
    void cashSecurity_cashIdSurvivesRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.CASH_SECURITY)
                .setAssetClass("Cash")
                .setIssuerName("Federal Reserve")
                .setQuantityType(SecurityQuantityTypeProto.UNITS)
                .setCashId("USD")
                .setDescription("US Dollar")
                .setIdentifier(identifier(IdentifierTypeProto.CASH, "USD"))
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.CASH_SECURITY, parsed.getSecurityType());
        assertEquals("Cash", parsed.getAssetClass());
        assertEquals("USD", parsed.getCashId());
        assertEquals("US Dollar", parsed.getDescription());
        assertEquals("USD", parsed.getIdentifier().getIdentifierValue());
        assertEquals(IdentifierTypeProto.CASH, parsed.getIdentifier().getIdentifierType());
    }

    @Test
    void indexSecurity_indexTypeSurvivesRoundTrip() throws Exception {
        SecurityProto original = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setSecurityType(SecurityTypeProto.INDEX_SECURITY)
                .setAssetClass("Index")
                .setIssuerName("Bureau of Labor Statistics")
                .setDescription("US CPI-U All Urban Consumers")
                .setIndexType(IndexTypeProto.CPI_U)
                .setIdentifier(identifier(IdentifierTypeProto.CUSIP, "CPI-U"))
                .build();

        SecurityProto parsed = roundTrip(original);

        assertEquals(SecurityTypeProto.INDEX_SECURITY, parsed.getSecurityType());
        assertEquals("Index", parsed.getAssetClass());
        assertEquals("Bureau of Labor Statistics", parsed.getIssuerName());
        assertEquals("US CPI-U All Urban Consumers", parsed.getDescription());
        assertEquals(IndexTypeProto.CPI_U, parsed.getIndexType());
        assertEquals("CPI-U", parsed.getIdentifier().getIdentifierValue());
    }
}
