package protos.serializers.util.proto;

import com.google.protobuf.*;
import common.models.errors.InvalidFieldException;
import common.models.errors.ModelValidationException;
import common.models.errors.UnsetDecimalException;
import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.security.Tenor;
import common.models.security.identifier.Identifier;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.strategy.StrategyAllocationProto;
import fintekkers.models.strategy.StrategyProto;
import fintekkers.models.util.DecimalValue;
import fintekkers.models.util.LocalTimestamp;
import fintekkers.models.util.Uuid;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.TenorSerializer;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.*;
import java.util.List;
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
            unpacked = ((Security) object).getProto();
        } else if(object instanceof Portfolio) {
            unpacked = PortfolioSerializer.getInstance().serialize((Portfolio) object);
        }  else if(object instanceof StrategyAllocation) {
            unpacked = ((StrategyAllocation) object).getProto();
        } else if(object instanceof String) {
            //TODO: Remove this and serialize the string rather than packing it
            unpacked = StringValue.of(object.toString());
        } else if(object instanceof Identifier) {
            unpacked = IdentifierSerializer.getInstance().serialize((Identifier) object);
        } else if(object instanceof Tenor) {
            unpacked = TenorSerializer.getInstance().serialize((Tenor) object);
        } else if(object instanceof IdentifierProto) {
            unpacked = (GeneratedMessageV3) object;
        } else if(object instanceof Boolean) {
            unpacked = BoolValue.of((Boolean) object);
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
                return deserializeRequiredLocalDate(localDateProto, "unknown");
            } else if (any.is(LocalTimestamp.LocalTimestampProto.class)) {
                LocalTimestamp.LocalTimestampProto timestamp = any.unpack(LocalTimestamp.LocalTimestampProto.class);
                return deserializeTimestamp(timestamp);
            } else if (any.is(Uuid.UUIDProto.class)) {
                Uuid.UUIDProto uuid = any.unpack(Uuid.UUIDProto.class);
                return deserializeUUID(uuid);
            } else if(any.is(PriceProto.class)) {
                return PriceSerializer.getInstance().deserialize(any.unpack(PriceProto.class));
            } else if(any.is(SecurityProto.class)) {
                return Security.fromProto(any.unpack(SecurityProto.class));
            } else if(any.is(PortfolioProto.class)) {
                return PortfolioSerializer.getInstance().deserialize(any.unpack(PortfolioProto.class));
            } else if(any.is(StrategyAllocationProto.class)) {
                return new StrategyAllocation(any.unpack(StrategyAllocationProto.class));
            } else if(any.is(StringValue.class)) {
                //TODO: Remove this and serialize the string rather than packing it
                return any.unpack(StringValue.class).getValue();
            } else if(any.is(IdentifierProto.class)) {
                IdentifierProto identifierProto = any.unpack(IdentifierProto.class);
                return IdentifierSerializer.getInstance().deserialize(identifierProto);
            } else if(any.is(BoolValue.class)) {
                return any.unpack(BoolValue.class).getValue();
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
        byte[] bytes = rawUUID.getRawUuid().toByteArray();
        if (bytes.length == 0) {
            // Empty UUID — return null to let the caller decide
            // (e.g., assign a new one for creates, or reject for lookups)
            return null;
        }
        if (bytes.length < 16) {
            throw new IllegalArgumentException(
                "Invalid UUID: expected 16 bytes but got " + bytes.length);
        }
        ByteBuffer bb = ByteBuffer.wrap(bytes);
        long firstLong = bb.getLong();
        long secondLong = bb.getLong();
        return new UUID(firstLong, secondLong);
    }

    public static DecimalValue.DecimalValueProto serializeBigDecimal(BigDecimal quantity) {
        return DecimalValue.DecimalValueProto.newBuilder()
                .setArbitraryPrecisionValue(quantity.toString())
                .build();
    }

    /** True when the decimal is absent ({@code null}) or its {@code arbitrary_precision_value} is empty. */
    public static boolean isUnsetDecimal(DecimalValue.DecimalValueProto value) {
        return value == null || value.getArbitraryPrecisionValue().isEmpty();
    }

    /**
     * Does not know the field name; prefer {@link #deserializeBigDecimal(DecimalValue.DecimalValueProto, String)}.
     *
     * @return {@code null} if {@code quantity} is {@code null}
     * @throws UnsetDecimalException (field {@code unknown}) if the value is empty
     * @throws NumberFormatException if the value is non-empty but not a valid decimal
     */
    public static BigDecimal deserializeBigDecimal(DecimalValue.DecimalValueProto quantity) {
        return deserializeBigDecimal(quantity, "unknown");
    }

    /**
     * @return {@code null} if {@code quantity} is {@code null}
     * @throws UnsetDecimalException naming {@code fieldName} if the value is empty
     * @throws NumberFormatException if the value is non-empty but not a valid decimal
     */
    public static BigDecimal deserializeBigDecimal(DecimalValue.DecimalValueProto quantity, String fieldName) {
        if(quantity == null)
            return null;
        if(isUnsetDecimal(quantity))
            throw new UnsetDecimalException(fieldName);

        return new BigDecimal(quantity.getArbitraryPrecisionValue());
    }

    /** True when the date is absent ({@code null}) or year, month and day are all 0. */
    public static boolean isUnsetLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date) {
        return date == null || (date.getYear() == 0 && date.getMonth() == 0 && date.getDay() == 0);
    }

    /**
     * Deserializes a required date. Never substitutes a default.
     *
     * @param date the proto, or {@code null} when the parent has no such field set
     * @throws InvalidFieldException naming {@code fieldName} if the date is unset or invalid
     */
    public static LocalDate deserializeRequiredLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date,
                                                         String fieldName) {
        if (isUnsetLocalDate(date)) throw InvalidFieldException.unset(fieldName);
        return toLocalDate(date, fieldName);
    }

    /**
     * Deserializes an optional date: unset returns {@code null}. A set but
     * invalid date (e.g. month 13) still throws.
     *
     * @throws InvalidFieldException naming {@code fieldName} if the date is set but invalid
     */
    public static LocalDate deserializeOptionalLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date,
                                                         String fieldName) {
        if (isUnsetLocalDate(date)) return null;
        return toLocalDate(date, fieldName);
    }

    /**
     * @deprecated does not know the field name; use
     * {@link #deserializeRequiredLocalDate} or {@link #deserializeOptionalLocalDate}.
     * @throws InvalidFieldException (field {@code unknown}) if the date is unset or invalid
     */
    @Deprecated
    public static LocalDate deserializeLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date) {
        return deserializeRequiredLocalDate(date, "unknown");
    }

    private static LocalDate toLocalDate(fintekkers.models.util.LocalDate.LocalDateProto date, String fieldName) {
        try {
            return LocalDate.of(date.getYear(), date.getMonth(), date.getDay());
        } catch (DateTimeException e) {
            throw new InvalidFieldException(fieldName, "invalid date " + date.getYear() + "-"
                    + date.getMonth() + "-" + date.getDay() + ": " + e.getMessage(), e);
        }
    }


    public static fintekkers.models.util.LocalDate.LocalDateProto serializeLocalDate(LocalDate date) {
        return fintekkers.models.util.LocalDate.LocalDateProto.newBuilder()
                .setYear(date.getYear())
                .setMonth(date.getMonthValue())
                .setDay(date.getDayOfMonth())
                .build();
    }

    /**
     * Deserialize a {@link LocalTimestamp.LocalTimestampProto} into a
     * {@link ZonedDateTime}. Same as {@link #deserializeTimestamp(LocalTimestamp.LocalTimestampProto, String)}
     * with the generic field path {@code local_timestamp}.
     *
     * @throws ModelValidationException (field {@code local_timestamp.time_zone})
     *         if {@code ts.getTimeZone()} is null, empty, or whitespace-only.
     * @throws java.time.DateTimeException if the time_zone string is non-empty
     *         but not a parseable {@link ZoneId}.
     */
    public static ZonedDateTime deserializeTimestamp(LocalTimestamp.LocalTimestampProto ts) {
        return deserializeTimestamp(ts, "local_timestamp");
    }

    /**
     * Deserialize a {@link LocalTimestamp.LocalTimestampProto} into a
     * {@link ZonedDateTime}.
     *
     * <p>Empty/blank {@code time_zone} is rejected with a typed
     * {@link ModelValidationException} naming {@code fieldPath + ".time_zone"}.
     * Previously this method silently returned {@code ZonedDateTime.now(UTC)},
     * which corrupted as-of semantics for every downstream consumer — a
     * missing/malformed timestamp would be served as the current wall-clock
     * time, indistinguishable from a valid record stamped right now. See
     * FinTekkers/second-brain#276 for the original report (surfaced by
     * backend-dev-ledger during #268 verification). Never substitutes a default.
     *
     * <p>Callers that legitimately have an optional/unset timestamp should
     * gate this call with {@code parent.hasAsOf()} (or equivalent) at the
     * call site rather than relying on the helper to substitute a default.
     *
     * @param fieldPath path of the timestamp field, e.g. {@code price.as_of}
     * @throws ModelValidationException if {@code ts.getTimeZone()} is null, empty,
     *         or whitespace-only.
     * @throws java.time.DateTimeException if the time_zone string is non-empty
     *         but not a parseable {@link ZoneId}.
     */
    public static ZonedDateTime deserializeTimestamp(LocalTimestamp.LocalTimestampProto ts, String fieldPath) {
        String timeZone = ts.getTimeZone();
        if (timeZone == null || timeZone.isBlank()) {
            String field = fieldPath + ".time_zone";
            throw new ModelValidationException(List.of(ModelValidationException.violation(
                    field, null,
                    field + " is required but was empty (LocalTimestampProto.time_zone is required). "
                    + "Producers must set time_zone (e.g. \"UTC\" or \"America/New_York\") "
                    + "when populating LocalTimestampProto. See second-brain#276.")));
        }

        ZoneId zoneId = ZoneId.of(timeZone);

        LocalDateTime localDateTime = Instant.ofEpochSecond(
                ts.getTimestamp().getSeconds(), ts.getTimestamp().getNanos())
                .atZone(ZoneOffset.UTC)
                .toLocalDateTime();

        return ZonedDateTime.of(localDateTime, zoneId);
    }

    /**
     * Deserializes a required timestamp. Never substitutes a default.
     *
     * @param ts the proto, or {@code null} when the parent has no such field set
     * @param fieldPath path of the timestamp field, e.g. {@code price.as_of}
     * @throws ModelValidationException naming {@code fieldPath} if {@code ts} is
     *         null, or {@code fieldPath + ".time_zone"} if its time_zone is blank
     */
    public static ZonedDateTime deserializeRequiredTimestamp(LocalTimestamp.LocalTimestampProto ts,
                                                             String fieldPath) {
        if (ts == null) {
            throw new ModelValidationException(List.of(ModelValidationException.violation(
                    fieldPath, null, fieldPath + " is required but unset")));
        }
        return deserializeTimestamp(ts, fieldPath);
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
