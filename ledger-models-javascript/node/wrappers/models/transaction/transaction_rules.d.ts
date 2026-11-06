import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
/**
 * Transaction input rules: JS counterpart of Java's TransactionRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * The security rules run on an inline security, with field paths prefixed
 * `security.`. Child structure (LM-438) is checked at every level of
 * child_transactions: at most one cash child, and no two children with the
 * same UUID. Each violation is on `child_transactions[i]` (nested:
 * `child_transactions[1].child_transactions[0]`) and its object_id is the
 * UUID of the transaction that owns the list. A child with no UUID, or an
 * empty one, is never a duplicate. A child whose security is a link is not
 * counted as cash: hydrate it first. The Transaction wrapper does not call
 * these rules, so stored rows that break them still load; writers call
 * `validate` / `requireValid` before sending.
 */
export declare const SECURITY_PREFIX = "security.";
export declare const CHILD_TRANSACTIONS = "child_transactions";
export declare const SECOND_CASH_CHILD = "second cash child";
export declare const DUPLICATE_CHILD_ID = "duplicate child id";
/** Returns every field-level violation on this transaction, or an empty array when it is valid. */
export declare function validate(proto: TransactionProto): FieldViolationProto[];
/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export declare function requireValid(proto: TransactionProto): void;
