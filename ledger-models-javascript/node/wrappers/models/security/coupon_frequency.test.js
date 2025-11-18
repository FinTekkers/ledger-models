"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const coupon_frequency_1 = require("./coupon_frequency");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
test('test CouponFrequency.SEMIANNUALLY returns "SEMIANNUALLY"', () => {
    testSemiannuallyCouponFrequency();
});
function testSemiannuallyCouponFrequency() {
    let couponFrequency = new coupon_frequency_1.CouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
    assert(couponFrequency.toString() === 'SEMIANNUALLY');
    couponFrequency = new coupon_frequency_1.CouponFrequency(2);
    assert(couponFrequency.toString() === 'SEMIANNUALLY');
}
//# sourceMappingURL=coupon_frequency.test.js.map