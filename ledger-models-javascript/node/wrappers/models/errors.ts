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
 * valuation input type in hierarchy.json valuation_input_types, or is listed
 * there as unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
 * ModelValidationError, not a state error (docs/adr/valuation_input_types.md).
 */
export class UnmappedProductTypeError extends Error {
    readonly productType: string;
    readonly couponType: string;

    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    constructor(productType: string, couponType: string) {
        super(`No valuation input type for product_type ${productType}, coupon_type ${couponType}`);
        this.name = 'UnmappedProductTypeError';
        this.productType = productType;
        this.couponType = couponType;
    }
}

/**
 * Typed input error: the security's valuation input type requires market data
 * (hierarchy.json valuation_input_types `requires`) that the caller did not
 * supply, e.g. input type `tips` with no `CPI_U`. Thrown by
 * product_inputs.forSecurity and ValuationRequests.typed. Carries one
 * violation on the input type's field, e.g.
 * `tips.cpi` (docs/adr/product_input_builders.md).
 */
export class MissingMarketDataError extends ModelValidationError {
    readonly inputType: string;
    readonly kind: string;

    /**
     * @param inputType the ProductInput.input field, e.g. `tips`
     * @param kind the missing MarketDataKind, e.g. `CPI_U`
     * @param field the input type's field that holds it, e.g. `tips.cpi`
     * @param objectId the security's UUID, or undefined if it has none
     */
    constructor(inputType: string, kind: string, field: string, objectId: UUID | undefined) {
        super([violation(field, objectId, `missing market data ${kind} for input type ${inputType}`)]);
        this.name = 'MissingMarketDataError';
        this.inputType = inputType;
        this.kind = kind;
    }

    /** @deprecated Use inputType. Removed in a later release (LM-418). */
    get arm(): string {
        return this.inputType;
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
