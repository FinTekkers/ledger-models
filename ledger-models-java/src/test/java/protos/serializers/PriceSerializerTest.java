package protos.serializers;

import common.models.errors.ModelValidationException;
import common.models.price.Price;
import common.util.ObjectTypes;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import protos.serializers.price.PriceSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static java.time.temporal.ChronoUnit.MILLIS;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceSerializerTest {
    @Test
    public void testPortfolioSerialize() {
        final var price = DummyEquityObjects.getDummyPrice();

        final PriceSerializer serializer = PriceSerializer.getInstance();
        final PriceProto proto = serializer.serialize(price);

        final var copy = serializer.deserialize(proto);

        assertEquals(price.getID(), copy.getID());
        assertTrue(price.getAsOf().truncatedTo(MILLIS).isEqual(copy.getAsOf().truncatedTo(MILLIS)));

        assertEquals(price.getPrice().doubleValue(), copy.getPrice().doubleValue());
        assertEquals(price.getSecurity().getID(), copy.getSecurity().getID());
        assertEquals(price.getSecurity().getIssuer(), copy.getSecurity().getIssuer());
    }

    // LM-272: a price with no as_of, or a blank time zone, is a typed input
    // error naming the field — not a bare IllegalArgumentException.
    @Test
    public void deserialize_unsetAsOf_throwsTypedErrorNamingField() {
        PriceProto proto = PriceSerializer.getInstance()
                .serialize(DummyEquityObjects.getDummyPrice()).toBuilder().clearAsOf().build();

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> PriceSerializer.getInstance().deserialize(proto));
        assertEquals(ModelValidationException.class, e.getClass());
        assertEquals("price.as_of", e.getField());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    public void deserialize_blankTimeZone_throwsTypedErrorNamingField(String zone) {
        PriceProto valid = PriceSerializer.getInstance().serialize(DummyEquityObjects.getDummyPrice());
        PriceProto proto = valid.toBuilder()
                .setAsOf(valid.getAsOf().toBuilder().setTimeZone(zone)).build();

        ModelValidationException e = assertThrows(ModelValidationException.class,
                () -> PriceSerializer.getInstance().deserialize(proto));
        assertEquals(ModelValidationException.class, e.getClass());
        assertEquals("price.as_of.time_zone", e.getField());
    }

    @Test
    public void deserialize_validAsOf_isUnchanged() {
        ZonedDateTime asOf = ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));
        Price price = new Price(UUID.randomUUID(), BigDecimal.TEN, DummyEquityObjects.getDummySecurity(), asOf);

        Price copy = PriceSerializer.getInstance().deserialize(PriceSerializer.getInstance().serialize(price));

        assertEquals(asOf, copy.getAsOf());
    }

    // LM-449: an inline trade price may have no security; serialize leaves it
    // absent instead of throwing an NPE.
    @Test
    public void serialize_nullSecurity_returnsProtoWithoutSecurity() {
        Price price = new Price(UUID.randomUUID(), BigDecimal.TEN, null, ZonedDateTime.now());

        PriceProto proto = assertDoesNotThrow(() -> PriceSerializer.getInstance().serialize(price));

        assertFalse(proto.hasSecurity());
    }

    @Test
    public void roundTrip_priceTypeWithoutSecurity_keepsTypeAndNullSecurity() {
        ZonedDateTime asOf = ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));
        Price price = new Price(UUID.randomUUID(), new BigDecimal("99.5"), null, asOf, PriceTypeProto.PERCENTAGE);

        PriceProto proto = PriceSerializer.getInstance().serialize(price);
        Price copy = PriceSerializer.getInstance().deserialize(proto);

        assertEquals(PriceTypeProto.PERCENTAGE, proto.getPriceType());
        assertEquals(PriceTypeProto.PERCENTAGE, copy.getPriceType());
        assertNull(copy.getSecurity());
    }

    // LM-449 guardrail: a price with a security and no type serializes to the
    // same bytes as before price_type was carried.
    @Test
    public void serialize_withSecurityNoType_bytesUnchanged() {
        ZonedDateTime asOf = ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));
        Price price = new Price(UUID.randomUUID(), BigDecimal.TEN, DummyEquityObjects.getDummySecurity(), asOf);

        PriceProto expected = ObjectTypes.stamp(PriceProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE)
                .setUuid(ProtoSerializationUtil.serializeUUID(price.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setSecurity(price.getSecurity().getProto())
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(price.getPrice()))
                .build();

        assertArrayEquals(expected.toByteArray(), PriceSerializer.getInstance().serialize(price).toByteArray());
    }

    // testJSONSerialization removed in FinTekkers/second-brain#338.
}