"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const coupon_type_1 = require("./coupon_type");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
test('test CouponType.FIXED returns "FIXED"', () => {
    testFixedCouponType();
});
function testFixedCouponType() {
    const couponType = new coupon_type_1.CouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
    assert(couponType.toString() === 'FIXED');
}
//# sourceMappingURL=coupon_type.test.js.map