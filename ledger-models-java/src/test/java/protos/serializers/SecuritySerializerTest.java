package protos.serializers;

import com.amazonaws.util.StringUtils;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import protos.serializers.security.SecuritySerializer;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.time.temporal.ChronoUnit;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        String expectedJson = "{\"object_class\":\"Security\",\"version\":\"0.0.1\",\"uuid\":\"00000000-0000-0001-0000-000000000001\",\"as_of\":{\"timestamp\":\"1000-Jan-01 00:00:00.000000\",\"time_zone\":\"America/New_York\"},\"is_link\":false,\"security_type\":\"CASH_SECURITY\",\"asset_class\":\"Cash\",\"issuer_name\":\"USD\",\"quantity_type\":\"UNITS\",\"identifier\":{\"object_class\":\"Identifier\",\"version\":\"0.0.1\",\"identifier_value\":\"USD\",\"identifier_type\":\"CASH\"},\"description\":\"USD\",\"cash_id\":\"USD\"}";
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
}