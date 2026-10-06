"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violation = exports.ModelValidationError = void 0;
const field_violation_pb_1 = require("../../fintekkers/requests/util/errors/field_violation_pb");
const uuid_1 = require("./utils/uuid");
/**
 * Typed input error: the object handed to ledger-models has one or more bad
 * or missing fields. JS counterpart of Java's ModelValidationException
 * (docs/adr/typed-input-errors.md). Services map it to gRPC INVALID_ARGUMENT
 * and can put `violations` as-is into ErrorProto.violations.
 */
class ModelValidationError extends Error {
    /** @param violations non-empty list of the field-level problems found */
    constructor(violations) {
        if (violations.length === 0) {
            throw new Error('ModelValidationError needs at least one violation');
        }
        super(violations
            .map(v => { var _a; return `${v.getField()}: ${v.getMessage()} (id ${(_a = objectIdOf(v)) !== null && _a !== void 0 ? _a : 'null'})`; })
            .join('; '));
        this.name = 'ModelValidationError';
        this.violations = Object.freeze([...violations]);
    }
    /** Field path of the first violation, e.g. `bond_details.coupon_rate`. */
    get field() {
        return this.violations[0].getField();
    }
    /** UUID string of the object that owns the first bad field, or undefined if unset. */
    get objectId() {
        return objectIdOf(this.violations[0]);
    }
}
exports.ModelValidationError = ModelValidationError;
/** Builds one violation. `objectId` may be undefined when the input had no UUID. */
function violation(field, objectId, message) {
    const v = new field_violation_pb_1.FieldViolationProto();
    v.setField(field);
    v.setMessage(message);
    if (objectId)
        v.setObjectId(objectId.toUUIDProto());
    return v;
}
exports.violation = violation;
function objectIdOf(v) {
    const id = v.getObjectId();
    return id ? uuid_1.UUID.fromU8Array(id.getRawUuid_asU8()).toString() : undefined;
}
//# sourceMappingURL=errors.js.map