package protos.serializers;

import common.models.errors.ModelValidationException;
import common.models.price.Price;
import fintekkers.models.price.PriceProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import protos.serializers.price.PriceSerializer;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static java.time.temporal.ChronoUnit.MILLIS;
import static org.junit.jupiter.api.Assertions.assertEquals;
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

    // testJSONSerialization removed in FinTekkers/second-brain#338.
}