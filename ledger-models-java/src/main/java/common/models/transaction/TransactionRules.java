package common.models.transaction;

import common.models.errors.ModelValidationException;
import common.models.security.SecurityRules;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Field-level input rules for a transaction (LM-255). Today these are the
 * shared {@link SecurityRules} applied to the transaction's inline security,
 * with field paths prefixed {@code security.}; {@code object_id} stays the
 * security's UUID.
 *
 * <p>Pure: a link security is not fetched, so it yields no violations.
 * Hydrate the transaction first to have its security checked.
 */
public final class TransactionRules {
    public static final String SECURITY_PREFIX = "security.";

    private TransactionRules() {}

    /** Returns every field-level violation on this transaction, or an empty list when it is valid. */
    public static List<FieldViolationProto> validate(TransactionProto proto) {
        Objects.requireNonNull(proto, "TransactionProto must not be null");
        List<FieldViolationProto> out = new ArrayList<>();
        if (!proto.hasSecurity()) return out;
        for (FieldViolationProto v : SecurityRules.validate(proto.getSecurity())) {
            out.add(v.toBuilder().setField(SECURITY_PREFIX + v.getField()).build());
        }
        return out;
    }

    /** Throws {@link ModelValidationException} carrying every violation if {@link #validate} finds any. */
    public static void requireValid(TransactionProto proto) {
        List<FieldViolationProto> violations = validate(proto);
        if (!violations.isEmpty()) throw new ModelValidationException(violations);
    }
}
