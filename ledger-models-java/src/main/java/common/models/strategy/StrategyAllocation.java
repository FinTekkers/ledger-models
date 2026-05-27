package common.models.strategy;

import common.models.RawDataModelObject;
import fintekkers.models.strategy.MapFieldEntry;
import fintekkers.models.strategy.StrategyAllocationProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Proto-backed wrapper around {@link StrategyAllocationProto}. Companion
 * to {@link Strategy}; mirrors the wrapper pattern from Transaction (#340)
 * and Security (#338).
 *
 * <p>The allocations map lives on the underlying proto. {@code addAllocation}
 * rebuilds the proto with the new entry; {@code getAllocations} reads it
 * back. No second source-of-truth.
 *
 * <p>Constructor validation rejects missing {@code uuid} or {@code asOf} —
 * no sentinel defaults.
 */
public class StrategyAllocation extends RawDataModelObject {

    private StrategyAllocationProto proto;

    /**
     * Wrap an existing proto. Required fields ({@code uuid}, {@code as_of})
     * MUST be set.
     */
    public StrategyAllocation(StrategyAllocationProto proto) {
        super(extractId(proto), extractAsOf(proto));
        if (!proto.hasUuid()) {
            throw new IllegalArgumentException("StrategyAllocationProto.uuid is required");
        }
        if (!proto.hasAsOf()) {
            throw new IllegalArgumentException("StrategyAllocationProto.as_of is required");
        }
        this.proto = proto;
    }

    /**
     * POJO-args constructor. Validates non-null inputs. The allocations
     * map starts empty; populate via {@link #addAllocation}.
     */
    public StrategyAllocation(UUID id, ZonedDateTime asOf) {
        this(buildProto(id, asOf));
    }

    private static StrategyAllocationProto buildProto(UUID id, ZonedDateTime asOf) {
        if (id == null) {
            throw new IllegalArgumentException("StrategyAllocation.id is required");
        }
        if (asOf == null) {
            throw new IllegalArgumentException("StrategyAllocation.asOf is required");
        }
        return StrategyAllocationProto.newBuilder()
                .setObjectClass(StrategyAllocation.class.getSimpleName())
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .build();
    }

    private static UUID extractId(StrategyAllocationProto p) {
        return p.hasUuid() ? ProtoSerializationUtil.deserializeUUID(p.getUuid()) : null;
    }

    private static ZonedDateTime extractAsOf(StrategyAllocationProto p) {
        return p.hasAsOf() ? ProtoSerializationUtil.deserializeTimestamp(p.getAsOf()) : null;
    }

    public void addAllocation(Strategy strategy, BigDecimal allocation) {
        if (strategy == null) {
            throw new IllegalArgumentException("Strategy is required");
        }
        if (allocation == null) {
            throw new IllegalArgumentException("Allocation amount is required");
        }
        this.proto = proto.toBuilder()
                .addAllocations(MapFieldEntry.newBuilder()
                        .setKey(strategy.getProto())
                        .setValue(ProtoSerializationUtil.serializeBigDecimal(allocation))
                        .build())
                .build();
    }

    public Map<Strategy, BigDecimal> getAllocations() {
        Map<Strategy, BigDecimal> result = new HashMap<>();
        for (MapFieldEntry entry : proto.getAllocationsList()) {
            Strategy s = new Strategy(entry.getKey());
            BigDecimal v = ProtoSerializationUtil.deserializeBigDecimal(entry.getValue());
            result.put(s, v);
        }
        return result;
    }

    public boolean validate() {
        BigDecimal total = BigDecimal.ZERO;
        for (BigDecimal val : getAllocations().values()) {
            total = total.add(val);
        }
        return BigDecimal.ONE.compareTo(total) == 0;
    }

    public StrategyAllocationProto getProto() {
        return proto;
    }

    @Override
    public String toString() {
        StringBuilder buffer = new StringBuilder();
        for (Map.Entry<Strategy, BigDecimal> entry : getAllocations().entrySet()) {
            buffer.append(entry.getKey().getFullyQualifiedStrategyName());
            buffer.append("/");
            buffer.append(entry.getValue());
            buffer.append(";");
        }
        String id = getID() != null ? getID().toString() : "";
        return String.format("ID[%s], Strategy[%s]", id, buffer);
    }

    @Override
    public int hashCode() {
        return getID().hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof StrategyAllocation) {
            return ((StrategyAllocation) obj).getID().equals(getID());
        }
        return false;
    }
}
