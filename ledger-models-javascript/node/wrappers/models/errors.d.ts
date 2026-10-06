import { FieldViolationProto } from '../../fintekkers/requests/util/errors/field_violation_pb';
import { UUID } from './utils/uuid';
/**
 * Typed input error: the object handed to ledger-models has one or more bad
 * or missing fields. JS counterpart of Java's ModelValidationException
 * (docs/adr/typed-input-errors.md). Services map it to gRPC INVALID_ARGUMENT
 * and can put `violations` as-is into ErrorProto.violations.
 */
export declare class ModelValidationError extends Error {
    readonly violations: ReadonlyArray<FieldViolationProto>;
    /** @param violations non-empty list of the field-level problems found */
    constructor(violations: FieldViolationProto[]);
    /** Field path of the first violation, e.g. `bond_details.coupon_rate`. */
    get field(): string;
    /** UUID string of the object that owns the first bad field, or undefined if unset. */
    get objectId(): string | undefined;
}
/** Builds one violation. `objectId` may be undefined when the input had no UUID. */
export declare function violation(field: string, objectId: UUID | undefined, message: string): FieldViolationProto;
