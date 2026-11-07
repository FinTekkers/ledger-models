package protos.serializers;

import com.google.protobuf.Any;
import com.google.protobuf.GeneratedMessageV3;
import com.google.protobuf.InvalidProtocolBufferException;
import common.models.IRawDataModelObject;
import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionSerializer;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;

import java.util.HashMap;
import java.util.Map;

public class SerializerFactory implements IRawDataModelObjectSerializer {
    private final static protos.serializers.SerializerFactory INSTANCE = new protos.serializers.SerializerFactory();

    public static protos.serializers.SerializerFactory getInstance() {
        return INSTANCE;
    }

    /**
     * Security routes through its wrapper directly: new Security(proto) /
     * security.getProto() (Phase 1, #338); SecuritySerializer was deleted.
     * Transaction is a plain object with TransactionSerializer again (LM-444,
     * reverting #340's wrapper). Price + Portfolio use their serializers.
     */
    private final static Map<Class, IRawDataModelObjectSerializer> serializers = new HashMap<>() {{
        put(Price.class, PriceSerializer.getInstance());
        put(Portfolio.class, PortfolioSerializer.getInstance());
        put(Transaction.class, TransactionSerializer.getInstance());
    }};

    private final static Map<Class, IRawDataModelObjectSerializer> serializers_by_proto = new HashMap<>() {{
        put(PriceProto.class, PriceSerializer.getInstance());
        put(PortfolioProto.class, PortfolioSerializer.getInstance());
        put(TransactionProto.class, TransactionSerializer.getInstance());
    }};

    @Override
    public GeneratedMessageV3 serialize(IRawDataModelObject dataModelObject) {
        // Security — the wrapper IS the proto holder; no serializer.
        if (dataModelObject instanceof Security) {
            return Any.pack(((Security) dataModelObject).getProto());
        }

        IRawDataModelObjectSerializer serializer = serializers.get(dataModelObject.getClass());

        if (serializer == null) {
            throw new RuntimeException("No serializer found for " + dataModelObject.getClass().getSimpleName());
        }

        final GeneratedMessageV3 proto = serializer.serialize(dataModelObject);
        return Any.pack(proto);
    }

    public static byte[] serializeToBytes(GeneratedMessageV3 proto) {
        return proto.toByteArray();
    }

    public static GeneratedMessageV3 deserializeFromBytes(byte[] bytes) {
        try {
            return Any.parseFrom(bytes);
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public IRawDataModelObject deserialize(GeneratedMessageV3 proto) {
        try {
            Any any = (Any) proto;
            GeneratedMessageV3 unpacked;

            if (any.is(TransactionProto.class)) {
                unpacked = any.unpack(TransactionProto.class);
            } else if (any.is(SecurityProto.class)) {
                // Security — no serializer indirection; route through fromProto.
                return Security.fromProto(any.unpack(SecurityProto.class));
            } else if (any.is(PriceProto.class)) {
                unpacked = any.unpack(PriceProto.class);
            } else if (any.is(PortfolioProto.class)) {
                unpacked = any.unpack(PortfolioProto.class);
            } else {
                throw new UnsupportedOperationException("Could not process proto of type:" + proto.getDescriptorForType().getName());
            }

            final IRawDataModelObjectSerializer serializer = serializers_by_proto.get(unpacked.getClass());
            return serializer.deserialize(unpacked);
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    public IRawDataModelObject deserialize(byte[] bytes) {
        final GeneratedMessageV3 proto = protos.serializers.SerializerFactory.deserializeFromBytes(bytes);
        return this.deserialize(proto);
    }
}
