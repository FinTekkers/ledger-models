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
/**
 * Typed input error: the security's product_type (and coupon_type) has no
 * valuation arm in hierarchy.json valuation_arms, or is listed there as
 * unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
 * ModelValidationError, not a state error (docs/adr/valuation_arms.md).
 */
export declare class UnmappedProductTypeError extends Error {
    readonly productType: string;
    readonly couponType: string;
    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    constructor(productType: string, couponType: string);
}
/**
 * Typed input error: the security's valuation arm requires market data
 * (hierarchy.json valuation_arms `requires`) that the caller did not supply,
 * e.g. arm `tips` with no `CPI_U`. Thrown by product_inputs.forSecurity and
 * ValuationRequests.typed. Carries one violation on the arm field, e.g.
 * `tips.cpi` (docs/adr/product_input_builders.md).
 */
export declare class MissingMarketDataError extends ModelValidationError {
    readonly arm: string;
    readonly kind: string;
    /**
     * @param arm the ProductInput.input field, e.g. `tips`
     * @param kind the missing MarketDataKind, e.g. `CPI_U`
     * @param field the arm field that holds it, e.g. `tips.cpi`
     * @param objectId the security's UUID, or undefined if it has none
     */
    constructor(arm: string, kind: string, field: string, objectId: UUID | undefined);
}
/** Builds one violation. `objectId` may be undefined when the input had no UUID. */
export declare function violation(field: string, objectId: UUID | undefined, message: string): FieldViolationProto;
