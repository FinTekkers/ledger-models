package protos.serializers.security;

import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.IdentifierProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class IdentifierSerializerTest {
    /**
     * Round-trip via proto only — JSON serialize/deserialize was removed in
     * FinTekkers/second-brain#338 (no live callers). Tests now exercise the
     * binary proto path which is the canonical serialization mechanism.
     */
    @Test
    public void identifierSerialization() throws Exception {
        Identifier id = new Identifier(IdentifierType.CUSIP, "US12345678");

        IdentifierSerializer serializer = IdentifierSerializer.getInstance();

        IdentifierProto proto = serializer.serialize(id);
        IdentifierProto protoCopy = IdentifierProto.parseFrom(proto.toByteArray());
        Identifier idCopy = serializer.deserialize(protoCopy);

        Assertions.assertEquals(id, idCopy);
    }

    @Test
    public void seriesIdRoundTrip() throws Exception {
        Identifier id = new Identifier(IdentifierType.SERIES_ID, "CUUR0000SA0");

        IdentifierSerializer serializer = IdentifierSerializer.getInstance();

        IdentifierProto proto = serializer.serialize(id);
        IdentifierProto protoCopy = IdentifierProto.parseFrom(proto.toByteArray());
        Identifier idCopy = serializer.deserialize(protoCopy);

        Assertions.assertEquals(id, idCopy);
    }
}
