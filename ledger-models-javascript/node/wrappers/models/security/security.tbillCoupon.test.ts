// LM-258: a TBILL has no coupon. coupon_rate must be unset or 0 when
// product_type == TBILL. See docs/adr/tbill_coupon_validation.md.

import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { BondDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { ModelValidationError } from '../errors';
import { UUID } from '../utils/uuid';
import { COUPON_RATE, requireValid, validate } from './security_rules';

const SECURITY_ID = '1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10';

function decimal(value: string): DecimalValueProto {
    return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

/** A security of `productType`; `coupon` undefined leaves coupon_rate unset. */
function security(productType: ProductTypeProto, coupon?: string): SecurityProto {
    const bond = new BondDetailsProto().setFaceValue(decimal('1000'));
    if (coupon !== undefined) bond.setCouponRate(decimal(coupon));
    return new SecurityProto()
        .setUuid(new UUID(UUID.fromString(SECURITY_ID)).toUUIDProto())
        .setProductType(productType)
        .setBondDetails(bond);
}

function expectRejected(coupon: string): void {
    const proto = security(ProductTypeProto.TBILL, coupon);
    let err: unknown;
    try {
        requireValid(proto);
    } catch (e) {
        err = e;
    }
    expect(err).toBeInstanceOf(ModelValidationError);
    const error = err as ModelValidationError;
    expect(error.name).toBe('ModelValidationError');
    expect(error.violations).toHaveLength(1);
    expect(error.field).toBe(COUPON_RATE);
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
        const proto = security(ProductTypeProto.TBILL);
        expect(proto.getBondDetails()!.hasCouponRate()).toBe(false);
        expect(validate(proto)).toEqual([]);
        expect(() => requireValid(proto)).not.toThrow();
    });

    test('accepts a TBILL with an empty coupon_rate value', () => {
        const proto = security(ProductTypeProto.TBILL, '');
        expect(proto.getBondDetails()!.hasCouponRate()).toBe(true);
        expect(validate(proto)).toEqual([]);
        expect(() => requireValid(proto)).not.toThrow();
    });

    test.each(['0', '0.00'])('accepts a TBILL with coupon %s', (zero) => {
        const proto = security(ProductTypeProto.TBILL, zero);
        expect(validate(proto)).toEqual([]);
        expect(() => requireValid(proto)).not.toThrow();
    });

    test('accepts a TREASURY_NOTE with coupon 6.0', () => {
        const proto = security(ProductTypeProto.TREASURY_NOTE, '6.0');
        expect(validate(proto)).toEqual([]);
        expect(() => requireValid(proto)).not.toThrow();
    });
});
