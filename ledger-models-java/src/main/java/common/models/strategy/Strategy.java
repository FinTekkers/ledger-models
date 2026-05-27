package common.models.strategy;

import common.models.RawDataModelObject;
import fintekkers.models.strategy.StrategyProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Proto-backed wrapper around {@link StrategyProto}. Mirrors the pattern
 * established by Transaction (#340) and Security (#338): the wrapper holds
 * the proto and reads getters directly from it, so there's no second
 * source-of-truth for {@code asOf} or any other field.
 *
 * <p>Constructor validation rejects missing required fields explicitly —
 * no sentinel defaults — so a caller passing {@code null} surfaces as an
 * {@link IllegalArgumentException} at the call site rather than as an NPE
 * deep in serialize, where the data lineage is lost.
 *
 * <p>No {@code is_link} support: Strategy has no service to resolve from,
 * so link semantics are out of scope.
 */
public class Strategy extends RawDataModelObject {

    private final StrategyProto proto;

    /**
     * Wrap an existing proto. Required fields ({@code uuid}, {@code as_of},
     * {@code strategy_name}) MUST be set or this throws.
     */
    public Strategy(StrategyProto proto) {
        super(extractId(proto), extractAsOf(proto));
        if (!proto.hasUuid()) {
            throw new IllegalArgumentException("StrategyProto.uuid is required");
        }
        if (!proto.hasAsOf()) {
            throw new IllegalArgumentException("StrategyProto.as_of is required");
        }
        if (proto.getStrategyName() == null || proto.getStrategyName().isEmpty()) {
            throw new IllegalArgumentException("StrategyProto.strategy_name is required");
        }
        this.proto = proto;
    }

    /**
     * POJO-args constructor. Validates non-null inputs; {@code parent} is
     * optional. Builds the underlying proto and delegates to the proto
     * constructor for invariant enforcement.
     */
    public Strategy(UUID id, String strategyName, Strategy parent, ZonedDateTime asOf) {
        this(buildProto(id, strategyName, parent, asOf));
    }

    private static StrategyProto buildProto(UUID id, String strategyName, Strategy parent, ZonedDateTime asOf) {
        if (id == null) {
            throw new IllegalArgumentException("Strategy.id is required");
        }
        if (strategyName == null || strategyName.isEmpty()) {
            throw new IllegalArgumentException("Strategy.strategyName is required");
        }
        if (asOf == null) {
            throw new IllegalArgumentException("Strategy.asOf is required");
        }
        StrategyProto.Builder b = StrategyProto.newBuilder()
                .setObjectClass(Strategy.class.getSimpleName())
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setStrategyName(strategyName);
        if (parent != null) {
            b.setParent(parent.getProto());
        }
        return b.build();
    }

    private static UUID extractId(StrategyProto p) {
        return p.hasUuid() ? ProtoSerializationUtil.deserializeUUID(p.getUuid()) : null;
    }

    private static ZonedDateTime extractAsOf(StrategyProto p) {
        return p.hasAsOf() ? ProtoSerializationUtil.deserializeTimestamp(p.getAsOf()) : null;
    }

    public StrategyProto getProto() {
        return proto;
    }

    public String getStrategyName() {
        return proto.getStrategyName();
    }

    public Strategy getParent() {
        return proto.hasParent() ? new Strategy(proto.getParent()) : null;
    }

    public String getFullyQualifiedStrategyName() {
        StringBuilder buffer = new StringBuilder();
        buffer.append(getStrategyName());

        Strategy tmp = getParent();
        while (tmp != null) {
            buffer.insert(0, "/");
            buffer.insert(0, tmp.getStrategyName());
            tmp = tmp.getParent();
        }
        return buffer.toString();
    }

    @Override
    public String toString() {
        return String.format("ID[%s], Strategy[%s]", getID(), getFullyQualifiedStrategyName());
    }

    @Override
    public int hashCode() {
        return getID().hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Strategy) {
            return ((Strategy) obj).getID().equals(getID());
        }
        return false;
    }
}
