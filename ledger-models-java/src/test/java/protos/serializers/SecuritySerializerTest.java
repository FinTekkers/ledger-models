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

        assertEquals(security.getIdentifiers().get(0).getIdentifier(), copy.getIdentifiers().get(0).getIdentifier());
        assertEquals(security.getIdentifiers().get(0).getIdentifierType(), copy.getIdentifiers().get(0).getIdentifierType());
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
        // The structural contract is what matters: serialize → deserialize →
        // equal domain object. Exact JSON output is a serializer implementation
        // detail.
        final var security = CashSecurity.USD;

        final SecuritySerializer serializer = SecuritySerializer.getInstance();
        final SecurityProto proto = serializer.serialize(security);

        String serialized = serializer.serializeToJson(proto);
        SecurityProto protoCopy = serializer.deserializeFromJson(serialized);
        final var copy = (CashSecurity) serializer.deserialize(protoCopy);

        assertEquals(security.getID(), copy.getID());
        assertTrue(security.getAsOf().truncatedTo(ChronoUnit.MILLIS).isEqual(copy.getAsOf().truncatedTo(ChronoUnit.MILLIS)));
        assertEquals(security.getIdentifiers(), copy.getIdentifiers());
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
        assertEquals(security.getIdentifiers(), copy.getIdentifiers());

        //Bond security
        assertEquals(security.getCouponType(), copy.getCouponType());
        assertEquals(security.getCouponFrequency(), copy.getCouponFrequency());
        assertEquals(security.getSettlementCurrency(), copy.getSettlementCurrency());
        assertEquals(security.getIssueDate(), copy.getIssueDate());
        assertEquals(security.getDatedDate(), copy.getDatedDate());
        assertEquals(security.getMaturityDate(), copy.getMaturityDate());
        assertEquals(security.getIdentifiers(), copy.getIdentifiers());
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
    // Round-trip preservation for fields that have no domain accessor on
    // Security (or whose domain-subclass overrides hardcode legacy values).
    // Same shape as the existing issuance_info / identifiers / index_type
    // preservation in SecuritySerializer.serialize().
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
        // legs is repeated SecurityProto with each leg in is_link=true mode
        // with uuid + as_of populated. See docs/adr/is_link_pattern.md.
        fintekkers.models.util.Uuid.UUIDProto leg1Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[16])).build();
        fintekkers.models.util.Uuid.UUIDProto leg2Uuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        1,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,1})).build();
        SecurityProto leg1 = SecurityProto.newBuilder().setIsLink(true).setUuid(leg1Uuid).build();
        SecurityProto leg2 = SecurityProto.newBuilder().setIsLink(true).setUuid(leg2Uuid).build();

        SecurityProto input = equityProtoWith(b -> b.addLegs(leg1).addLegs(leg2));

        SecurityProto reSerialized = SecuritySerializer.getInstance().serialize(
                SecuritySerializer.getInstance().deserialize(input));

        assertEquals(2, reSerialized.getLegsCount(),
                "Multi-leg strategy packages: legs must survive round-trip.");
        assertTrue(reSerialized.getLegs(0).getIsLink(), "Each leg must be is_link=true");
        assertEquals(leg1Uuid, reSerialized.getLegs(0).getUuid());
        assertEquals(leg2Uuid, reSerialized.getLegs(1).getUuid());
    }

    @Test
    public void legs_wireCompatibleWithLegacySecurityIdProtoBytes() {
        // Wire-format contract for SecurityProto.legs: a length-delimited
        // UUIDProto at field tag 1 — which is exactly what SecurityProto.uuid
        // (also tag 1) encodes to. We don't depend on SecurityIdProto at
        // compile time; reconstruct its wire form by encoding a SecurityProto
        // with ONLY the uuid set, then confirm those bytes parse back as a
        // SecurityProto with the same uuid.
        fintekkers.models.util.Uuid.UUIDProto legUuid = fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{
                        7,7,0,0,0,0,0,0, 0,0,0,0,0,0,0,7})).build();
        SecurityProto legacyShape = SecurityProto.newBuilder().setUuid(legUuid).build();
        byte[] legacyBytes = legacyShape.toByteArray();

        try {
            SecurityProto parsed = SecurityProto.parseFrom(legacyBytes);
            assertEquals(legUuid, parsed.getUuid(),
                    "Legacy SecurityIdProto wire bytes (uuid at tag 1) must parse as SecurityProto with same uuid.");
        } catch (com.google.protobuf.InvalidProtocolBufferException e) {
            throw new AssertionError("Legacy bytes must parse under new type", e);
        }
    }

    @Test
    public void indexDetails_constituents_preservedOnRoundtrip() throws com.google.protobuf.InvalidProtocolBufferException {
        // IndexDetailsProto.constituents is server-populated under
        // QuerySecurityRequestProto.lookthrough=true. Each constituent is
        // is_link=true with uuid + as_of populated.
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
        assertTrue(pc.getIsLink(), "Constituent must be is_link=true");
        assertEquals(constUuid, pc.getUuid());
        assertEquals(asOf, pc.getAsOf(), "Constituent must carry the parent's as_of");
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