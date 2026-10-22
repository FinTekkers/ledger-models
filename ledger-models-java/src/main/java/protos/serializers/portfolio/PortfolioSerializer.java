package protos.serializers.portfolio;

import fintekkers.models.util.ObjectTypeProto;
import common.util.ObjectTypes;
import com.google.gson.Gson;
import common.models.portfolio.Portfolio;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;

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
        if (portfolio.isLink()) {
            // Stay a link: reading the proto would force hydration.
            return withKey(PortfolioProto.newBuilder(), portfolio).setIsLink(true).build();
        }

        // The proto is the source of every biz field, so valid_from, valid_to,
        // portfolio_name and amortisation_elections pass through (LM-366).
        return withKey(portfolio.getProto().toBuilder(), portfolio).clearIsLink().build();
    }

    private static PortfolioProto.Builder withKey(PortfolioProto.Builder builder, Portfolio portfolio) {
        ObjectTypes.stamp(builder, ObjectTypeProto.OBJECT_TYPE_PORTFOLIO)
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(portfolio.getID()));
        // A link may carry no as_of; never default it (LM-271).
        ZonedDateTime asOf = portfolio.getAsOf();
        if (asOf != null) {
            builder.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        } else {
            builder.clearAsOf();
        }
        return builder;
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
