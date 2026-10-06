"use strict";
// LM-258: a TBILL has no coupon. coupon_rate must be unset or 0 when
// product_type == TBILL. See docs/adr/tbill_coupon_validation.md.
Object.defineProperty(exports, "__esModule", { value: true });
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
const security_rules_1 = require("./security_rules");
const SECURITY_ID = '1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10';
function decimal(value) {
    return new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(value);
}
/** A security of `productType`; `coupon` undefined leaves coupon_rate unset. */
function security(productType, coupon) {
    const bond = new security_pb_1.BondDetailsProto().setFaceValue(decimal('1000'));
    if (coupon !== undefined)
        bond.setCouponRate(decimal(coupon));
    return new security_pb_1.SecurityProto()
        .setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(SECURITY_ID)).toUUIDProto())
        .setProductType(productType)
        .setBondDetails(bond);
}
function expectRejected(coupon) {
    const proto = security(product_type_pb_1.ProductTypeProto.TBILL, coupon);
    let err;
    try {
        (0, security_rules_1.requireValid)(proto);
    }
    catch (e) {
        err = e;
    }
    expect(err).toBeInstanceOf(errors_1.ModelValidationError);
    const error = err;
    expect(error.name).toBe('ModelValidationError');
    expect(error.violations).toHaveLength(1);
    expect(error.field).toBe(security_rules_1.COUPON_RATE);
    expect(error.field).toBe('bond_details.coupon_rate');
    expect(error.objectId).toBe(SECURITY_ID);
    expect(error.message).toContain(SECURITY_ID);
    expect(error.message).toContain('coupon_rate');
}
describe('TBILL coupon rule', () => {
    test('rejects a TBILL with coupon 6.0', () => {
        expectRejected('6.0');
    });
    test('rejects a TBILL with coupon -1.0', () => {
        expectRejected('-1.0');
    });
    test('accepts a TBILL with no coupon_rate message', () => {
        const proto = security(product_type_pb_1.ProductTypeProto.TBILL);
        expect(proto.getBondDetails().hasCouponRate()).toBe(false);
        expect((0, security_rules_1.validate)(proto)).toEqual([]);
        expect(() => (0, security_rules_1.requireValid)(proto)).not.toThrow();
    });
    test('accepts a TBILL with an empty coupon_rate value', () => {
        const proto = security(product_type_pb_1.ProductTypeProto.TBILL, '');
        expect(proto.getBondDetails().hasCouponRate()).toBe(true);
        expect((0, security_rules_1.validate)(proto)).toEqual([]);
        expect(() => (0, security_rules_1.requireValid)(proto)).not.toThrow();
    });
    test.each(['0', '0.00'])('accepts a TBILL with coupon %s', (zero) => {
        const proto = security(product_type_pb_1.ProductTypeProto.TBILL, zero);
        expect((0, security_rules_1.validate)(proto)).toEqual([]);
        expect(() => (0, security_rules_1.requireValid)(proto)).not.toThrow();
    });
    test('accepts a TREASURY_NOTE with coupon 6.0', () => {
        const proto = security(product_type_pb_1.ProductTypeProto.TREASURY_NOTE, '6.0');
        expect((0, security_rules_1.validate)(proto)).toEqual([]);
        expect(() => (0, security_rules_1.requireValid)(proto)).not.toThrow();
    });
});
//# sourceMappingURL=security.tbillCoupon.test.js.map