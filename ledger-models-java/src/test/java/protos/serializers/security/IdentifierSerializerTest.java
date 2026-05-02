package protos.serializers.security;

import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.IdentifierProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class IdentifierSerializerTest {
    @Test
    public void identifierSerialization() {
        Identifier id = new Identifier(IdentifierType.CUSIP, "US12345678");

        IdentifierSerializer serializer = IdentifierSerializer.getInstance();

        IdentifierProto proto = serializer.serialize(id);
        String json = serializer.serializeToJson(proto);

        IdentifierProto protoCopy = serializer.deserializeFromJson(json);
        Identifier idCopy = serializer.deserialize(protoCopy);

        Assertions.assertEquals(id, idCopy);
    }

    @Test
    public void seriesIdRoundTrip() {
        Identifier id = new Identifier(IdentifierType.SERIES_ID, "CUUR0000SA0");

        IdentifierSerializer serializer = IdentifierSerializer.getInstance();

        IdentifierProto proto = serializer.serialize(id);
        String json = serializer.serializeToJson(proto);

        IdentifierProto protoCopy = serializer.deserializeFromJson(json);
        Identifier idCopy = serializer.deserialize(protoCopy);

        Assertions.assertEquals(id, idCopy);
    }
}