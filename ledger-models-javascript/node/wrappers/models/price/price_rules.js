"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireValid = exports.validate = exports.PRICE_TYPE = exports.PRICE = exports.ASK = exports.BID = exports.MID = exports.SECURITY = void 0;
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
const decimal_1 = require("../utils/decimal");
/**
 * Price input rules (LM-289): JS counterpart of Java's PriceRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Rules, checked in this order: `security` has a non-empty UUID; at least
 * one of mid, bid and ask has a non-empty unscaled_value (zero is valid, see
 * the PriceProto comment), else a violation on `mid`; when bid and ask are
 * both set, ask >= bid, else a violation on `ask` (LM-508); and `price_type`
 * is not UNKNOWN_PRICE_TYPE. Only bid and ask are parsed, for the
 * comparison; an unreadable one skips it. Never throws on bad or unset
 * input; null or undefined is checked as an empty PriceProto. Unlike
 * security_rules, a link price is not skipped: hydrate it first. The Price
 * wrapper does not call these rules.
 */
exports.SECURITY = 'security';
/** LM-508: field 10, named `price` before. */
exports.MID = 'mid';
exports.BID = 'bid';
exports.ASK = 'ask';
/** @deprecated LM-508 renamed field 10 to `mid`; use MID. */
exports.PRICE = exports.MID;
exports.PRICE_TYPE = 'price_type';
/** Returns every field-level violation on this price, or an empty array when it is valid. */
function validate(proto) {
    var _a, _b;
    const p = proto !== null && proto !== void 0 ? proto : new price_pb_1.PriceProto();
    const id = objectIdOf(p);
    const out = [];
    if (!((_b = (_a = p.getSecurity()) === null || _a === void 0 ? void 0 : _a.getUuid()) === null || _b === void 0 ? void 0 : _b.getRawUuid_asU8().length)) {
        out.push((0, errors_1.violation)(exports.SECURITY, id, 'security with a non-empty uuid is required'));
    }
    const mid = setOrUndefined(p.getMid());
    const bid = setOrUndefined(p.getBid());
    const ask = setOrUndefined(p.getAsk());
    if (!mid && !bid && !ask) {
        out.push((0, errors_1.violation)(exports.MID, id, 'one of mid, bid or ask is required'));
    }
    if (bid && ask && isBelow(ask, bid)) {
        out.push((0, errors_1.violation)(exports.ASK, id, 'ask must not be less than bid'));
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
function setOrUndefined(p) {
    return p && !(0, decimal_1.isUnsetDecimal)(p) ? p : undefined;
}
/** True when ask < bid; false when either is unreadable, so validate never throws. */
function isBelow(ask, bid) {
    let a;
    let b;
    try {
        a = (0, decimal_1.decodeDecimal)(ask);
        b = (0, decimal_1.decodeDecimal)(bid);
    }
    catch (e) {
        if (e instanceof errors_1.ModelValidationError)
            return false;
        throw e;
    }
    const scale = Math.max(a.scale, b.scale);
    const TEN = BigInt(10);
    return a.unscaled * TEN ** BigInt(scale - a.scale) < b.unscaled * TEN ** BigInt(scale - b.scale);
}
/** The price's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto) {
    var _a;
    const raw = (_a = proto.getUuid()) === null || _a === void 0 ? void 0 : _a.getRawUuid_asU8();
    return raw && raw.length === 16 ? uuid_1.UUID.fromU8Array(raw) : undefined;
}
//# sourceMappingURL=price_rules.js.map