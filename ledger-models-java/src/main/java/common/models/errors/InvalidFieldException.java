package common.models.errors;

import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;

import java.util.List;

/**
 * Typed input error raised while reading a single proto field: a required
 * field is unset, or a set field holds an invalid value (e.g. a date with
 * month 13). Services map it to gRPC INVALID_ARGUMENT.
 *
 * <p>Distinct from {@link common.models.errors.transaction.TransactionProcessingException}
 * (state errors, FAILED_PRECONDITION). Deliberately not an
 * {@link IllegalArgumentException}, so existing generic catch sites do not
 * absorb it. {@link #getViolations()} gives the same wire shape as
 * {@link ModelValidationException} so services can return either as-is.
 */
public class InvalidFieldException extends RuntimeException {
    private final String fieldName;

    public InvalidFieldException(String fieldName, String message) {
        this(fieldName, message, null);
    }

    public InvalidFieldException(String fieldName, String message, Throwable cause) {
        super(fieldName + ": " + message, cause);
        this.fieldName = fieldName;
    }

    /** A required field that was absent (or set to its all-zero default). */
    public static InvalidFieldException unset(String fieldName) {
        return new InvalidFieldException(fieldName, fieldName + " is required but unset");
    }

    /** Snake_case proto field name, e.g. {@code trade_date}. */
    public String getFieldName() {
        return fieldName;
    }

    /** This error as a single field-level violation. */
    public List<FieldViolationProto> getViolations() {
        return List.of(ModelValidationException.violation(fieldName, null, getMessage()));
    }
}
