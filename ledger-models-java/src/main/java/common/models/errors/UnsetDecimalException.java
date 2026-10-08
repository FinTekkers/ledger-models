package common.models.errors;

/**
 * Typed input error raised when a {@code DecimalValueProto} is set but its
 * {@code arbitrary_precision_value} is empty, so there is no number to parse.
 * Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Deliberately an {@link IllegalArgumentException} and not a
 * {@link NumberFormatException}: existing {@code catch (NumberFormatException)}
 * blocks do not swallow it, and callers can catch it by name. Note this differs
 * from {@link InvalidFieldException}, which is deliberately not an
 * {@link IllegalArgumentException}; aligning the two is a separate decision.
 *
 * <p>Callers that treat an empty decimal as absent can check first with
 * {@link protos.serializers.util.proto.ProtoSerializationUtil#isUnsetDecimal}.
 */
public class UnsetDecimalException extends IllegalArgumentException {
    private final String fieldName;

    /**
     * @param fieldName the proto field holding the decimal, e.g. {@code price};
     *                  {@code unknown} when the caller did not supply one
     */
    public UnsetDecimalException(String fieldName) {
        super(fieldName + ": decimal value is unset (empty arbitrary_precision_value)");
        this.fieldName = fieldName;
    }

    /** Snake_case proto field name, e.g. {@code price}, or {@code unknown}. */
    public String getFieldName() {
        return fieldName;
    }
}
