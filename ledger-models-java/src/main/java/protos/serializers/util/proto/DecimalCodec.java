package protos.serializers.util.proto;

import com.google.protobuf.ByteString;
import common.models.errors.InvalidDecimalException;
import fintekkers.models.util.DecimalValue.DecimalValueProto;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;

/**
 * Codec for {@code DecimalValueProto} (LM-294, docs/adr/compact_decimal.md).
 * Mirrors ledger-models-rust {@code wrappers/models/utils/decimal.rs}.
 *
 * <p>value = unscaled_value x 10^-scale, where unscaled_value is a minimal
 * two's-complement big-endian integer of any size. A non-empty unscaled_value
 * means the compact form is set and it wins. Otherwise the deprecated
 * {@code arbitrary_precision_value} string is read, with a warning logged once
 * per process (LM-307).
 *
 * <p>Lossless: no binary floating point on any path. A value that cannot be
 * represented exactly is an {@link InvalidDecimalException}, never rounded.
 *
 * <p>Stage 1: writers set both forms, so readers on older ledger-models keep
 * working. This class is the only code allowed to touch the deprecated string
 * field. Package-private: callers use {@link ProtoSerializationUtil}.
 */
@SuppressWarnings("deprecation") // The one place that reads and writes field 10.
final class DecimalCodec {

    /** Most decimal digits in the unscaled value, and the largest scale. Same in every language. */
    static final int MAX_DIGITS = 4096;
    static final long MAX_SCALE = 4096;
    /** A minimal unscaled_value longer than this always has more than MAX_DIGITS digits. */
    static final int MAX_UNSCALED_BYTES = 1702;

    /** The library release that first writes the compact form. */
    private static final String FIRST_COMPACT_RELEASE = "v0.4.34";

    /** The smallest magnitude with MAX_DIGITS + 1 digits. */
    private static final BigInteger DIGITS_LIMIT = BigInteger.TEN.pow(MAX_DIGITS);

    private static final Logger LOG = Logger.getLogger(DecimalCodec.class.getName());
    private static final AtomicBoolean WARNED = new AtomicBoolean(false);

    private DecimalCodec() {}

    /**
     * Encodes both forms (stage 1): fields 11 and 12, plus the canonical plain
     * string in field 10 for readers on ledger-models older than v0.4.34. A
     * negative scale becomes scale 0 ({@code 1E+3} is unscaled 1000).
     *
     * @throws InvalidDecimalException if the value is over the digit or scale cap
     */
    static DecimalValueProto encode(BigDecimal v) {
        BigDecimal value = v;
        if (value.scale() < 0) {
            // Digits after appending -scale zeros, checked before allocating them.
            long digits = value.signum() == 0 ? 1 : (long) value.precision() - value.scale();
            if (digits > MAX_DIGITS) throw overCap(value.toString());
            value = value.setScale(0);
        }
        if (value.scale() > MAX_SCALE || value.unscaledValue().abs().compareTo(DIGITS_LIMIT) >= 0) {
            throw overCap(value.toString());
        }
        return DecimalValueProto.newBuilder()
                .setArbitraryPrecisionValue(value.toPlainString())
                .setUnscaledValue(ByteString.copyFrom(value.unscaledValue().toByteArray()))
                .setScale(value.scale())
                .build();
    }

    /**
     * Decodes a {@code DecimalValueProto}. The compact form wins when set.
     * Otherwise falls back to the deprecated string and logs a deprecation
     * warning, once per process.
     *
     * @throws InvalidDecimalException if both forms are empty, or the value is malformed or over a cap
     */
    static BigDecimal decode(DecimalValueProto p) {
        if (!p.getUnscaledValue().isEmpty()) {
            return decodeCompact(p.getUnscaledValue(), Integer.toUnsignedLong(p.getScale()));
        }
        if (p.getArbitraryPrecisionValue().isEmpty()) {
            throw new InvalidDecimalException("decimal is required but unset");
        }
        warnOnce();
        return parseStrict(p.getArbitraryPrecisionValue());
    }

    /** True when the proto is {@code null} or neither form is set. */
    static boolean isUnset(DecimalValueProto p) {
        return p == null || (p.getUnscaledValue().isEmpty() && p.getArbitraryPrecisionValue().isEmpty());
    }

    /**
     * Decodes fields 11 and 12. Rejects a scale over MAX_SCALE, bytes over
     * MAX_UNSCALED_BYTES or more than MAX_DIGITS digits, before any large allocation.
     */
    private static BigDecimal decodeCompact(ByteString unscaledValue, long scale) {
        if (scale > MAX_SCALE) {
            throw new InvalidDecimalException(
                    "decimal has scale " + scale + ", over the limit of " + MAX_SCALE);
        }
        if (unscaledValue.size() > MAX_UNSCALED_BYTES) {
            throw new InvalidDecimalException("decimal has a " + unscaledValue.size()
                    + "-byte unscaled_value, over the limit of " + MAX_UNSCALED_BYTES + " bytes");
        }
        BigInteger unscaled = new BigInteger(unscaledValue.toByteArray());
        if (unscaled.abs().compareTo(DIGITS_LIMIT) >= 0) {
            throw new InvalidDecimalException("decimal has more than " + MAX_DIGITS + " digits");
        }
        return new BigDecimal(unscaled, (int) scale);
    }

    /**
     * Parses a decimal string, as written to {@code arbitrary_precision_value}.
     *
     * <p>Grammar: {@code [+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?}.
     * No whitespace, no {@code NaN} or {@code Infinity}. The exponent is folded
     * into the scale; a negative scale becomes scale 0. Caps are checked before
     * the value is built, so {@code 1E+5000} never allocates 5000 digits.
     *
     * @throws InvalidDecimalException if malformed or over a cap
     */
    static BigDecimal parseStrict(String s) {
        int n = s.length();
        int i = 0;
        boolean negative = false;
        if (i < n && (s.charAt(i) == '-' || s.charAt(i) == '+')) {
            negative = s.charAt(i) == '-';
            i++;
        }
        int intStart = i;
        while (i < n && isDigit(s.charAt(i))) i++;
        String intDigits = s.substring(intStart, i);
        String fracDigits = "";
        if (i < n && s.charAt(i) == '.') {
            i++;
            int fracStart = i;
            while (i < n && isDigit(s.charAt(i))) i++;
            fracDigits = s.substring(fracStart, i);
        }
        if (intDigits.isEmpty() && fracDigits.isEmpty()) throw notADecimal(s);

        long exponent = 0;
        if (i < n && (s.charAt(i) == 'e' || s.charAt(i) == 'E')) {
            i++;
            boolean expNegative = false;
            if (i < n && (s.charAt(i) == '-' || s.charAt(i) == '+')) {
                expNegative = s.charAt(i) == '-';
                i++;
            }
            int expStart = i;
            while (i < n && isDigit(s.charAt(i))) i++;
            if (i == expStart) throw notADecimal(s);
            String expDigits = stripLeadingZeros(s.substring(expStart, i));
            // Any exponent this long is far past the caps below.
            if (expDigits.length() > 12) throw overCap(s);
            long magnitude = expDigits.isEmpty() ? 0 : Long.parseLong(expDigits);
            exponent = expNegative ? -magnitude : magnitude;
        }
        if (i != n) throw notADecimal(s);

        String significant = stripLeadingZeros(intDigits + fracDigits);
        long scale = fracDigits.length() - exponent;
        if (significant.isEmpty()) {
            // Zero keeps its scale ("0.00" is scale 2); "0E+3" is scale 0. Zero has no sign.
            long zeroScale = Math.max(scale, 0);
            if (zeroScale > MAX_SCALE) throw overCap(s);
            return BigDecimal.valueOf(0, (int) zeroScale);
        }
        long zerosToAppend = scale < 0 ? -scale : 0;
        if (scale > MAX_SCALE || significant.length() + zerosToAppend > MAX_DIGITS) throw overCap(s);
        StringBuilder text = new StringBuilder(significant.length() + (int) zerosToAppend + 1);
        if (negative) text.append('-');
        text.append(significant);
        for (long z = 0; z < zerosToAppend; z++) text.append('0');
        return new BigDecimal(new BigInteger(text.toString()), (int) Math.max(scale, 0));
    }

    /** Logs that a decimal was read from the deprecated string, the first time only in this process. */
    private static void warnOnce() {
        if (WARNED.compareAndSet(false, true)) {
            LOG.warning("DecimalValueProto read from deprecated arbitrary_precision_value; "
                    + "writer predates ledger-models " + FIRST_COMPACT_RELEASE);
        }
    }

    /** Tests only: lets a test see the first warning again. */
    static void resetDeprecationWarningForTest() {
        WARNED.set(false);
    }

    private static boolean isDigit(char c) {
        return c >= '0' && c <= '9';
    }

    private static String stripLeadingZeros(String digits) {
        int k = 0;
        while (k < digits.length() && digits.charAt(k) == '0') k++;
        return digits.substring(k);
    }

    private static InvalidDecimalException notADecimal(String s) {
        return new InvalidDecimalException("decimal is not a finite decimal: \"" + preview(s) + "\"");
    }

    private static InvalidDecimalException overCap(String s) {
        return new InvalidDecimalException("decimal is over the limit of " + MAX_DIGITS
                + " digits or scale " + MAX_SCALE + ": \"" + preview(s) + "\"");
    }

    /** At most the first 64 characters of {@code s}, for error messages. */
    private static String preview(String s) {
        return s.length() <= 64 ? s : s.substring(0, 64);
    }
}
