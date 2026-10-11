"use strict";
// LM-289: the shared price rule set. The same table runs in Java, Rust and Python.
Object.defineProperty(exports, "__esModule", { value: true });
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
const price_rules_1 = require("./price_rules");
const PRICE_ID = '6a1d2c3e-4b5f-4a6d-8e7f-9a0b1c2d3e4f';
const SECURITY_ID = '1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10';
function decimal(value) {
    return new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(value);
}
/** A price that passes every rule. */
function valid() {
    return new price_pb_1.PriceProto()
        .setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(PRICE_ID)).toUUIDProto())
        .setSecurity(new security_pb_1.SecurityProto().setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(SECURITY_ID)).toUUIDProto()))
        .setPrice(decimal('100.25'))
        .setPriceType(price_type_pb_1.PriceTypeProto.PERCENTAGE);
}
/** `valid()` with `change` applied; the generated clear* setters return void. */
function validWith(change) {
    const p = valid();
    change(p);
    return p;
}
function fields(proto) {
    return (0, price_rules_1.validate)(proto).map(v => v.getField());
}
describe('price_rules.validate', () => {
    test('security absent gives one violation on security', () => {
        expect(fields(validWith(p => p.clearSecurity()))).toEqual(['security']);
    });
    test('empty security uuid gives one violation on security', () => {
        expect(fields(valid().setSecurity(new security_pb_1.SecurityProto().setUuid(new uuid_pb_1.UUIDProto())))).toEqual(['security']);
    });
    test('security present but uuid unset gives one violation on security', () => {
        expect(fields(valid().setSecurity(new security_pb_1.SecurityProto()))).toEqual(['security']);
    });
    test('price absent gives one violation on price', () => {
        expect(fields(validWith(p => p.clearPrice()))).toEqual(['price']);
    });
    test('empty price gives one violation on price', () => {
        expect(fields(valid().setPrice(decimal('')))).toEqual(['price']);
    });
    test('zero price is valid', () => {
        expect(fields(valid().setPrice(decimal('0')))).toEqual([]);
    });
    test.each(['-1', 'abc'])('price value %s is not checked', value => {
        expect(fields(valid().setPrice(decimal(value)))).toEqual([]);
    });
    test('UNKNOWN_PRICE_TYPE gives one violation on price_type', () => {
        expect(fields(valid().setPriceType(price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE))).toEqual(['price_type']);
    });
    test('unrecognised price_type is valid', () => {
        expect(fields(valid().setPriceType(99))).toEqual([]);
    });
    test('all three problems give three violations in field order', () => {
        const proto = validWith(p => { p.clearSecurity(); p.clearPrice(); p.setPriceType(price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE); });
        const violations = (0, price_rules_1.validate)(proto);
        expect(violations.map(v => v.getField())).toEqual(['security', 'price', 'price_type']);
        for (const v of violations) {
            expect(uuid_1.UUID.fromU8Array(v.getObjectId().getRawUuid_asU8()).toString()).toBe(PRICE_ID);
        }
    });
    test('every known price type is valid', () => {
        const values = Object.values(price_type_pb_1.PriceTypeProto).filter((v) => typeof v === 'number');
        expect(values).toContain(price_type_pb_1.PriceTypeProto.PERCENTAGE);
        for (const value of values) {
            if (value === price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE)
                continue;
            expect(fields(valid().setPriceType(value))).toEqual([]);
        }
    });
    test('empty, null or undefined proto gives three violations without throwing', () => {
        const expected = ['security', 'price', 'price_type'];
        expect(fields(new price_pb_1.PriceProto())).toEqual(expected);
        expect(fields(null)).toEqual(expected);
        expect(fields(undefined)).toEqual(expected);
        expect((0, price_rules_1.validate)(null)[0].hasObjectId()).toBe(false);
    });
});
describe('price_rules.requireValid', () => {
    test('throws the typed error carrying the violations', () => {
        const proto = validWith(p => p.clearPrice());
        let err;
        try {
            (0, price_rules_1.requireValid)(proto);
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(errors_1.ModelValidationError);
        expect(err.violations.map(v => v.getField())).toEqual(['price']);
        expect(() => (0, price_rules_1.requireValid)(valid())).not.toThrow();
    });
});
describe('the published (compiled) price_rules.js', () => {
    // npm publish runs no tsc: the tracked .js is what consumers get.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compiled = require('./price_rules.js');
    test('all three problems give three violations in field order', () => {
        const proto = validWith(p => { p.clearSecurity(); p.clearPrice(); p.setPriceType(price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE); });
        const violations = compiled.validate(proto);
        expect(violations.map(v => v.getField())).toEqual(['security', 'price', 'price_type']);
    });
});
//# sourceMappingURL=price_rules.test.js.map