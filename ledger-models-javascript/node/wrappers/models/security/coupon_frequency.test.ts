import assert = require('assert');
import { CouponFrequency } from './coupon_frequency';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';

test('test CouponFrequency.SEMIANNUALLY returns "SEMIANNUALLY"', () => {
    testSemiannuallyCouponFrequency();
});

function testSemiannuallyCouponFrequency(): void {
    let couponFrequency = new CouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
    assert(couponFrequency.toString() === 'SEMIANNUALLY');

    couponFrequency = new CouponFrequency(2);
    assert(couponFrequency.toString() === 'SEMIANNUALLY');
}

