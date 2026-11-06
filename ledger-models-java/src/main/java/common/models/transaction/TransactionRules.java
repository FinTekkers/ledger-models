package common.models.transaction;

import common.models.errors.ModelValidationException;
import common.models.security.SecurityRules;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Field-level input rules for a transaction (LM-255). The shared
 * {@link SecurityRules} apply to the transaction's inline security, with
 * field paths prefixed {@code security.}; {@code object_id} stays the
 * security's UUID.
 *
 * <p>Child structure (LM-438), checked at every level of
 * {@code child_transactions}: at most one cash child, and no two children with
 * the same UUID. Each violation is on {@code child_transactions[i]} (nested:
 * {@code child_transactions[1].child_transactions[0]}) and its
 * {@code object_id} is the UUID of the transaction that owns the list. A child
 * with no UUID, or an empty one, is never a duplicate. The parent link is not
 * in the proto, so {@link Transaction#addChildTransaction} checks it instead.
 *
 * <p>Pure: a link security is not fetched, so it yields no violations and a
 * child whose security is a link is not counted as cash. Hydrate the
 * transaction first to have its security checked.
 */
public final class TransactionRules {
    public static final String SECURITY_PREFIX = "security.";
    public static final String CHILD_TRANSACTIONS = "child_transactions";
    /** Message prefix of the second-cash-child violation, the same in every language. */
    public static final String SECOND_CASH_CHILD = "second cash child";
    /** Message prefix of the repeated-child-ID violation, the same in every language. */
    public static final String DUPLICATE_CHILD_ID = "duplicate child id";

    private TransactionRules() {}

    /** Returns every field-level violation on this transaction, or an empty list when it is valid. */
    public static List<FieldViolationProto> validate(TransactionProto proto) {
        Objects.requireNonNull(proto, "TransactionProto must not be null");
        List<FieldViolationProto> out = new ArrayList<>();
        if (proto.hasSecurity()) {
            for (FieldViolationProto v : SecurityRules.validate(proto.getSecurity())) {
                out.add(v.toBuilder().setField(SECURITY_PREFIX + v.getField()).build());
            }
        }
        addChildViolations(proto, "", out);
        return out;
    }

    /** Throws {@link ModelValidationException} carrying every violation if {@link #validate} finds any. */
    public static void requireValid(TransactionProto proto) {
        List<FieldViolationProto> violations = validate(proto);
        if (!violations.isEmpty()) throw new ModelValidationException(violations);
    }

    private static void addChildViolations(TransactionProto parent, String prefix, List<FieldViolationProto> out) {
        UUID parentId = idOf(parent.hasUuid() ? parent.getUuid() : null);
        UUID firstCashId = null;
        boolean seenCash = false;
        Set<UUID> seenIds = new HashSet<>();
        for (int i = 0; i < parent.getChildTransactionsCount(); i++) {
            TransactionProto child = parent.getChildTransactions(i);
            String field = prefix + CHILD_TRANSACTIONS + "[" + i + "]";
            UUID childId = idOf(child.hasUuid() ? child.getUuid() : null);
            if (isCash(child)) {
                if (seenCash) {
                    out.add(ModelValidationException.violation(field, parentId, SECOND_CASH_CHILD
                            + ": transaction " + parentId + " already has cash child " + firstCashId
                            + "; " + childId + " is a second one"));
                } else {
                    seenCash = true;
                    firstCashId = childId;
                }
            }
            if (childId != null && !seenIds.add(childId)) {
                out.add(ModelValidationException.violation(field, parentId, DUPLICATE_CHILD_ID
                        + ": transaction " + parentId + " already has a child with id " + childId));
            }
            addChildViolations(child, field + ".", out);
        }
    }

    /** Same test as {@code Security.isCash()} on an inline security; a link is not cash. */
    private static boolean isCash(TransactionProto child) {
        if (!child.hasSecurity()) return false;
        SecurityProto security = child.getSecurity();
        if (security.getIsLink()) return false;
        return security.getProductType() == ProductTypeProto.CURRENCY || security.hasCashDetails();
    }

    /** The UUID, or null when it is unset or not 16 bytes. */
    private static UUID idOf(UUIDProto uuid) {
        if (uuid == null || uuid.getRawUuid().size() != 16) return null;
        return ProtoSerializationUtil.deserializeUUID(uuid);
    }
}
