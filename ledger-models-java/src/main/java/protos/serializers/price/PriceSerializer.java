package protos.serializers.price;

import common.models.price.Price;
import common.models.security.Security;
import fintekkers.models.price.PriceProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

public class PriceSerializer implements IRawDataModelObjectSerializer<PriceProto, Price> {
    private static final class InstanceHolder {
        private static final PriceSerializer INSTANCE = new PriceSerializer();
    }

    public static PriceSerializer getInstance() {
        return PriceSerializer.InstanceHolder.INSTANCE;
    }

    private PriceSerializer() {
    }

    @Override
    public PriceProto serialize(Price price) {
        PriceProto.Builder builder = PriceProto.newBuilder()
                .setObjectClass(Price.class.getSimpleName())
                .setVersion("0.0.1")
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(price.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(price.getAsOf()))
                //Biz fields
                .setSecurity(price.getSecurity().getProto())
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(price.getPrice()));

        return builder.build();

    }

    @Override
    public Price deserialize(PriceProto proto) {
        return new Price(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                ProtoSerializationUtil.deserializeBigDecimal(proto.getPrice()),
                Security.fromProto(proto.getSecurity()),
                ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
        );
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338 — no
    // live callers across the platform.
}
