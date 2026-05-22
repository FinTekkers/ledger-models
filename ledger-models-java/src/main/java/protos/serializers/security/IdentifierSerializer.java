package protos.serializers.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.JSONFieldNames;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

public class IdentifierSerializer implements IRawDataModelObjectSerializer<IdentifierProto, Identifier> {

    private static final class InstanceHolder {
        private static final IdentifierSerializer INSTANCE = new IdentifierSerializer();
    }

    public static IdentifierSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private IdentifierSerializer() {
    }

    @Override
    public IdentifierProto serialize(Identifier identifier) {
        IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(identifier.getIdentifierType().name());

        IdentifierProto.Builder builder = IdentifierProto.newBuilder()
                .setObjectClass(identifier.getClass().getSimpleName())
                .setVersion("0.0.1")

                .setIdentifierType(identifierTypeProto)
                .setIdentifierValue(identifier.getIdentifier());

        return builder.build();
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338.

    @Override
    public Identifier deserialize(IdentifierProto proto) {
        return new Identifier(
                IdentifierType.valueOf(proto.getIdentifierType().name()),
                proto.getIdentifierValue()
        );
    }
}
