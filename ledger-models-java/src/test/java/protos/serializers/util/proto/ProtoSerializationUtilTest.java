package protos.serializers.util.proto;

import com.google.protobuf.Any;
import com.google.protobuf.ByteString;
import fintekkers.models.util.LocalTimestamp;
import fintekkers.models.util.Uuid;
import org.junit.Assert;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

class ProtoSerializationUtilTest {
    @Test
    public void testTimestampSerialization() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/New_York"));
        LocalTimestamp.LocalTimestampProto proto = ProtoSerializationUtil.serializeTimestamp(now);

        ZonedDateTime zonedDateTime = ProtoSerializationUtil.deserializeTimestamp(proto);
        assertEquals(now, zonedDateTime);

        now = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        proto = ProtoSerializationUtil.serializeTimestamp(now);

        zonedDateTime = ProtoSerializationUtil.deserializeTimestamp(proto);
        assertEquals(now, zonedDateTime);
    }

    @Test
    public void testDateSerialization() {
        LocalDate today = LocalDate.now();
        Any packedDate = ProtoSerializationUtil.serializeToAny(today);

        LocalDate unpacked = (LocalDate) ProtoSerializationUtil.deserialize(packedDate);
        assertEquals(today, unpacked);
    }

    @Test
    public void testBooleanSerialization() {
        Any packedTrue = ProtoSerializationUtil.serializeToAny(Boolean.TRUE);
        Object unpackedTrue = ProtoSerializationUtil.deserialize(packedTrue);
        assertEquals(Boolean.TRUE, unpackedTrue);

        Any packedFalse = ProtoSerializationUtil.serializeToAny(Boolean.FALSE);
        Object unpackedFalse = ProtoSerializationUtil.deserialize(packedFalse);
        assertEquals(Boolean.FALSE, unpackedFalse);
    }

    // second-brain#276 — deserializeTimestamp must throw on empty time_zone
    // rather than silently substituting now(). Surfaced by backend-dev-ledger
    // during #268 verification.

    @Test
    public void deserializeTimestamp_throwsWhenTimeZoneIsEmpty() {
        // The proto3 default LocalTimestampProto: time_zone="" and a
        // default Timestamp. Pre-fix, this silently returned now(UTC),
        // which corrupted as-of semantics. Post-fix it throws.
        LocalTimestamp.LocalTimestampProto empty =
                LocalTimestamp.LocalTimestampProto.getDefaultInstance();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> ProtoSerializationUtil.deserializeTimestamp(empty),
                "Empty time_zone must throw, not silently default to now().");
        assertTrue(ex.getMessage().contains("time_zone"),
                "Error message must point at the missing field; got: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("276"),
                "Error message should reference the tracking ticket for grep-ability; got: "
                + ex.getMessage());
    }

    @Test
    public void deserializeTimestamp_throwsWhenTimeZoneIsBlank() {
        // Whitespace-only time_zone is treated the same as empty — a
        // producer that set it to " " is still failing the contract.
        LocalTimestamp.LocalTimestampProto blank = LocalTimestamp.LocalTimestampProto.newBuilder()
                .setTimeZone("   ")
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(1_700_000_000L).build())
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> ProtoSerializationUtil.deserializeTimestamp(blank));
    }

    @Test
    public void deserializeTimestamp_throwsWhenSecondsArePopulatedButTimeZoneEmpty() {
        // The footgun shape backend-dev-ledger hit: timestamp seconds set
        // (looks like a real instant) but time_zone forgotten on the wire.
        // Pre-fix: silent now(). Post-fix: loud failure.
        LocalTimestamp.LocalTimestampProto onlySeconds = LocalTimestamp.LocalTimestampProto.newBuilder()
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(1_700_000_000L).build())
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> ProtoSerializationUtil.deserializeTimestamp(onlySeconds));
    }

    @Test
    public void deserializeTimestamp_happyPathStillRoundTrips() {
        // Sanity: a properly populated LocalTimestampProto continues to round-trip.
        ZonedDateTime utcNow = ZonedDateTime.now(ZoneId.of("UTC"));
        LocalTimestamp.LocalTimestampProto proto = ProtoSerializationUtil.serializeTimestamp(utcNow);
        assertEquals(utcNow, ProtoSerializationUtil.deserializeTimestamp(proto));

        ZonedDateTime nyNow = ZonedDateTime.now(ZoneId.of("America/New_York"));
        proto = ProtoSerializationUtil.serializeTimestamp(nyNow);
        assertEquals(nyNow, ProtoSerializationUtil.deserializeTimestamp(proto));
    }

    @Test
    public void testUUIDSerialization() {
        String uuid_string = "d962fdf0-33e1-4d9d-999b-7ec350f0cb77";
        UUID uuid = UUID.fromString(uuid_string);

        Uuid.UUIDProto uuidProto = ProtoSerializationUtil.serializeUUID(uuid);

        byte[] expected = {-39, 98, -3, -16, 51, -31, 77, -99, -103, -101, 126, -61, 80, -16, -53, 119};
        byte[] actual = uuidProto.getRawUuid().toByteArray();

        for(int i=0; i<expected.length; i++)
            Assertions.assertTrue(expected[i] == actual[i]);

        byte[] bytes = uuidProto.getRawUuid().toByteArray();
        ByteString byteString = ByteString.copyFrom(bytes);

        Uuid.UUIDProto protoCopy = Uuid.UUIDProto.newBuilder().setRawUuid(byteString).build();
        UUID uuidCopy = ProtoSerializationUtil.deserializeUUID(protoCopy);

        Assertions.assertEquals(uuid_string, uuidCopy.toString());
    }
}