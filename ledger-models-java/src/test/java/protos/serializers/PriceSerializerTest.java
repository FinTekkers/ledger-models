package protos.serializers;

import common.models.price.Price;
import fintekkers.models.price.PriceProto;
import org.junit.jupiter.api.Test;
import protos.serializers.price.PriceSerializer;
import testutil.DummyEquityObjects;

import static java.time.temporal.ChronoUnit.MILLIS;
import static org.junit.jupiter.api.Assertions.assertEquals;
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

    // testJSONSerialization removed in FinTekkers/second-brain#338.
}