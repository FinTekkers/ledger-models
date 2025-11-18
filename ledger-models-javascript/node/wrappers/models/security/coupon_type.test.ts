import assert = require('assert');
import { CouponType } from './coupon_type';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';

test('test CouponType.FIXED returns "FIXED"', () => {
  testFixedCouponType();
});

function testFixedCouponType(): void {
  const couponType = new CouponType(CouponTypeProto.FIXED);
  assert(couponType.toString() === 'FIXED');
}

