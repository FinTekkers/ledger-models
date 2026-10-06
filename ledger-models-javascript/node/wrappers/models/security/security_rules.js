"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireValid = exports.validate = exports.COUPON_RATE = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
/**
 * Security input rules: JS counterpart of Java's SecurityRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Holds the TBILL coupon rule (LM-258, docs/adr/tbill_coupon_validation.md);
 * LM-255c adds the bond rules Java already has. The Security wrapper does not
 * call these rules, so stored rows that break them still load; writers call
 * `validate` / `requireValid` before saving.
 */
exports.COUPON_RATE = 'bond_details.coupon_rate';
/**
 * Returns every field-level violation on this security, or an empty array
 * when it is valid. A link security returns an empty array: hydrate it first.
 */
function validate(proto) {
    if (proto.getIsLink())
        return [];
    const out = [];
    const coupon = tbillCouponViolation(proto, objectIdOf(proto));
    if (coupon)
        out.push(coupon);
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
/**
 * A TBILL pays no coupon, so coupon_rate must be unset or 0. Uses the
 * explicit product_type only. Units are not checked. A value that does not
 * parse is skipped.
 */
function tbillCouponViolation(proto, id) {
    var _a, _b;
    if (proto.getProductType() !== product_type_pb_1.ProductTypeProto.TBILL)
        return undefined;
    const raw = (_b = (_a = proto.getBondDetails()) === null || _a === void 0 ? void 0 : _a.getCouponRate()) === null || _b === void 0 ? void 0 : _b.getArbitraryPrecisionValue();
    if (!raw)
        return undefined;
    let coupon;
    try {
        coupon = new decimal_js_1.default(raw);
    }
    catch (e) {
        // decimal.js throws "[DecimalError] Invalid argument" on unparseable input.
        return undefined;
    }
    if (!coupon.isFinite() || coupon.isZero())
        return undefined;
    return (0, errors_1.violation)(exports.COUPON_RATE, id, `coupon_rate must be null or 0 for a TBILL: coupon_rate=${raw}`);
}
/** The security's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto) {
    var _a;
    const raw = (_a = proto.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
//# sourceMappingURL=security_rules.js.map