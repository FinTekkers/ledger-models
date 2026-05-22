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

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338.

    @Override
    public Tenor deserialize(TenorProto proto) {
        return new Tenor(
                TenorType.valueOf(proto.getTenorType().name()),
                proto.getTermValue()
        );
    }
}
