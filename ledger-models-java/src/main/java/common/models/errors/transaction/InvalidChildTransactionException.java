package common.models.errors.transaction;

import common.models.errors.ModelValidationException;

import java.util.List;
import java.util.UUID;

/**
 * Typed input error (LM-438): a child cannot be added to a transaction. Thrown
 * by {@link common.models.transaction.Transaction#addChildTransaction} when the
 * child would be a second cash child, repeats an existing child's ID, or
 * belongs to another transaction. Carries one violation on
 * {@code child_transactions} whose {@code object_id} is the parent's UUID.
 *
 * <p>An input error, not a {@link TransactionProcessingException}: services
 * map it to INVALID_ARGUMENT. Loading a stored transaction never throws it.
 * See docs/adr/typed-input-errors.md.
 */
public class InvalidChildTransactionException extends ModelValidationException {
    public static final String CHILD_TRANSACTIONS = "child_transactions";

    private final UUID parentId;
    private final UUID childId;
    private final UUID otherId;

    private InvalidChildTransactionException(UUID parentId, UUID childId, UUID otherId, String message) {
        super(List.of(violation(CHILD_TRANSACTIONS, parentId, message)));
        this.parentId = parentId;
        this.childId = childId;
        this.otherId = otherId;
    }

    /** The parent already has cash child {@code existingCashId}; {@code newCashId} would be a second one. */
    public static InvalidChildTransactionException secondCash(UUID parentId, UUID existingCashId, UUID newCashId) {
        return new InvalidChildTransactionException(parentId, newCashId, existingCashId,
                "transaction " + parentId + " already has a cash impact " + existingCashId
                        + "; cannot add second cash child " + newCashId);
    }

    /** The parent already has a child with ID {@code childId}. */
    public static InvalidChildTransactionException duplicateId(UUID parentId, UUID childId) {
        return new InvalidChildTransactionException(parentId, childId, childId,
                "transaction " + parentId + " already has a child with id " + childId);
    }

    /** The child's parent link points to {@code childsParentId}, not to this parent. */
    public static InvalidChildTransactionException wrongParent(UUID parentId, UUID childId, UUID childsParentId) {
        return new InvalidChildTransactionException(parentId, childId, childsParentId,
                "child " + childId + " belongs to transaction " + childsParentId
                        + ", not to transaction " + parentId);
    }

    /** UUID of the transaction the child was being added to. */
    public UUID getParentId() {
        return parentId;
    }

    /** UUID of the child that was refused. */
    public UUID getChildId() {
        return childId;
    }

    /**
     * The other UUID named in the message: the existing cash child for
     * {@link #secondCash}, the repeated ID for {@link #duplicateId}, the
     * child's own parent for {@link #wrongParent}.
     */
    public UUID getOtherId() {
        return otherId;
    }
}
