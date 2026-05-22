package protos.serializers;

import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Wrapper round-trip + preservation tests for {@link Security}.
 *
 * <p>Post-#338 refactor: replaces SecuritySerializerTest. The serialize/
 * deserialize entry points are now {@code security.getProto()} and
 * {@code Security.fromProto(proto)} — no separate Serializer indirection.
 *
 * <p>Round-trip invariant: wrap-then-unwrap (or unwrap-then-wrap) preserves
 * all data, including fields without an explicit domain accessor (instrument_type,
 * legs, asset_class, product_type, index_details).
 */
class SecurityWrapperTest {

    @Test
    public void testBaseSecurityAndEquitySecurityWrap() {
        final var security = DummyEquityObjects.getDummySecurity();

        String description = new Random().nextInt() % 2 == 0 ? null : "TEST";
        security.setDescription(description);

        final SecurityProto proto = security.getProto();
        final var copy = Security.fromProto(proto);

        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        assertEquals(security.getIssuer(), copy.getIssuer());
        assertEquals(security.getQuantityType(), copy.getQuantityType());

        assertEquals(security.getDescription(), copy.getDescription());

        assertEquals(security.getSettlementCurrency().getID(), copy.getSettlementCurrency().getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        assertEquals(security.getSettlementCurrency().getIssuer(), copy.getSettlementCurrency().getIssuer());
        assertEquals(security.getSettlementCurrency().getQuantityType(), copy.getSettlementCurrency().getQuantityType());

        assertEquals(security.getIdentifiers().get(0).getIdentifier(), copy.getIdentifiers().get(0).getIdentifier());
        assertEquals(security.getIdentifiers().get(0).getIdentifierType(), copy.getIdentifiers().get(0).getIdentifierType());
    }

    @Test
    public void testBondSecurityWrap() {
        final var security = DummyBondObjects.getDummySecurity();

        final SecurityProto proto = security.getProto();
        final var copy = (BondSecurity) Security.fromProto(proto);

        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        assertEquals(security.getFaceValue().doubleValue(), copy.getFaceValue().doubleValue());
        assertEquals(security.getCouponRate().doubleValue(), copy.getCouponRate().doubleValue());
        assertEquals(security.getCouponFrequency(), copy.getCouponFrequency());
        assertEquals(security.getCouponType(), copy.getCouponType());
        assertEquals(security.getDatedDate(), copy.getDatedDate());
        assertEquals(security.getIssueDate(), copy.getIssueDate());
        assertEquals(security.getMaturityDate(), copy.getMaturityDate());
        assertEquals(security.getPriceScaleFactor().doubleValue(), copy.getPriceScaleFactor().doubleValue());
    }

    @Test
    public void testCashWrap() {
        final var security = CashSecurity.USD;

        final SecurityProto proto = security.getProto();
        final var copy = (CashSecurity) Security.fromProto(proto);

        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));
    }

    @Test
    public void testDeserializeSettlementCurrencyIsLinkDoesNotThrow() {
        // Issue #93: when settlement_currency has is_link=true (UUID-only reference),
        // Security.fromProto must not throw — it should produce null instead.
        UUID linkUuid = UUID.randomUUID();
        SecurityProto linkProto = SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(protos.serializers.util.proto.ProtoSerializationUtil.serializeUUID(linkUuid))
                .build();

        SecurityProto bondWithLink = SecurityProto.newBuilder(
                        DummyBondObjects.getDummySecurity().getProto())
                .setSettlementCurrency(linkProto)
                .build();

        Security result = assertDoesNotThrow(() -> Security.fromProto(bondWithLink),
                "Security.fromProto must not throw when settlement_currency.is_link=true");
        assertNull(result.getSettlementCurrency(),
                "settlement_currency should be null when the embedded proto is a link reference");
    }

    // Issue #96: maturity_date must be strictly after issue_date for bond-type securities.
    // Validation lives in Security.fromProto (carried forward from the deleted SecuritySerializer).

    @Test
    public void testBondWithMaturityBeforeIssueDateThrows() {
        BondSecurity invalid = DummyBondObjects.getDummySecurity(
                ZonedDateTime.now(), "91282CEP2",
                LocalDate.of(2032, 5, 16),
                LocalDate.of(2022, 5, 16),
                BigDecimal.valueOf(2.875));
        SecurityProto proto = invalid.getProto();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> Security.fromProto(proto),
                "Security.fromProto must reject bond where maturity_date < issue_date");
        assertTrue(ex.getMessage().contains("maturity_date must be after issue_date"));
    }

    @Test
    public void testBondWithMaturityEqualToIssueDateThrows() {
        LocalDate sameDate = LocalDate.of(2025, 6, 1);
        BondSecurity invalid = DummyBondObjects.getDummySecurity(
                ZonedDateTime.now(), "91282CEP2",
                sameDate,
                sameDate,
                BigDecimal.valueOf(2.875));
        SecurityProto proto = invalid.getProto();

        assertThrows(IllegalArgumentException.class,
                () -> Security.fromProto(proto),
                "Security.fromProto must reject bond where maturity_date == issue_date");
    }

    @Test
    public void testBondWithValidDatesDoesNotThrow() {
        BondSecurity valid = DummyBondObjects.getDummySecurity();
        SecurityProto proto = valid.getProto();

        assertDoesNotThrow(() -> Security.fromProto(proto),
                "Security.fromProto must accept bond where maturity_date > issue_date");
    }

    // ---- Round-trip preservation for fields without explicit domain accessors ----

    private static SecurityProto equityProtoWith(java.util.function.Function<SecurityProto.Builder, SecurityProto.Builder> mutator) {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        return mutator.apply(base.toBuilder()).build();
    }

    @Test
    public void instrumentType_preservedOnRoundtrip() {
        SecurityProto input = equityProtoWith(b ->
                b.setInstrumentType(fintekkers.models.security.InstrumentTypeProto.INSTRUMENT_TYPE_DERIVATIVE));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals(fintekkers.models.security.InstrumentTypeProto.INSTRUMENT_TYPE_DERIVATIVE,
                reSerialized.getInstrumentType(),
                "instrument_type must survive round-trip via the proto-backed wrapper.");
    }

    @Test
    public void legs_preservedOnRoundtrip() {
        fintekkers.models.util.Uuid.UUIDProto leg1Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[16])).build();
        fintekkers.models.util.Uuid.UUIDProto leg2Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1})).build();
        SecurityProto leg1 = SecurityProto.newBuilder().setIsLink(true).setUuid(leg1Uuid).build();
        SecurityProto leg2 = SecurityProto.newBuilder().setIsLink(true).setUuid(leg2Uuid).build();

        SecurityProto input = equityProtoWith(b -> b.addLegs(leg1).addLegs(leg2));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals(2, reSerialized.getLegsCount());
        assertTrue(reSerialized.getLegs(0).getIsLink());
        assertEquals(leg1Uuid, reSerialized.getLegs(0).getUuid());
        assertEquals(leg2Uuid, reSerialized.getLegs(1).getUuid());
    }

    @Test
    public void legs_wireCompatibleWithLegacySecurityIdProtoBytes() {
        fintekkers.models.util.Uuid.UUIDProto legUuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        7,7,0,0,0,0,0,0, 0,0,0,0,0,0,0,7})).build();
        SecurityProto legacyShape = SecurityProto.newBuilder().setUuid(legUuid).build();
        byte[] legacyBytes = legacyShape.toByteArray();

        try {
            SecurityProto parsed = SecurityProto.parseFrom(legacyBytes);
            assertEquals(legUuid, parsed.getUuid());
        } catch (com.google.protobuf.InvalidProtocolBufferException e) {
            throw new AssertionError("Legacy bytes must parse under new type", e);
        }
    }

    @Test
    public void indexDetails_constituents_preservedOnRoundtrip() throws com.google.protobuf.InvalidProtocolBufferException {
        fintekkers.models.util.Uuid.UUIDProto constUuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        2,2,0,0,0,0,0,0, 0,0,0,0,0,0,0,2})).build();
        fintekkers.models.util.LocalTimestamp.LocalTimestampProto asOf =
                fintekkers.models.util.LocalTimestamp.LocalTimestampProto.newBuilder()
                        .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                                .setSeconds(1_700_000_000L).build())
                        .setTimeZone("UTC")
                        .build();
        SecurityProto constituent = SecurityProto.newBuilder()
                .setIsLink(true).setUuid(constUuid).setAsOf(asOf).build();
        fintekkers.models.security.IndexDetailsProto details =
                fintekkers.models.security.IndexDetailsProto.newBuilder()
                        .setIndexType(fintekkers.models.security.index.IndexTypeProto.CPI_U)
                        .addConstituents(constituent)
                        .build();

        SecurityProto original = SecurityProto.newBuilder()
                .setProductType(fintekkers.models.security.ProductTypeProto.EQUITY_INDEX)
                .setIndexDetails(details)
                .build();

        SecurityProto parsed = SecurityProto.parseFrom(original.toByteArray());

        assertEquals(1, parsed.getIndexDetails().getConstituentsCount());
        SecurityProto pc = parsed.getIndexDetails().getConstituents(0);
        assertTrue(pc.getIsLink());
        assertEquals(constUuid, pc.getUuid());
        assertEquals(asOf, pc.getAsOf());
    }

    @Test
    public void assetClass_canonicalRegistryStringPreserved() {
        SecurityProto input = equityProtoWith(b -> b.setAssetClass("EQUITY"));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals("EQUITY", reSerialized.getAssetClass(),
                "Canonical registry asset_class string from the input proto must survive round-trip.");
    }

    @Test
    public void productType_preservesPreferredStockOverEquitySecurityHardcode() {
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.PREFERRED_STOCK));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals(fintekkers.models.security.ProductTypeProto.PREFERRED_STOCK,
                reSerialized.getProductType());
    }

    @Test
    public void productType_preservesAdrOverEquitySecurityHardcode() {
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.ADR));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals(fintekkers.models.security.ProductTypeProto.ADR, reSerialized.getProductType());
    }

    @Test
    public void productType_preservesEtfOverEquitySecurityHardcode() {
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.ETF));

        SecurityProto reSerialized = Security.fromProto(input).getProto();

        assertEquals(fintekkers.models.security.ProductTypeProto.ETF, reSerialized.getProductType());
    }
}
