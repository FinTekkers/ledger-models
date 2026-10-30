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

/**
 * Typed input error: the security's product_type (and coupon_type) has no
 * valuation arm in hierarchy.json valuation_arms, or is listed there as
 * unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
 * ModelValidationError, not a state error (docs/adr/valuation_arms.md).
 */
export class UnmappedProductTypeError extends Error {
    readonly productType: string;
    readonly couponType: string;

    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    constructor(productType: string, couponType: string) {
        super(`No valuation arm for product_type ${productType}, coupon_type ${couponType}`);
        this.name = 'UnmappedProductTypeError';
        this.productType = productType;
        this.couponType = couponType;
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
    const raw = v.getObjectId()?.getRawUuid_asU8();
    // A malformed id must not stop the error for another field being built (LM-334).
    return raw && raw.length === 16 ? UUID.fromU8Array(raw).toString() : undefined;
}
