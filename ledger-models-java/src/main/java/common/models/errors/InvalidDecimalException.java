package common.models.errors;

/**
 * Typed input error raised when a {@code DecimalValueProto} or a decimal
 * string is malformed, or over the limits of 4096 digits, scale 4096 or a
 * 1702-byte unscaled value (LM-294). Never rounded instead. Services map it
 * to gRPC INVALID_ARGUMENT.
 *
 * <p>Carries no field name: decoding takes only the proto, as in Rust
 * (LM-307). A caller that knows the field names it in its own violation.
 *
 * <p>An {@link IllegalArgumentException}, like {@link UnsetDecimalException},
 * so existing {@code catch (IllegalArgumentException)} blocks still catch it.
 */
public class InvalidDecimalException extends IllegalArgumentException {
    public InvalidDecimalException(String reason) {
        super(reason);
    }
}
