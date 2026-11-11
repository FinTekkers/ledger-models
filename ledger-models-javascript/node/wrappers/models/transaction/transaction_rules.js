"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireValid = exports.validate = exports.UNKNOWN_TRADE_PRICE_TYPE = exports.PRICE_PREFIX = exports.DUPLICATE_CHILD_ID = exports.SECOND_CASH_CHILD = exports.CHILD_TRANSACTIONS = exports.SECURITY_PREFIX = void 0;
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const errors_1 = require("../errors");
const price_rules_1 = require("../price/price_rules");
const security_rules_1 = require("../security/security_rules");
const uuid_1 = require("../utils/uuid");
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
 * counted as cash: hydrate it first.
 *
 * Trade price (LM-463): an inline `price` (not is_link) whose raw price_type
 * is UNKNOWN_PRICE_TYPE gives one violation on `price.price_type`, with
 * object_id the price's UUID. Every other value passes, including an
 * unrecognised number. A link price is never checked, and child
 * transactions' prices are not checked. The Transaction wrapper does not call
 * these rules, so stored rows that break them still load; writers call
 * `validate` / `requireValid` before sending.
 */
exports.SECURITY_PREFIX = 'security.';
exports.CHILD_TRANSACTIONS = 'child_transactions';
exports.SECOND_CASH_CHILD = 'second cash child';
exports.DUPLICATE_CHILD_ID = 'duplicate child id';
exports.PRICE_PREFIX = 'price.';
exports.UNKNOWN_TRADE_PRICE_TYPE = 'price_type is UNKNOWN_PRICE_TYPE on an inline trade price';
/** Returns every field-level violation on this transaction, or an empty array when it is valid. */
function validate(proto) {
    const out = [];
    const security = proto.getSecurity();
    if (security) {
        for (const v of (0, security_rules_1.validate)(security)) {
            const prefixed = v.cloneMessage();
            prefixed.setField(exports.SECURITY_PREFIX + v.getField());
            out.push(prefixed);
        }
    }
    addChildViolations(proto, '', out);
    addPriceViolation(proto, out);
    return out;
}
exports.validate = validate;
/** Throws ModelValidationError carrying every violation if `validate` finds any. */
function requireValid(proto) {
    const violations = validate(proto);
    if (violations.length > 0)
        throw new errors_1.ModelValidationError(violations);
}
exports.requireValid = requireValid;
function addChildViolations(parent, prefix, out) {
    const parentId = idOf(parent.getUuid());
    let seenCash = false;
    let firstCashId;
    const seenIds = new Set();
    parent.getChildtransactionsList().forEach((child, i) => {
        const field = `${prefix}${exports.CHILD_TRANSACTIONS}[${i}]`;
        const childId = idOf(child.getUuid());
        if (isCash(child)) {
            if (seenCash) {
                out.push((0, errors_1.violation)(field, parentId, `${exports.SECOND_CASH_CHILD}: transaction ${display(parentId)} already has cash child `
                    + `${display(firstCashId)}; ${display(childId)} is a second one`));
            }
            else {
                seenCash = true;
                firstCashId = childId;
            }
        }
        if (childId) {
            const key = childId.toString();
            if (seenIds.has(key)) {
                out.push((0, errors_1.violation)(field, parentId, `${exports.DUPLICATE_CHILD_ID}: transaction ${display(parentId)} already has a child with id ${key}`));
            }
            seenIds.add(key);
        }
        addChildViolations(child, `${field}.`, out);
    });
}
/** LM-463: an inline trade price must have a price_type; a link price is never checked. */
function addPriceViolation(proto, out) {
    const price = proto.getPrice();
    if (!price || price.getIsLink())
        return;
    // Raw number, so an unrecognised value is not rejected.
    if (price.getPriceType() === price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE) {
        out.push((0, errors_1.violation)(exports.PRICE_PREFIX + price_rules_1.PRICE_TYPE, idOf(price.getUuid()), exports.UNKNOWN_TRADE_PRICE_TYPE));
    }
}
/** Same test as Java Security.isCash() on an inline security; a link is not cash. */
function isCash(child) {
    const security = child.getSecurity();
    if (!security || security.getIsLink())
        return false;
    return security.getProductType() === product_type_pb_1.ProductTypeProto.CURRENCY || security.hasCashDetails();
}
/** The UUID, or undefined when it is unset or not 16 bytes. */
function idOf(uuid) {
    const raw = uuid === null || uuid === void 0 ? void 0 : uuid.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
function display(id) {
    return id ? id.toString() : 'null';
}
//# sourceMappingURL=transaction_rules.js.map