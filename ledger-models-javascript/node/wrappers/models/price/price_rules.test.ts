// LM-289: the shared price rule set. The same table runs in Java, Rust and Python.

import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ModelValidationError } from '../errors';
import { UUID } from '../utils/uuid';
import { requireValid, validate } from './price_rules';

const PRICE_ID = '6a1d2c3e-4b5f-4a6d-8e7f-9a0b1c2d3e4f';
const SECURITY_ID = '1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10';

function decimal(value: string): DecimalValueProto {
    return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

/** A price that passes every rule. */
function valid(): PriceProto {
    return new PriceProto()
        .setUuid(new UUID(UUID.fromString(PRICE_ID)).toUUIDProto())
        .setSecurity(new SecurityProto().setUuid(new UUID(UUID.fromString(SECURITY_ID)).toUUIDProto()))
        .setPrice(decimal('100.25'))
        .setPriceType(PriceTypeProto.PERCENTAGE);
}

/** `valid()` with `change` applied; the generated clear* setters return void. */
function validWith(change: (p: PriceProto) => void): PriceProto {
    const p = valid();
    change(p);
    return p;
}

function fields(proto: PriceProto | null | undefined): string[] {
    return validate(proto).map(v => v.getField());
}

describe('price_rules.validate', () => {
    test('security absent gives one violation on security', () => {
        expect(fields(validWith(p => p.clearSecurity()))).toEqual(['security']);
    });

    test('empty security uuid gives one violation on security', () => {
        expect(fields(valid().setSecurity(new SecurityProto().setUuid(new UUIDProto())))).toEqual(['security']);
    });

    test('security present but uuid unset gives one violation on security', () => {
        expect(fields(valid().setSecurity(new SecurityProto()))).toEqual(['security']);
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
        expect(fields(valid().setPriceType(PriceTypeProto.UNKNOWN_PRICE_TYPE))).toEqual(['price_type']);
    });

    test('unrecognised price_type is valid', () => {
        expect(fields(valid().setPriceType(99 as PriceTypeProto))).toEqual([]);
    });

    test('all three problems give three violations in field order', () => {
        const proto = validWith(p => { p.clearSecurity(); p.clearPrice(); p.setPriceType(PriceTypeProto.UNKNOWN_PRICE_TYPE); });
        const violations = validate(proto);
        expect(violations.map(v => v.getField())).toEqual(['security', 'price', 'price_type']);
        for (const v of violations) {
            expect(UUID.fromU8Array(v.getObjectId()!.getRawUuid_asU8()).toString()).toBe(PRICE_ID);
        }
    });

    test('every known price type is valid', () => {
        const values = Object.values(PriceTypeProto).filter((v): v is PriceTypeProto => typeof v === 'number');
        expect(values).toContain(PriceTypeProto.PERCENTAGE);
        for (const value of values) {
            if (value === PriceTypeProto.UNKNOWN_PRICE_TYPE) continue;
            expect(fields(valid().setPriceType(value))).toEqual([]);
        }
    });

    test('empty, null or undefined proto gives three violations without throwing', () => {
        const expected = ['security', 'price', 'price_type'];
        expect(fields(new PriceProto())).toEqual(expected);
        expect(fields(null)).toEqual(expected);
        expect(fields(undefined)).toEqual(expected);
        expect(validate(null)[0].hasObjectId()).toBe(false);
    });
});

describe('price_rules.requireValid', () => {
    test('throws the typed error carrying the violations', () => {
        const proto = validWith(p => p.clearPrice());
        let err: unknown;
        try {
            requireValid(proto);
        } catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(ModelValidationError);
        expect((err as ModelValidationError).violations.map(v => v.getField())).toEqual(['price']);
        expect(() => requireValid(valid())).not.toThrow();
    });
});

describe('the published (compiled) price_rules.js', () => {
    // npm publish runs no tsc: the tracked .js is what consumers get.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compiled = require('./price_rules.js');

    test('all three problems give three violations in field order', () => {
        const proto = validWith(p => { p.clearSecurity(); p.clearPrice(); p.setPriceType(PriceTypeProto.UNKNOWN_PRICE_TYPE); });
        const violations = compiled.validate(proto) as { getField(): string }[];
        expect(violations.map(v => v.getField())).toEqual(['security', 'price', 'price_type']);
    });
});
