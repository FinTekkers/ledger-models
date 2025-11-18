"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponType = void 0;
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
class CouponType {
    constructor(proto) {
        this.proto = proto;
    }
    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum descriptor as the value. There is
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than FIXED, you could return Fixed.
     *
     * @returns CouponType as a string
     */
    name() {
        var _a;
        return (_a = CouponType.ctEnumMap.get(this.proto)) !== null && _a !== void 0 ? _a : 'UNKNOWN_COUPON_TYPE';
    }
}
exports.CouponType = CouponType;
(() => {
    CouponType.ctEnumMap = new Map();
    Object.keys(coupon_type_pb_1.CouponTypeProto).forEach(key => {
        CouponType.ctEnumMap.set(coupon_type_pb_1.CouponTypeProto[key], key);
    });
})();
//# sourceMappingURL=coupon_type.js.map