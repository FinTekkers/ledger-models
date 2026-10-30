"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violation = exports.MissingMarketDataError = exports.UnmappedProductTypeError = exports.ModelValidationError = void 0;
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
/**
 * Typed input error: the security's product_type (and coupon_type) has no
 * valuation arm in hierarchy.json valuation_arms, or is listed there as
 * unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
 * ModelValidationError, not a state error (docs/adr/valuation_arms.md).
 */
class UnmappedProductTypeError extends Error {
    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    constructor(productType, couponType) {
        super(`No valuation arm for product_type ${productType}, coupon_type ${couponType}`);
        this.name = 'UnmappedProductTypeError';
        this.productType = productType;
        this.couponType = couponType;
    }
}
exports.UnmappedProductTypeError = UnmappedProductTypeError;
/**
 * Typed input error: the security's valuation arm requires market data
 * (hierarchy.json valuation_arms `requires`) that the caller did not supply,
 * e.g. arm `tips` with no `CPI_U`. Thrown by product_inputs.forSecurity and
 * ValuationRequests.typed. Carries one violation on the arm field, e.g.
 * `tips.cpi` (docs/adr/product_input_builders.md).
 */
class MissingMarketDataError extends ModelValidationError {
    /**
     * @param arm the ProductInput.input field, e.g. `tips`
     * @param kind the missing MarketDataKind, e.g. `CPI_U`
     * @param field the arm field that holds it, e.g. `tips.cpi`
     * @param objectId the security's UUID, or undefined if it has none
     */
    constructor(arm, kind, field, objectId) {
        super([violation(field, objectId, `missing market data ${kind} for arm ${arm}`)]);
        this.name = 'MissingMarketDataError';
        this.arm = arm;
        this.kind = kind;
    }
}
exports.MissingMarketDataError = MissingMarketDataError;
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
    var _a;
    const raw = (_a = v.getObjectId()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    // A malformed id must not stop the error for another field being built (LM-334).
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw).toString() : undefined;
}
//# sourceMappingURL=errors.js.map