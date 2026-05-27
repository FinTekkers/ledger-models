package protos.serializers;

import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.strategy.StrategyAllocationProto;
import org.junit.jupiter.api.Test;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Proto round-trip on {@link StrategyAllocation}. Post-StrategySerializer
 * removal: the wrapper itself holds the proto, so the round-trip is
 * {@code wrapper -> getProto() -> new StrategyAllocation(proto)} rather
 * than going through a separate serializer class.
 */
class StrategySerializerTest {

    @Test
    public void strategyAllocation_protoRoundTrip_preservesFields() {
        final StrategyAllocation strategyAllocation =
                DummyEquityObjects.getDummyTransaction().getStrategyAllocation();

        final StrategyAllocationProto proto = strategyAllocation.getProto();
        final StrategyAllocation strategyAllocationCopy = new StrategyAllocation(proto);

        assertEquals(strategyAllocation.getID(), strategyAllocationCopy.getID());
        assertEquals(strategyAllocation.getAsOf().toEpochSecond(),
                strategyAllocationCopy.getAsOf().toEpochSecond(),
                "as_of must round-trip to the same instant");

        Map<Strategy, BigDecimal> originalAllocations = strategyAllocation.getAllocations();
        Map<Strategy, BigDecimal> copyOfAllocations = strategyAllocationCopy.getAllocations();
        assertEquals(originalAllocations.size(), copyOfAllocations.size());

        originalAllocations.forEach((strategy, allocation) -> {
            BigDecimal copyAllocation = copyOfAllocations.get(strategy);
            assertEquals(allocation.doubleValue(), copyAllocation.doubleValue());
        });
    }
}
