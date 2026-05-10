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
}