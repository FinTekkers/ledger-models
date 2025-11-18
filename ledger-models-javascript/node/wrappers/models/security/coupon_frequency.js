"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponFrequency = void 0;
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
class CouponFrequency {
    constructor(proto) {
        this.proto = proto;
    }
    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum descriptor as the value. There is
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than SEMIANNUALLY, you could return Semiannually.
     *
     * @returns CouponFrequency as a string
     */
    toString() {
        var _a;
        return (_a = CouponFrequency.cfEnumMap.get(this.proto)) !== null && _a !== void 0 ? _a : 'UNKNOWN_COUPON_FREQUENCY';
    }
}
exports.CouponFrequency = CouponFrequency;
(() => {
    CouponFrequency.cfEnumMap = new Map();
    Object.keys(coupon_frequency_pb_1.CouponFrequencyProto).forEach(key => {
        CouponFrequency.cfEnumMap.set(coupon_frequency_pb_1.CouponFrequencyProto[key], key);
    });
})();
//# sourceMappingURL=coupon_frequency.js.map