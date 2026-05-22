package protos.serializers;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import testutil.DummyEquityObjects;

class PortfolioSerializerTest {
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