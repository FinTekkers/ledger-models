package testutil;

import fintekkers.models.util.DecimalValue.DecimalValueProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;

/** Decimal helpers for tests: build a DecimalValueProto from a string and read it back. */
public final class Decimals {

    private Decimals() {
    }

    /** The DecimalValueProto for {@code value}, keeping its scale: "1.50" is unscaled 150, scale 2. */
    public static DecimalValueProto decimal(String value) {
        return ProtoSerializationUtil.serializeBigDecimal(new BigDecimal(value));
    }

    /** The plain string of {@code d}, keeping its scale: "98.50" stays "98.50". */
    public static String text(DecimalValueProto d) {
        return ProtoSerializationUtil.deserializeBigDecimal(d).toPlainString();
    }
}
