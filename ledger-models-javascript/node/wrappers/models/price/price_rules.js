"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireValid = exports.validate = exports.PRICE_TYPE = exports.PRICE = exports.SECURITY = void 0;
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
/**
 * Price input rules (LM-289): JS counterpart of Java's PriceRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Three rules, checked in this order: `security` has a non-empty UUID,
 * `price` has a non-empty arbitrary_precision_value (zero is valid, see the
 * PriceProto comment), and `price_type` is not UNKNOWN_PRICE_TYPE. The price
 * value is not parsed. Never throws on bad or unset input; null or undefined
 * is checked as an empty PriceProto. Unlike security_rules, a link price is
 * not skipped: hydrate it first. The Price wrapper does not call these rules.
 */
exports.SECURITY = 'security';
exports.PRICE = 'price';
exports.PRICE_TYPE = 'price_type';
/** Returns every field-level violation on this price, or an empty array when it is valid. */
function validate(proto) {
    var _a, _b, _c;
    const p = proto !== null && proto !== void 0 ? proto : new price_pb_1.PriceProto();
    const id = objectIdOf(p);
    const out = [];
    if (!((_b = (_a = p.getSecurity()) === null || _a === void 0 ? void 0 : _a.getUuid()) === null || _b === void 0 ? void 0 : _b.getRawUuid_asU8().length)) {
        out.push((0, errors_1.violation)(exports.SECURITY, id, 'security with a non-empty uuid is required'));
    }
    if (!((_c = p.getPrice()) === null || _c === void 0 ? void 0 : _c.getArbitraryPrecisionValue())) {
        out.push((0, errors_1.violation)(exports.PRICE, id, 'price is required'));
    }
    if (p.getPriceType() === price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE) {
        out.push((0, errors_1.violation)(exports.PRICE_TYPE, id, 'price_type must not be UNKNOWN_PRICE_TYPE'));
    }
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
/** The price's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto) {
    var _a;
    const raw = (_a = proto.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
//# sourceMappingURL=price_rules.js.map