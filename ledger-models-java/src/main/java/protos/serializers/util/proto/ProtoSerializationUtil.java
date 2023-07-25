package protos.serializers.util.proto;

import com.google.protobuf.*;
import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.security.identifier.Identifier;
import common.models.strategy.Strategy;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.strategy.StrategyProto;
import fintekkers.models.util.DecimalValue;
import fintekkers.models.util.LocalTimestamp;
import fintekkers.models.util.Uuid;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.SecuritySerializer;
import protos.serializers.strategy.StrategySerializer;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.*;
import java.util.UUID;

public class ProtoSerializationUtil {

    public static GeneratedMessageV3 serialize(Object object) {
        GeneratedMessageV3 unpacked;
        if(object instanceof BigDecimal) {
            unpacked = serializeBigDecimal((BigDecimal) object);
        }
        /*} else if(object instanceof IFintekkersEnum) {
            unpacked = Int32Value.of(((IFintekkersEnum)object).getProtoOrdinal());
        }*/ /*else if(object instanceof ProtocolMessageEnum) {
            //For regular Java enums we will serialize the name as a string.
            //NOTE: If you want to use this in other languages you should decide whether to
            //implement this as a protobuf enum or not. If you implement as a Java enum, but serialize
            //to a string, you are running the risk that another language implementation may simply send
            //a string and it may break. TODO: Implement a StringableEnum that can accept a generic string
            //and put into an uncategorized value.
            unpacked = Int32Value.of(((ProtocolMessageEnum)object).getNumber());
        }*/ else if(object instanceof LocalDate) {
            unpacked =  serializeLocalDate((LocalDate) object);
        } else if(object instanceof ZonedDateTime) {
            unpacked = serializeTimestamp((ZonedDateTime) object);
        } else if(object instanceof UUID) {
            unpacked = serializeUUID((UUID) object);
        } else if(object instanceof Price) {
            unpacked = PriceSerializer.getInstance().serialize((Price) object);
        } else if(object instanceof Security) {
            unpacked = SecuritySerializer.getInstance().serialize((Security) object);
        } else if(object instanceof Portfolio) {
            unpacked = PortfolioSerializer.getInstance().serialize((Portfolio) object);
        }  else if(object instanceof Strategy) {
            unpacked = StrategySerializer.getInstance().serialize((Strategy)object);
        } else if(object instanceof String) {
            //TODO: Remove this and serialize the string rather than packing it
            unpacked = StringValue.of(object.toString());
        } else if(object instanceof Identifier) {
            unpacked = IdentifierSerializer.getInstance().serialize((Identifier) object);
        } else if(object instanceof IdentifierProto) {
            unpacked = (GeneratedMessageV3) object;
        } else {
            throw new UnsupportedOperationException("Type is not supported: "+ object.getClass().getName());
        }

        return unpacked;
    }

    public static Any serializeToAny(Object object) {
        GeneratedMessageV3 unpacked = serialize(object);
        return Any.pack(unpacked);
    }

    public static Object deserialize(Any any) {
        try {
            if (any.is(DecimalValue.DecimalValueProto.class)) {
                DecimalValue.DecimalValueProto decimalValueProto = any.unpack(DecimalValue.DecimalValueProto.class);
                return deserializeBigDecimal(decimalValueProto);
            } else if (any.is(fintekkers.models.util.LocalDate.LocalDateProto.class)) {
                fintekkers.models.util.LocalDate.LocalDateProto localDateProto = any.unpack(fintekkers.models.util.LocalDate.LocalDateProto.class);
                return deserializeLocalDate(localDateProto);
            } else if (any.is(LocalTimestamp.LocalTimestampProto.class)) {
                LocalTimestamp.LocalTimestampProto timestamp = any.unpack(LocalTimestamp.LocalTimestampProto.class);
                return deserializeTimestamp(timestamp);
            } else if (any.is(Uuid.UUIDProto.class)) {
                Uuid.UUIDProto uuid = any.unpack(Uuid.UUIDProto.class);
                return deserializeUUID(uuid);
            } else if(any.is(PriceProto.class)) {
                return PriceSerializer.getInstance().deserialize(any.unpack(PriceProto.class));
            } else if(any.is(SecurityProto.class)) {
                return SecuritySerializer.getInstance().deserialize(any.unpack(SecurityProto.class));
            } else if(any.is(PortfolioProto.class)) {
                return PortfolioSerializer.getInstance().deserialize(any.unpack(PortfolioProto.class));
            } else if(any.is(StrategyProto.class)) {
                return StrategySerializer.getInstance().deserialize(any.unpack(StrategyProto.class));
            } else if(any.is(StringValue.class)) {
                //TODO: Remove this and serialize the string rather than packing it
                return any.unpack(StringValue.class).getValue();
            } else if(any.is(IdentifierProto.class)) {
                IdentifierProto identifierProto = any.unpack(IdentifierProto.class);
                return IdentifierSerializer.getInstance().deserialize(identifierProto);
            } else {
                throw new UnsupportedOperationException("Type is not supported: "+ any.getTypeUrl());
            }
        } catch (InvalidProtocolBufferException e) {
            throw new RuntimeException(e);
        }
    }

    public static Uuid.UUIDProto serializeUUID(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());

        Uuid.UUIDProto.Builder builder = Uuid.UUIDProto.newBuilder()
                .setRawUuid(ByteString.copyFrom(bb.array()));

        return builder.build();
    }

    public static UUID deserializeUUID(Uuid.UUIDProto rawUUID) {
        ByteBuffer bb = ByteBuffer.wrap(rawUUID.getRawUuid().toByteArray());
        long firstLong = bb.getLong();
        long secondLong = bb.getLong();
        return new UUID(firstLong, secondLong);
    }

    public static DecimalValue.DecimalValueProto serializeBigDecimal(BigDecimal quantity) {
        return DecimalValue.DecimalValueProto.newBuilder()
                .setArbitraryPrecisionValue(quantity.toString())
                .build();
    }

    public static BigDecimal deserializeBigDecimal(DecimalValue.DecimalValueProto quantity) {
        if(quantity == null)
            return null;

        return new BigDecimal(quantity.getArbitraryPrecisionValue());
    }

    public static LocalDate deserializeLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date) {
        return LocalDate.of(date.getYear(), date.getMonth(), date.getDay());
    }


    public static fintekkers.models.util.LocalDate.LocalDateProto serializeLocalDate(LocalDate date) {
        return fintekkers.models.util.LocalDate.LocalDateProto.newBuilder()
                .setYear(date.getYear())
                .setMonth(date.getMonthValue())
                .setDay(date.getDayOfMonth())
                .build();
    }

    public static ZonedDateTime deserializeTimestamp(LocalTimestamp.LocalTimestampProto ts) {
        ZoneId zoneId = ZoneId.of(ts.getTimeZone());

        LocalDateTime localDateTime = Instant.ofEpochSecond(
                ts.getTimestamp().getSeconds(), ts.getTimestamp().getNanos())
                .atZone(ZoneOffset.UTC)
                .toLocalDateTime();

        return ZonedDateTime.of(localDateTime, zoneId);
    }

    public static LocalTimestamp.LocalTimestampProto serializeTimestamp(ZonedDateTime ts) {
        Instant instant = ts.toInstant();

        long epochSecond = ts.toLocalDateTime().toInstant(ZoneOffset.UTC).getEpochSecond();

        return LocalTimestamp.LocalTimestampProto.newBuilder()
            .setTimeZone(ts.getZone().getId())
            .setTimestamp(
                    Timestamp.newBuilder().setSeconds(epochSecond)
                            .setNanos(instant.getNano())
                            .build()
            )
            .build();
    }

}
