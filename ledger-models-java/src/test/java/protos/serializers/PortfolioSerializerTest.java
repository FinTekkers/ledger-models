package protos.serializers;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import common.util.ObjectTypes;
import fintekkers.models.portfolio.AmortisationElectionsProto;
import fintekkers.models.portfolio.MarketDiscountAccrualMethodProto;
import fintekkers.models.portfolio.MarketDiscountInclusionProto;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.portfolio.PremiumAmortisationElectionProto;
import fintekkers.models.util.ObjectTypeProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.io.IOException;
import java.io.InputStream;
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
                .setObjectType(fintekkers.models.util.ObjectTypeProto.OBJECT_TYPE_PORTFOLIO)
                .setVersion(common.util.ObjectTypes.SCHEMA_VERSION)
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

    // Stored portfolios are bytes: serialize, write, parse, deserialize, serialize again.
    private static PortfolioProto byteRoundTrip(PortfolioProto original) throws IOException {
        PortfolioSerializer serializer = PortfolioSerializer.getInstance();
        byte[] stored = serializer.serialize(new Portfolio(original)).toByteArray();
        Portfolio loaded = serializer.deserialize(PortfolioProto.parseFrom(stored));
        return serializer.serialize(loaded);
    }

    // Stamped the way PortfolioSerializer stamps it, so equals() compares only the data.
    private static PortfolioProto.Builder stampedPortfolio() {
        return ObjectTypes.stamp(PortfolioProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setPortfolioName("elections");
    }

    @Test
    void electionsRoundTrip() throws IOException {
        PortfolioProto original = stampedPortfolio()
                .setAmortisationElections(AmortisationElectionsProto.newBuilder()
                        .setBondPremium(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED)
                        .setMarketDiscountInclusion(MarketDiscountInclusionProto.INCLUDE_CURRENTLY)
                        .setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD))
                .build();
        AmortisationElectionsProto elections = original.getAmortisationElections();
        Assertions.assertTrue(original.hasAmortisationElections());
        Assertions.assertNotEquals(PremiumAmortisationElectionProto.UNSPECIFIED_PREMIUM_ELECTION, elections.getBondPremium());
        Assertions.assertNotEquals(MarketDiscountInclusionProto.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION, elections.getMarketDiscountInclusion());
        Assertions.assertNotEquals(MarketDiscountAccrualMethodProto.UNSPECIFIED_ACCRUAL_METHOD, elections.getMarketDiscountAccrual());

        PortfolioProto restored = byteRoundTrip(original);

        Assertions.assertEquals(original, restored);
        Assertions.assertEquals(elections, new Portfolio(restored).getAmortisationElections());
    }

    @Test
    void validFromValidToRoundTrip() throws IOException {
        ZonedDateTime validFrom = ZonedDateTime.of(2024, 1, 2, 3, 4, 5, 123_456_789, ZoneId.of("America/New_York"));
        ZonedDateTime validTo = ZonedDateTime.of(2025, 7, 8, 9, 10, 11, 987_654_321, ZoneId.of("America/New_York"));
        PortfolioProto original = stampedPortfolio()
                .setValidFrom(ProtoSerializationUtil.serializeTimestamp(validFrom))
                .setValidTo(ProtoSerializationUtil.serializeTimestamp(validTo))
                .build();
        Assertions.assertNotEquals(original.getValidFrom(), original.getValidTo());
        Assertions.assertNotEquals(original.getAsOf(), original.getValidFrom());
        Assertions.assertNotEquals(original.getAsOf(), original.getValidTo());

        PortfolioProto restored = byteRoundTrip(original);

        Assertions.assertEquals(original.getValidFrom(), restored.getValidFrom());
        Assertions.assertEquals(original.getValidTo(), restored.getValidTo());
        Assertions.assertEquals(validFrom.toInstant(),
                ProtoSerializationUtil.deserializeTimestamp(restored.getValidFrom()).toInstant());
        Assertions.assertEquals(validTo.toInstant(),
                ProtoSerializationUtil.deserializeTimestamp(restored.getValidTo()).toInstant());
    }

    // Bytes stored before LM-366, with no field 11. See src/test/resources/fixtures/README.md.
    @Test
    void preLm366FixtureLoads() throws IOException {
        PortfolioProto stored;
        try (InputStream in = getClass().getResourceAsStream("/fixtures/portfolio_pre_lm366.bin")) {
            Assertions.assertNotNull(in, "fixture missing");
            stored = PortfolioProto.parseFrom(in);
        }
        Assertions.assertFalse(stored.hasAmortisationElections());

        PortfolioSerializer serializer = PortfolioSerializer.getInstance();
        Portfolio loaded = serializer.deserialize(stored);

        AmortisationElectionsProto elections = loaded.getAmortisationElections();
        Assertions.assertEquals(PremiumAmortisationElectionProto.UNSPECIFIED_PREMIUM_ELECTION, elections.getBondPremium());
        Assertions.assertEquals(MarketDiscountInclusionProto.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION, elections.getMarketDiscountInclusion());
        Assertions.assertEquals(MarketDiscountAccrualMethodProto.UNSPECIFIED_ACCRUAL_METHOD, elections.getMarketDiscountAccrual());

        Assertions.assertEquals(UUID.fromString("3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b"), loaded.getID());
        Assertions.assertEquals("Pre LM-366 Portfolio", loaded.getPortfolioName());

        PortfolioProto reserialized = serializer.serialize(loaded);
        Assertions.assertFalse(reserialized.hasAmortisationElections());
        Assertions.assertEquals("Pre LM-366 Portfolio", reserialized.getPortfolioName());
        Assertions.assertEquals(
                ZonedDateTime.of(2026, 3, 2, 9, 30, 0, 0, ZoneId.of("America/New_York")).toInstant(),
                ProtoSerializationUtil.deserializeTimestamp(reserialized.getAsOf()).toInstant());
        Assertions.assertEquals(
                ZonedDateTime.of(2026, 3, 1, 8, 0, 0, 0, ZoneId.of("America/New_York")).toInstant(),
                ProtoSerializationUtil.deserializeTimestamp(reserialized.getValidFrom()).toInstant());
    }

    // testObjectSerializesToJSONandBack removed in FinTekkers/second-brain#338.
}