package protos.serializers;

import com.amazonaws.util.StringUtils;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import protos.serializers.security.SecuritySerializer;
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

class SecuritySerializerTest {
    @Test
    public void testBaseSecurityAndEquitySecuritySerialize() {
        final var security = DummyEquityObjects.getDummySecurity();

        String description = new Random().nextInt() % 2 == 0 ? null : "TEST";
        security.setDescription(description);

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = serializer.deserialize(proto);

        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        assertEquals(security.getIssuer(), copy.getIssuer());
        assertEquals(security.getQuantityType(), copy.getQuantityType());

        assertEquals(security.getDescription(), copy.getDescription());

        //Settlement security - Indirectly testing cash
        assertEquals(security.getSettlementCurrency().getID(), copy.getSettlementCurrency().getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));

        assertEquals(security.getSettlementCurrency().getIssuer(), copy.getSettlementCurrency().getIssuer());
        assertEquals(security.getSettlementCurrency().getQuantityType(), copy.getSettlementCurrency().getQuantityType());

        assertEquals(security.getSecurityId().getIdentifier(), copy.getSecurityId().getIdentifier());
        assertEquals(security.getSecurityId().getIdentifierType(), copy.getSecurityId().getIdentifierType());
    }
    @Test
    public void testBondSecuritySerialize() {
        final var security = DummyBondObjects.getDummySecurity();

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = (BondSecurity) serializer.deserialize(proto);

        //NOTE: Only testing bond specific items here
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
    public void testCashSerialization() {
        final var security = CashSecurity.USD;

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        final var copy = (CashSecurity) serializer.deserialize(proto);

        //NOTE: Only testing bond specific items here
        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));
    }

    @Test
    public void testJSONSerializationForCashSecurity() {
        final var security = CashSecurity.USD;

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        String serialized = serializer.serializeToJson(proto);
        String expectedJson = "{\"object_class\":\"Security\",\"version\":\"0.0.1\",\"uuid\":\"00000000-0000-0001-0000-000000000001\",\"as_of\":{\"timestamp\":\"1000-Jan-01 00:00:00.000000\",\"time_zone\":\"America/New_York\"},\"is_link\":false,\"product_type\":\"CURRENCY\",\"instrument_type\":0,\"legs\":[],\"asset_class\":\"Cash\",\"issuer_name\":\"USD\",\"quantity_type\":\"UNITS\",\"identifier\":{\"object_class\":\"Identifier\",\"version\":\"0.0.1\",\"identifier_value\":\"USD\",\"identifier_type\":\"CASH\"},\"description\":\"USD\",\"identifiers\":[],\"cash_id\":\"USD\",\"issuance_info\":[],\"inflation_index_type\":0,\"reference_rate_index\":0,\"reset_frequency\":0,\"index_type\":0}";
        assertEquals( 0 /*same*/, StringUtils.compare(expectedJson, serialized),
                "Json didn't match! Got:\n"+ serialized+ "\nExpected\n"+ expectedJson);

        SecurityProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (CashSecurity) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));
        assertEquals(security.getSecurityId(), copy.getSecurityId());
        assertEquals(security.getCashId(), copy.getCashId());
    }

    @Test
    public void testDeserializeSettlementCurrencyIsLinkDoesNotThrow() {
        // Issue #93: when settlement_currency has is_link=true (UUID-only reference),
        // deserialize() must not throw ClassCastException — it should produce null instead.
        UUID linkUuid = UUID.randomUUID();
        SecurityProto linkProto = SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(protos.serializers.util.proto.ProtoSerializationUtil.serializeUUID(linkUuid))
                .build();

        SecurityProto bondWithLink = SecurityProto.newBuilder(
                        SecuritySerializer.getInstance().serialize(DummyBondObjects.getDummySecurity()))
                .setSettlementCurrency(linkProto)
                .build();

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        common.models.security.Security result = assertDoesNotThrow(() -> serializer.deserialize(bondWithLink),
                "deserialize() must not throw when settlement_currency.is_link=true");
        assertNull(result.getSettlementCurrency(),
                "settlement_currency should be null when the embedded proto is a link reference");
    }

    @Test
    public void testJSONSerializationForBondSecurity() {
        final var security = DummyBondObjects.getDummySecurity();

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        String serialized = serializer.serializeToJson(proto);

        SecurityProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (BondSecurity) serializer.deserialize(protoCopy);

        //NOTE: Only testing cash specific items here
        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS)
                .isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));
        assertEquals(security.getSecurityId(), copy.getSecurityId());

        //Bond security
        assertEquals(security.getCouponType(), copy.getCouponType());
        assertEquals(security.getCouponFrequency(), copy.getCouponFrequency());
        assertEquals(security.getSettlementCurrency(), copy.getSettlementCurrency());
        assertEquals(security.getIssueDate(), copy.getIssueDate());
        assertEquals(security.getDatedDate(), copy.getDatedDate());
        assertEquals(security.getMaturityDate(), copy.getMaturityDate());
        assertEquals(security.getSecurityId(), copy.getSecurityId());
    }

    // Issue #96: maturity_date must be strictly after issue_date for bond-type securities

    @Test
    public void testBondWithMaturityBeforeIssueDateThrows() {
        // maturity 2022 < issue 2032 — must be rejected
        BondSecurity invalid = DummyBondObjects.getDummySecurity(
                ZonedDateTime.now(), "91282CEP2",
                LocalDate.of(2032, 5, 16),
                LocalDate.of(2022, 5, 16),
                BigDecimal.valueOf(2.875));
        SecurityProto proto = SecuritySerializer.getInstance().serialize(invalid);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> SecuritySerializer.getInstance().deserialize(proto),
                "deserialize() must reject bond where maturity_date < issue_date");
        assertTrue(ex.getMessage().contains("maturity_date must be after issue_date"),
                "Exception message should contain 'maturity_date must be after issue_date'");
    }

    @Test
    public void testBondWithMaturityEqualToIssueDateThrows() {
        // maturity == issue — must be rejected (not strictly after)
        LocalDate sameDate = LocalDate.of(2025, 6, 1);
        BondSecurity invalid = DummyBondObjects.getDummySecurity(
                ZonedDateTime.now(), "91282CEP2",
                sameDate,
                sameDate,
                BigDecimal.valueOf(2.875));
        SecurityProto proto = SecuritySerializer.getInstance().serialize(invalid);

        assertThrows(IllegalArgumentException.class,
                () -> SecuritySerializer.getInstance().deserialize(proto),
                "deserialize() must reject bond where maturity_date == issue_date");
    }

    @Test
    public void testBondWithValidDatesDoesNotThrow() {
        // sanity: the standard DummyBondObjects security (issue 2022, maturity 2032) must still pass
        BondSecurity valid = DummyBondObjects.getDummySecurity();
        SecurityProto proto = SecuritySerializer.getInstance().serialize(valid);

        assertDoesNotThrow(() -> SecuritySerializer.getInstance().deserialize(proto),
                "deserialize() must accept bond where maturity_date > issue_date");
    }

    // ------------------------------------------------------------------------
    // v0.2.1 — round-trip preservation for four fields that have no domain
    // accessor on Security (or whose domain-subclass overrides hardcode legacy
    // values). Same shape as the existing deleted_at / issuance_info /
    // identifiers / index_type preservation in SecuritySerializer.serialize().
    // Eliminates the SecurityProtoRoundtrip workaround in ledger-service M2
    // PR #36 (second-brain#258).
    //
    // Each test: build a clean proto via the existing dummy, set the field
    // under test on toBuilder(), run through serialize(deserialize(proto)),
    // assert preservation.
    // ------------------------------------------------------------------------

    private static SecurityProto equityProtoWith(java.util.function.Function<SecurityProto.Builder, SecurityProto.Builder> mutator) {
        SecurityProto base = SecuritySerializer.getInstance().serialize(DummyEquityObjects.getDummySecurity());
        return mutator.apply(base.toBuilder()).build();
    }

    @Test
    public void instrumentType_preservedOnRoundtrip() {
        SecurityProto input = equityProtoWith(b ->
                b.setInstrumentType(fintekkers.models.security.InstrumentTypeProto.INSTRUMENT_TYPE_DERIVATIVE));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(fintekkers.models.security.InstrumentTypeProto.INSTRUMENT_TYPE_DERIVATIVE,
                reSerialized.getInstrumentType(),
                "instrument_type must survive round-trip; domain Security has no setter, "
                + "so the serializer must copy from the stashed source proto.");
    }

    @Test
    public void legs_preservedOnRoundtrip() {
        fintekkers.models.util.Uuid.UUIDProto leg1Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[16])).build();
        fintekkers.models.util.Uuid.UUIDProto leg2Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1})).build();
        fintekkers.models.security.SecurityIdProto leg1 =
                fintekkers.models.security.SecurityIdProto.newBuilder().setUuid(leg1Uuid).build();
        fintekkers.models.security.SecurityIdProto leg2 =
                fintekkers.models.security.SecurityIdProto.newBuilder().setUuid(leg2Uuid).build();

        SecurityProto input = equityProtoWith(b -> b.addLegs(leg1).addLegs(leg2));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(2, reSerialized.getLegsCount(),
                "Multi-leg strategy packages: legs must survive round-trip.");
        assertEquals(leg1.getUuid(), reSerialized.getLegs(0).getUuid());
        assertEquals(leg2.getUuid(), reSerialized.getLegs(1).getUuid());
    }

    @Test
    public void assetClass_canonicalRegistryStringPreserved() {
        // EquitySecurity's getAssetClass() hardcodes the legacy "Equity"
        // string. Without preservation, that hardcode wins and the canonical
        // "EQUITY" set on the input proto is overwritten on the way out.
        SecurityProto input = equityProtoWith(b -> b.setAssetClass("EQUITY"));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals("EQUITY", reSerialized.getAssetClass(),
                "Canonical registry asset_class string from the input proto must survive; "
                + "the domain-subclass legacy hardcode must NOT win.");
    }

    @Test
    public void productType_preservesPreferredStockOverEquitySecurityHardcode() {
        // EquitySecurity.getProductType() hardcodes COMMON_STOCK. Without
        // preservation, PREFERRED_STOCK / ADR / ETF on the input proto
        // collapse to COMMON_STOCK on round-trip.
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.PREFERRED_STOCK));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(fintekkers.models.security.ProductTypeProto.PREFERRED_STOCK,
                reSerialized.getProductType(),
                "PREFERRED_STOCK / ADR / ETF must survive round-trip against EquitySecurity's "
                + "COMMON_STOCK hardcode.");
    }

    @Test
    public void productType_preservesAdrOverEquitySecurityHardcode() {
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.ADR));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(fintekkers.models.security.ProductTypeProto.ADR, reSerialized.getProductType());
    }

    @Test
    public void productType_preservesEtfOverEquitySecurityHardcode() {
        SecurityProto input = equityProtoWith(b ->
                b.setProductType(fintekkers.models.security.ProductTypeProto.ETF));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(fintekkers.models.security.ProductTypeProto.ETF, reSerialized.getProductType());
    }
}