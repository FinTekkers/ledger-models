package common.models.strategy;

import fintekkers.models.strategy.StrategyProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StrategyTest {

    private static final UUID ID = UUID.randomUUID();
    private static final ZonedDateTime AS_OF = ZonedDateTime.now();
    private static final String NAME = "Equities/Long";

    // ---------------- POJO constructor validation ---------------------------

    @Test
    void pojoCtor_throwsOnNullId() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new Strategy(null, NAME, null, AS_OF));
        assertEquals("Strategy.id is required", e.getMessage());
    }

    @Test
    void pojoCtor_throwsOnNullName() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new Strategy(ID, null, null, AS_OF));
        assertEquals("Strategy.strategyName is required", e.getMessage());
    }

    @Test
    void pojoCtor_throwsOnEmptyName() {
        assertThrows(IllegalArgumentException.class,
                () -> new Strategy(ID, "", null, AS_OF));
    }

    @Test
    void pojoCtor_throwsOnNullAsOf() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new Strategy(ID, NAME, null, null));
        assertEquals("Strategy.asOf is required", e.getMessage());
    }

    @Test
    void pojoCtor_acceptsNullParent() {
        Strategy s = new Strategy(ID, NAME, null, AS_OF);
        assertNull(s.getParent());
    }

    // ---------------- Proto constructor validation --------------------------

    @Test
    void protoCtor_throwsOnMissingUuid() {
        StrategyProto p = StrategyProto.newBuilder()
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setStrategyName(NAME)
                .build();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new Strategy(p));
        assertEquals("StrategyProto.uuid is required", e.getMessage());
    }

    @Test
    void protoCtor_throwsOnMissingAsOf() {
        StrategyProto p = StrategyProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(ID))
                .setStrategyName(NAME)
                .build();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> new Strategy(p));
        assertEquals("StrategyProto.as_of is required", e.getMessage());
    }

    @Test
    void protoCtor_throwsOnMissingName() {
        StrategyProto p = StrategyProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(ID))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .build();
        assertThrows(IllegalArgumentException.class, () -> new Strategy(p));
    }

    // ---------------- Getter reads from proto, not from POJO state ----------

    @Test
    void getStrategyName_readsFromProto() {
        Strategy s = new Strategy(ID, NAME, null, AS_OF);
        assertEquals(NAME, s.getStrategyName());
        assertEquals(NAME, s.getProto().getStrategyName(),
                "wrapper.getStrategyName must read from proto state");
    }

    @Test
    void getAsOf_readsFromProto() {
        Strategy s = new Strategy(ID, NAME, null, AS_OF);
        // Round-trip preserves the wall-clock + zone (the serializer treats
        // local time as UTC for the wire, then restores the original zone on
        // read), so the deserialized instant equals the input instant.
        assertEquals(AS_OF.toEpochSecond(), s.getAsOf().toEpochSecond());

        // And the wrapper's getter reads from the proto, not from a separate
        // POJO field — verify by re-wrapping the proto and comparing.
        Strategy roundTripped = new Strategy(s.getProto());
        assertEquals(s.getAsOf().toEpochSecond(), roundTripped.getAsOf().toEpochSecond());
    }

    @Test
    void getID_readsFromProto() {
        Strategy s = new Strategy(ID, NAME, null, AS_OF);
        assertEquals(ID, s.getID());
        UUID fromProto = ProtoSerializationUtil.deserializeUUID(s.getProto().getUuid());
        assertEquals(ID, fromProto);
    }

    // ---------------- Parent + fully-qualified name -------------------------

    @Test
    void getParent_returnsWrappedProtoParent() {
        Strategy parent = new Strategy(UUID.randomUUID(), "Equities", null, AS_OF);
        Strategy child = new Strategy(UUID.randomUUID(), "Long", parent, AS_OF);

        Strategy roundTrippedParent = child.getParent();
        assertNotNull(roundTrippedParent);
        assertEquals(parent.getID(), roundTrippedParent.getID());
        assertEquals("Equities", roundTrippedParent.getStrategyName());
    }

    @Test
    void getFullyQualifiedStrategyName_walksParentChain() {
        Strategy grand = new Strategy(UUID.randomUUID(), "Equities", null, AS_OF);
        Strategy parent = new Strategy(UUID.randomUUID(), "Long", grand, AS_OF);
        Strategy child = new Strategy(UUID.randomUUID(), "Tech", parent, AS_OF);

        assertEquals("Equities/Long/Tech", child.getFullyQualifiedStrategyName());
    }

    // ---------------- Equality contract ------------------------------------

    @Test
    void equals_matchesByIdRegardlessOfName() {
        Strategy a = new Strategy(ID, "name-a", null, AS_OF);
        Strategy b = new Strategy(ID, "name-b", null, AS_OF.plusDays(1));
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_falseForDifferentIds() {
        Strategy a = new Strategy(UUID.randomUUID(), NAME, null, AS_OF);
        Strategy b = new Strategy(UUID.randomUUID(), NAME, null, AS_OF);
        org.junit.jupiter.api.Assertions.assertNotEquals(a, b);
    }
}
