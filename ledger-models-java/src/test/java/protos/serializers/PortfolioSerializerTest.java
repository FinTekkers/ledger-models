package protos.serializers;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

class PortfolioSerializerTest {
    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));

    private Portfolio.Fetcher savedFetcher;

    // No fetcher: any hydration throws instead of making a gRPC call.
    @BeforeEach
    void noFetcher() {
        savedFetcher = Portfolio.getFetcher();
        Portfolio.setFetcher(null);
    }

    @AfterEach
    void restoreFetcher() {
        Portfolio.setFetcher(savedFetcher);
    }

    private static Portfolio link(UUID id, ZonedDateTime asOf) {
        PortfolioProto.Builder b = PortfolioProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setIsLink(true);
        if (asOf != null) b.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        return new Portfolio(b.build());
    }

    @Test
    void linkWithoutAsOfRoundTrips() {
        UUID id = UUID.randomUUID();
        PortfolioSerializer serializer = PortfolioSerializer.getInstance();

        PortfolioProto proto = serializer.serialize(link(id, null));

        Assertions.assertEquals(id, ProtoSerializationUtil.deserializeUUID(proto.getUuid()));
        Assertions.assertTrue(proto.getIsLink());
        Assertions.assertFalse(proto.hasAsOf());

        Portfolio copy = serializer.deserialize(proto);
        Assertions.assertTrue(copy.isLink());
        Assertions.assertEquals(id, copy.getID());
        Assertions.assertNull(copy.getAsOf());
    }

    @Test
    void linkWithAsOfKeepsIt() {
        UUID id = UUID.randomUUID();
        PortfolioProto proto = PortfolioSerializer.getInstance().serialize(link(id, AS_OF));

        Assertions.assertTrue(proto.getIsLink());
        Assertions.assertEquals(ProtoSerializationUtil.serializeTimestamp(AS_OF), proto.getAsOf());
    }

    @Test
    void fullPortfolioOutputUnchanged() {
        UUID id = UUID.randomUUID();
        PortfolioProto golden = PortfolioProto.newBuilder()
                .setObjectClass("Portfolio")
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setPortfolioName("name")
                .build();

        PortfolioProto proto = PortfolioSerializer.getInstance().serialize(new Portfolio(id, "name", AS_OF));

        Assertions.assertEquals(golden, proto);
        Assertions.assertArrayEquals(golden.toByteArray(), proto.toByteArray());
    }

    @Test
    void fullPortfolioWithoutAsOfLeavesItUnset() {
        PortfolioProto proto = PortfolioSerializer.getInstance()
                .serialize(new Portfolio(UUID.randomUUID(), "name", null));

        Assertions.assertFalse(proto.hasAsOf());
        Assertions.assertFalse(proto.getIsLink());
        Assertions.assertEquals("name", proto.getPortfolioName());
    }

    @Test
    public void testPortfolioSerialize() {
        Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();
        PortfolioSerializer serializer = PortfolioSerializer.getInstance();
        PortfolioProto proto = serializer.serialize(portfolio);

        Portfolio copy = serializer.deserialize(proto);

        assertAttributesMatch(portfolio, copy);

    }

    private void assertAttributesMatch(Portfolio portfolio, Portfolio copy) {
        Assertions.assertEquals(portfolio, copy);
        Assertions.assertEquals(portfolio.getPortfolioName(), copy.getPortfolioName());
        Assertions.assertEquals(portfolio.getID(), copy.getID());
    }

    // testObjectSerializesToJSONandBack removed in FinTekkers/second-brain#338.
}