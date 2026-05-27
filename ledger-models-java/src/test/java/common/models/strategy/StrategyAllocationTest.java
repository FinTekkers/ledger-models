package common.models.strategy;

import fintekkers.models.strategy.StrategyAllocationProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StrategyAllocationTest {

    private static final UUID ID = UUID.randomUUID();
    private static final ZonedDateTime AS_OF = ZonedDateTime.now();

    private Strategy makeStrategy(String name) {
        return new Strategy(UUID.randomUUID(), name, null, AS_OF);
    }

    // ---------------- POJO constructor validation ---------------------------

    @Test
    void pojoCtor_throwsOnNullId() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new StrategyAllocation(null, AS_OF));
        assertEquals("StrategyAllocation.id is required", e.getMessage());
    }

    @Test
    void pojoCtor_throwsOnNullAsOf() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new StrategyAllocation(ID, null));
        assertEquals("StrategyAllocation.asOf is required", e.getMessage());
    }

    // ---------------- Proto constructor validation --------------------------

    @Test
    void protoCtor_throwsOnMissingUuid() {
        StrategyAllocationProto p = StrategyAllocationProto.newBuilder()
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .build();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new StrategyAllocation(p));
        assertEquals("StrategyAllocationProto.uuid is required", e.getMessage());
    }

    @Test
    void protoCtor_throwsOnMissingAsOf() {
        StrategyAllocationProto p = StrategyAllocationProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(ID))
                .build();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new StrategyAllocation(p));
        assertEquals("StrategyAllocationProto.as_of is required", e.getMessage());
    }

    // ---------------- Mutation persists through the proto -------------------

    @Test
    void addAllocation_storesEntryReadableByGetAllocations() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        Strategy s = makeStrategy("Long");
        a.addAllocation(s, BigDecimal.valueOf(0.5));

        Map<Strategy, BigDecimal> got = a.getAllocations();
        assertEquals(1, got.size());
        assertEquals(0, BigDecimal.valueOf(0.5).compareTo(got.get(s)));
    }

    @Test
    void addAllocation_persistsInUnderlyingProto() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        a.addAllocation(makeStrategy("L"), BigDecimal.valueOf(0.5));
        a.addAllocation(makeStrategy("S"), BigDecimal.valueOf(0.5));

        // The proto itself must contain both entries — proves the wrapper is
        // not maintaining a separate Java-side map shadow of the state.
        assertEquals(2, a.getProto().getAllocationsCount());
    }

    @Test
    void addAllocation_throwsOnNullStrategy() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        assertThrows(IllegalArgumentException.class,
                () -> a.addAllocation(null, BigDecimal.ONE));
    }

    @Test
    void addAllocation_throwsOnNullAmount() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        assertThrows(IllegalArgumentException.class,
                () -> a.addAllocation(makeStrategy("X"), null));
    }

    @Test
    void getAllocations_returnsEmptyMapWhenNoneAdded() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        assertEquals(0, a.getAllocations().size());
    }

    // ---------------- validate() — sum equals 1 -----------------------------

    @Test
    void validate_trueWhenSumIsExactlyOne() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        a.addAllocation(makeStrategy("L"), BigDecimal.valueOf(0.5));
        a.addAllocation(makeStrategy("S"), BigDecimal.valueOf(0.5));
        assertTrue(a.validate());
    }

    @Test
    void validate_falseWhenSumIsNotOne() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        a.addAllocation(makeStrategy("L"), BigDecimal.valueOf(0.4));
        a.addAllocation(makeStrategy("S"), BigDecimal.valueOf(0.5));
        assertFalse(a.validate());
    }

    // ---------------- Proto round-trip preserves state ----------------------

    @Test
    void protoRoundTrip_preservesAllocations() {
        StrategyAllocation original = new StrategyAllocation(ID, AS_OF);
        Strategy s1 = makeStrategy("L");
        Strategy s2 = makeStrategy("S");
        original.addAllocation(s1, BigDecimal.valueOf(0.3));
        original.addAllocation(s2, BigDecimal.valueOf(0.7));

        StrategyAllocation roundTripped = new StrategyAllocation(original.getProto());

        assertEquals(original.getID(), roundTripped.getID());
        assertEquals(original.getAsOf().toEpochSecond(), roundTripped.getAsOf().toEpochSecond());

        Map<Strategy, BigDecimal> got = roundTripped.getAllocations();
        assertEquals(2, got.size());
        assertEquals(0, BigDecimal.valueOf(0.3).compareTo(got.get(s1)));
        assertEquals(0, BigDecimal.valueOf(0.7).compareTo(got.get(s2)));
    }

    // ---------------- Equality contract -------------------------------------

    @Test
    void equals_matchesByIdRegardlessOfAsOfOrAllocations() {
        StrategyAllocation a = new StrategyAllocation(ID, AS_OF);
        StrategyAllocation b = new StrategyAllocation(ID, AS_OF.plusDays(1));
        a.addAllocation(makeStrategy("X"), BigDecimal.ONE);
        // b has no allocations — but same id, so equals
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_falseForDifferentIds() {
        StrategyAllocation a = new StrategyAllocation(UUID.randomUUID(), AS_OF);
        StrategyAllocation b = new StrategyAllocation(UUID.randomUUID(), AS_OF);
        assertNotEquals(a, b);
    }
}
