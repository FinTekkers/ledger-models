package common.models.errors;

import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Typed input error: the object handed to ledger-models has one or more bad
 * or missing fields. Services map it to gRPC INVALID_ARGUMENT and can put
 * {@link #getViolations()} as-is into {@code ErrorProto.violations}.
 *
 * <p>Distinct from {@link common.models.errors.transaction.TransactionProcessingException},
 * which stays for state errors such as no lots to reduce (FAILED_PRECONDITION).
 * Extends {@link IllegalArgumentException} so existing catch sites keep working.
 * See docs/adr/typed-input-errors.md.
 */
public class ModelValidationException extends IllegalArgumentException {
    private final List<FieldViolationProto> violations;

    /** @param violations non-empty list of the field-level problems found */
    public ModelValidationException(List<FieldViolationProto> violations) {
        super(describe(violations));
        this.violations = List.copyOf(violations);
    }

    /** Builds one violation. {@code objectId} may be null when the input had no UUID. */
    public static FieldViolationProto violation(String field, UUID objectId, String message) {
        FieldViolationProto.Builder b = FieldViolationProto.newBuilder()
                .setField(field)
                .setMessage(message);
        if (objectId != null) b.setObjectId(ProtoSerializationUtil.serializeUUID(objectId));
        return b.build();
    }

    /** Every violation, in the order found. Unmodifiable. */
    public List<FieldViolationProto> getViolations() {
        return violations;
    }

    /** Field path of the first violation, e.g. {@code bond_details.face_value}. */
    public String getField() {
        return violations.get(0).getField();
    }

    /** UUID of the object that owns the first bad field, or null if unset. */
    public UUID getObjectId() {
        return objectIdOf(violations.get(0));
    }

    private static UUID objectIdOf(FieldViolationProto v) {
        return v.hasObjectId() ? ProtoSerializationUtil.deserializeUUID(v.getObjectId()) : null;
    }

    private static String describe(List<FieldViolationProto> violations) {
        Objects.requireNonNull(violations, "violations must not be null");
        if (violations.isEmpty()) {
            throw new IllegalArgumentException("ModelValidationException needs at least one violation");
        }
        return violations.stream()
                .map(v -> v.getField() + ": " + v.getMessage() + " (id " + objectIdOf(v) + ")")
                .collect(Collectors.joining("; "));
    }
}
