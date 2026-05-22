package protos.serializers;

import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.strategy.StrategyAllocationProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.strategy.StrategySerializer;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.util.Map;

import static java.time.temporal.ChronoUnit.MILLIS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StrategySerializerTest {
    @Test
    public void strategySerializationTest() {
        final StrategySerializer serializer = StrategySerializer.getInstance();

        final StrategyAllocation strategyAllocation = DummyEquityObjects.getDummyTransaction().getStrategyAllocation();
        final StrategyAllocationProto proto = serializer.serialize(strategyAllocation);
        final StrategyAllocation strategyAllocationCopy = serializer.deserialize(proto);

        assertEquals(strategyAllocation.getID(), strategyAllocationCopy.getID());
        assertTrue(strategyAllocation.getAsOf().isEqual(strategyAllocationCopy.getAsOf()));

        Map<Strategy, BigDecimal> originalAllocations = strategyAllocation.getAllocations();
        int numberStrategies = originalAllocations.size();

        Map<Strategy, BigDecimal> copyOfAllocations = strategyAllocationCopy.getAllocations();
        assertEquals(numberStrategies, copyOfAllocations.size());

        originalAllocations.forEach((strategy, allocation) -> {
            BigDecimal copyAllocation = copyOfAllocations.get(strategy);
            assertEquals(allocation.doubleValue(), copyAllocation.doubleValue());
        });
    }


    // testJSONSerialization removed in FinTekkers/second-brain#338 — JSON
    // serialize/deserialize methods on StrategySerializer were deleted (no
    // live callers across the platform).
}