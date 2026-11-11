"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violation = exports.NoDefaultPriceTypeError = exports.MissingMarketDataError = exports.UnmappedProductTypeError = exports.ModelValidationError = void 0;
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
 * valuation input type in hierarchy.json valuation_input_types, or is listed
 * there as unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
 * ModelValidationError, not a state error (docs/adr/valuation_input_types.md).
 */
class UnmappedProductTypeError extends Error {
    /** @param productType ProductTypeProto name; @param couponType CouponTypeProto name */
    constructor(productType, couponType) {
        super(`No valuation input type for product_type ${productType}, coupon_type ${couponType}`);
        this.name = 'UnmappedProductTypeError';
        this.productType = productType;
        this.couponType = couponType;
    }
}
exports.UnmappedProductTypeError = UnmappedProductTypeError;
/**
 * Typed input error: the security's valuation input type requires market data
 * (hierarchy.json valuation_input_types `requires`) that the caller did not
 * supply, e.g. input type `tips` with no `CPI_U`. Thrown by
 * product_inputs.forSecurity and ValuationRequests.typed. Carries one
 * violation on the input type's field, e.g.
 * `tips.cpi` (docs/adr/product_input_builders.md).
 */
class MissingMarketDataError extends ModelValidationError {
    /**
     * @param inputType the ProductInput.input field, e.g. `tips`
     * @param kind the missing MarketDataKind, e.g. `CPI_U`
     * @param field the input type's field that holds it, e.g. `tips.cpi`
     * @param objectId the security's UUID, or undefined if it has none
     */
    constructor(inputType, kind, field, objectId) {
        super([violation(field, objectId, `missing market data ${kind} for input type ${inputType}`)]);
        this.name = 'MissingMarketDataError';
        this.inputType = inputType;
        this.kind = kind;
    }
    /** @deprecated Use inputType. Removed in a later release (LM-418). */
    get arm() {
        return this.inputType;
    }
}
exports.MissingMarketDataError = MissingMarketDataError;
/**
 * Typed input error: a trade price is being built with no price_type and the
 * security's product_type has no entry (on its parent chain) in
 * hierarchy.json default_price_types, e.g. FX_SPOT. Thrown by the Transaction
 * params constructor before anything is built. Carries one violation on
 * `price.price_type` whose object id is the security's UUID
 * (docs/adr/default_price_types.md).
 */
class NoDefaultPriceTypeError extends ModelValidationError {
    /**
     * @param productType the ProductTypeProto name, e.g. `FX_SPOT`
     * @param objectId the security's UUID, or undefined if it has none
     */
    constructor(productType, objectId) {
        super([violation('price.price_type', objectId, `no default price_type for product_type ${productType} in hierarchy.json default_price_types; pass price_type`)]);
        this.name = 'NoDefaultPriceTypeError';
        this.productType = productType;
    }
}
exports.NoDefaultPriceTypeError = NoDefaultPriceTypeError;
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