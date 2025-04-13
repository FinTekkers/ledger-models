package protos.serializers.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.JSONFieldNames;
import common.models.security.Tenor;
import common.models.security.TenorType;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.TenorProto;
import fintekkers.models.security.TenorTypeProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;

public class TenorSerializer implements IRawDataModelObjectSerializer<TenorProto, Tenor> {

    private static final class InstanceHolder {
        private static final TenorSerializer INSTANCE = new TenorSerializer();
    }

    public static TenorSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private TenorSerializer() {
    }

    @Override
    public TenorProto serialize(Tenor tenor) {
        TenorTypeProto tenorTypeProto;

        try {
            tenorTypeProto = TenorTypeProto.valueOf(tenor.getType().name());
        } catch(IllegalArgumentException e) {
            tenorTypeProto = TenorTypeProto.UNKNOWN_TENOR_TYPE;
        }

        TenorProto.Builder builder = TenorProto.newBuilder()
                .setObjectClass(tenor.getClass().getSimpleName())
                .setVersion("0.0.1")
                .setTenorType(tenorTypeProto);
//                .setTermValue(tenor.getTenorDescription());

        if(TenorType.TERM.equals(tenor.getType())) {
            builder.setTermValue(tenor.getTenorDescription());
        }

        return builder.build();
    }

    @Override
    public String serializeToJson(TenorProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        String json = gson.toJson(proto);

        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);
        IdentifierTypeProto identifierTypeProto =
                IdentifierTypeProto.forNumber(jsonObject.get(JSONFieldNames.IDENTIFIER_TYPE).getAsInt());

        jsonObject.add(JSONFieldNames.IDENTIFIER_TYPE, new JsonPrimitive(identifierTypeProto.name()));

        return jsonObject.toString();
    }

    @Override
    public TenorProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject jsonObject = gson.fromJson(json, JsonObject.class);

        IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(jsonObject.get(JSONFieldNames.IDENTIFIER_TYPE).getAsString());
        jsonObject.add(JSONFieldNames.IDENTIFIER_TYPE, new JsonPrimitive(identifierTypeProto.getNumber()));

        return gson.fromJson(jsonObject.toString(), TenorProto.class);
    }

    @Override
    public Tenor deserialize(TenorProto proto) {
        return new Tenor(
                TenorType.valueOf(proto.getTenorType().name()),
                proto.getTermValue()
        );
    }
}
