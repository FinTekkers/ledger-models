package protos.serializers.price;

import fintekkers.models.util.ObjectTypeProto;
import common.util.ObjectTypes;
import common.models.price.Price;
import common.models.security.Security;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
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
        PriceProto.Builder builder = ObjectTypes.stamp(PriceProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE)
                //Primary Key
                .setUuid(ProtoSerializationUtil.serializeUUID(price.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(price.getAsOf()))
                //Biz fields
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(price.getPrice()));
        // LM-449: an inline trade price may have no security; leave it absent.
        // Never filled from elsewhere (e.g. the transaction's security).
        if (price.getSecurity() != null) {
            builder.setSecurity(price.getSecurity().getProto());
        }
        // Skipped at the default so bytes for untyped prices are unchanged.
        PriceTypeProto type = price.getPriceType();
        if (type != PriceTypeProto.UNKNOWN_PRICE_TYPE && type != PriceTypeProto.UNRECOGNIZED) {
            builder.setPriceType(type);
        }

        return builder.build();

    }

    @Override
    public Price deserialize(PriceProto proto) {
        return new Price(
                ProtoSerializationUtil.deserializeUUID(proto.getUuid()),
                ProtoSerializationUtil.deserializeBigDecimal(proto.getPrice()),
                // LM-449: no security on the proto is a null security, as in
                // TransactionSerializer.readPrice.
                proto.hasSecurity() ? Security.fromProto(proto.getSecurity()) : null,
                // No is_link exemption: Transaction.getPrice resolves link
                // prices from LinkCache before calling here.
                ProtoSerializationUtil.deserializeRequiredTimestamp(
                        proto.hasAsOf() ? proto.getAsOf() : null, "price.as_of"),
                proto.getPriceType()
        );
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338 — no
    // live callers across the platform.
}
