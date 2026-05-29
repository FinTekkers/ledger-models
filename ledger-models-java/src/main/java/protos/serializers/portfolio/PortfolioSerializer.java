package protos.serializers.portfolio;

import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

public class PortfolioSerializer implements IRawDataModelObjectSerializer<PortfolioProto, Portfolio> {
    private static final class InstanceHolder {
        private static final PortfolioSerializer INSTANCE = new PortfolioSerializer();
    }

    public static PortfolioSerializer getInstance() {
        return PortfolioSerializer.InstanceHolder.INSTANCE;
    }

    private PortfolioSerializer() {
    }

    @Override
    public PortfolioProto serialize(Portfolio portfolio) {
        PortfolioProto.Builder builder = PortfolioProto.newBuilder()
                .setObjectClass(Portfolio.class.getSimpleName())
                .setVersion("0.0.1")
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(portfolio.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(portfolio.getAsOf()))
                //Biz fields
                .setPortfolioName(portfolio.getPortfolioName());

        return builder.build();
    }

    @Override
    public Portfolio deserialize(PortfolioProto proto) {
        // Proto-backed ctor preserves link-mode for lazy hydration. A
        // link-mode proto here means the inner `portfolio_name` field is
        // proto3-default (""); the wrapper will fetch on first accessor
        // read via LinkCache + the registered Portfolio.Fetcher.
        // See docs/adr/lazy-link-hydration.md.
        return new Portfolio(proto);
    }

    public PositionStatusProto serialize(PositionStatusProto status) {
        return PositionStatusProto.valueOf(status.name());
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338.
}
