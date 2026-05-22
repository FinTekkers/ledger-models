package protos.serializers.strategy;

import com.google.gson.Gson;
import common.models.strategy.*;
import fintekkers.models.strategy.MapFieldEntry;
import fintekkers.models.strategy.StrategyAllocationProto;
import fintekkers.models.strategy.StrategyProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;

public class StrategySerializer implements IRawDataModelObjectSerializer<StrategyAllocationProto, StrategyAllocation> {
    private static final class InstanceHolder {
        private static final StrategySerializer INSTANCE = new StrategySerializer();
    }

    public static StrategySerializer getInstance() {
        return StrategySerializer.InstanceHolder.INSTANCE;
    }

    private StrategySerializer() {
    }

    public StrategyProto serialize(Strategy strategy) {
        StrategyProto.Builder builder = StrategyProto.newBuilder()
                .setObjectClass(strategy.getClass().getSimpleName())
                .setVersion("0.0.1")
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(strategy.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(strategy.getAsOf()))
                //Biz Fields
                .setStrategyName(strategy.getStrategyName());

        if(strategy.getParent() != null)
            builder.setParent(serialize(strategy.getParent()));

        return builder.build();
    }

    public Strategy deserialize(StrategyProto proto) {
        Strategy parent = proto.hasParent() ? deserialize(proto) : null;

        return new Strategy(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                proto.getStrategyName(),
                parent,
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
        );
    }

    @Override
    public StrategyAllocationProto serialize(StrategyAllocation strategyAllocation) {
        StrategyAllocationProto.Builder builder = StrategyAllocationProto.newBuilder()
            .setObjectClass(StrategyAllocation.class.getSimpleName())
            .setVersion("0.0.1")
            //Primary Key
            .setUuid(ProtoSerializationUtil.serializeUUID(strategyAllocation.getID()))
            .setAsOf(ProtoSerializationUtil.serializeTimestamp(strategyAllocation.getAsOf()));

        strategyAllocation.getAllocations().forEach(((strategy, allocation) -> {
            final MapFieldEntry mapFieldEntry = MapFieldEntry.newBuilder()
                    .setKey(serialize(strategy))
                    .setValue(ProtoSerializationUtil.serializeBigDecimal(allocation))
                    .build();

            builder.addAllocations(mapFieldEntry);
        }));

        return builder.build();
    }

    @Override
    public StrategyAllocation deserialize(StrategyAllocationProto proto) {
        if (!proto.hasAsOf() && !proto.hasUuid()) {
            return null;
        }

        final StrategyAllocation allocations = new StrategyAllocation(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
        );

        if(proto.getAllocationsCount() > 0) {
            proto.getAllocationsList().forEach((entry) -> {
                Strategy strategy = deserialize(entry.getKey());
                BigDecimal allocation = ProtoSerializationUtil.deserializeBigDecimal(entry.getValue());
                allocations.addAllocation(strategy, allocation);
            });
        }

        return allocations;
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338.
}
