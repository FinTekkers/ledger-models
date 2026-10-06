import { FieldViolationProto } from '../../fintekkers/requests/util/errors/field_violation_pb';
import { UUID } from './utils/uuid';

/**
 * Typed input error: the object handed to ledger-models has one or more bad
 * or missing fields. JS counterpart of Java's ModelValidationException
 * (docs/adr/typed-input-errors.md). Services map it to gRPC INVALID_ARGUMENT
 * and can put `violations` as-is into ErrorProto.violations.
 */
export class ModelValidationError extends Error {
    readonly violations: ReadonlyArray<FieldViolationProto>;

    /** @param violations non-empty list of the field-level problems found */
    constructor(violations: FieldViolationProto[]) {
        if (violations.length === 0) {
            throw new Error('ModelValidationError needs at least one violation');
        }
        super(violations
            .map(v => `${v.getField()}: ${v.getMessage()} (id ${objectIdOf(v) ?? 'null'})`)
            .join('; '));
        this.name = 'ModelValidationError';
        this.violations = Object.freeze([...violations]);
    }

    /** Field path of the first violation, e.g. `bond_details.coupon_rate`. */
    get field(): string {
        return this.violations[0].getField();
    }

    /** UUID string of the object that owns the first bad field, or undefined if unset. */
    get objectId(): string | undefined {
        return objectIdOf(this.violations[0]);
    }
}

/** Builds one violation. `objectId` may be undefined when the input had no UUID. */
export function violation(field: string, objectId: UUID | undefined, message: string): FieldViolationProto {
    const v = new FieldViolationProto();
    v.setField(field);
    v.setMessage(message);
    if (objectId) v.setObjectId(objectId.toUUIDProto());
    return v;
}

function objectIdOf(v: FieldViolationProto): string | undefined {
    const id = v.getObjectId();
    return id ? UUID.fromU8Array(id.getRawUuid_asU8()).toString() : undefined;
}
