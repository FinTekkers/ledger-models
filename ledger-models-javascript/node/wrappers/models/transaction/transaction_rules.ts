import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
import { ModelValidationError, violation } from '../errors';
import { validate as validateSecurity } from '../security/security_rules';
import { UUID } from '../utils/uuid';

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

export const SECURITY_PREFIX = 'security.';
export const CHILD_TRANSACTIONS = 'child_transactions';
export const SECOND_CASH_CHILD = 'second cash child';
export const DUPLICATE_CHILD_ID = 'duplicate child id';

/** Returns every field-level violation on this transaction, or an empty array when it is valid. */
export function validate(proto: TransactionProto): FieldViolationProto[] {
    const out: FieldViolationProto[] = [];
    const security = proto.getSecurity();
    if (security) {
        for (const v of validateSecurity(security)) {
            const prefixed = v.cloneMessage();
            prefixed.setField(SECURITY_PREFIX + v.getField());
            out.push(prefixed);
        }
    }
    addChildViolations(proto, '', out);
    return out;
}

/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export function requireValid(proto: TransactionProto): void {
    const violations = validate(proto);
    if (violations.length > 0) throw new ModelValidationError(violations);
}

function addChildViolations(parent: TransactionProto, prefix: string, out: FieldViolationProto[]): void {
    const parentId = idOf(parent);
    let seenCash = false;
    let firstCashId: UUID | undefined;
    const seenIds = new Set<string>();
    parent.getChildtransactionsList().forEach((child, i) => {
        const field = `${prefix}${CHILD_TRANSACTIONS}[${i}]`;
        const childId = idOf(child);
        if (isCash(child)) {
            if (seenCash) {
                out.push(violation(field, parentId,
                    `${SECOND_CASH_CHILD}: transaction ${display(parentId)} already has cash child `
                    + `${display(firstCashId)}; ${display(childId)} is a second one`));
            } else {
                seenCash = true;
                firstCashId = childId;
            }
        }
        if (childId) {
            const key = childId.toString();
            if (seenIds.has(key)) {
                out.push(violation(field, parentId,
                    `${DUPLICATE_CHILD_ID}: transaction ${display(parentId)} already has a child with id ${key}`));
            }
            seenIds.add(key);
        }
        addChildViolations(child, `${field}.`, out);
    });
}

/** Same test as Java Security.isCash() on an inline security; a link is not cash. */
function isCash(child: TransactionProto): boolean {
    const security = child.getSecurity();
    if (!security || security.getIsLink()) return false;
    return security.getProductType() === ProductTypeProto.CURRENCY || security.hasCashDetails();
}

/** The transaction's UUID, or undefined when it has none or it is not 16 bytes. */
function idOf(proto: TransactionProto): UUID | undefined {
    const raw = proto.getUuid()?.getRawUuid_asU8();
    return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}

function display(id: UUID | undefined): string {
    return id ? id.toString() : 'null';
}
