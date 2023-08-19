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