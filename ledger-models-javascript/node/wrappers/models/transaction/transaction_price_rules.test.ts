// LM-463: trade-price rule. The same fixture
// (test-fixtures/transaction-price/cases.json) runs in Java, Python and Rust.

import * as fs from 'fs';
import * as path from 'path';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
import { UUID } from '../utils/uuid';
import { PRICE_PREFIX, UNKNOWN_TRADE_PRICE_TYPE, validate } from './transaction_rules';

interface PriceSpec { uuid?: string; link?: boolean; price_type?: string | number }
interface TransactionSpec { uuid: string; price?: PriceSpec }
interface Violation { field: string; object_id: string | null; message: string }
interface Case { name: string; transaction: TransactionSpec; violations: Violation[] }

const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/transaction-price/cases.json');
const CASES: Case[] = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')).cases;
const byName = (name: string): Case => CASES.find(c => c.name === name)!;
const FIELD = `${PRICE_PREFIX}price_type`;

function price(p: PriceSpec): PriceProto {
    const out = new PriceProto();
    if (p.uuid !== undefined) out.setUuid(new UUID(UUID.fromString(p.uuid)).toUUIDProto());
    if (p.link) out.setIsLink(true);
    if (typeof p.price_type === 'number') {
        // A number is the raw wire value.
        out.setPriceType(p.price_type as PriceTypeProto);
    } else if (p.price_type !== undefined) {
        out.setPriceType(PriceTypeProto[p.price_type as keyof typeof PriceTypeProto]);
    }
    return out;
}

function transaction(t: TransactionSpec): TransactionProto {
    const out = new TransactionProto().setUuid(new UUID(UUID.fromString(t.uuid)).toUUIDProto());
    if (t.price) out.setPrice(price(t.price));
    return out;
}

const onPriceType = (vs: FieldViolationProto[]): string[] =>
    vs.filter(v => v.getField() === FIELD).map(v => v.getMessage());

describe('transaction_rules.validate: trade price (LM-463)', () => {
    test('fixture has every case, including the metric cases', () => {
        const names = CASES.map(c => c.name);
        expect(new Set(names).size).toBe(names.length);
        expect(names).toEqual(expect.arrayContaining([
            'inline_unknown', 'inline_unknown_no_uuid', 'inline_absolute', 'inline_percentage', 'inline_rate',
            'inline_unrecognised_value', 'link_no_price_type', 'link_unknown_explicit', 'no_price',
        ]));
    });

    test('every fixture case runs and matches', () => {
        let ran = 0;
        for (const c of CASES) {
            const actual = validate(transaction(c.transaction));
            expect([c.name, actual.map(v => v.getField())]).toEqual([c.name, c.violations.map(v => v.field)]);
            c.violations.forEach((want, i) => {
                const got = actual[i];
                expect(got.getMessage()).toBe(want.message);
                if (want.object_id === null) expect(got.hasObjectId()).toBe(false);
                else expect(UUID.fromUUIDProto(got.getObjectId())?.toString()).toBe(want.object_id);
            });
            ran++;
        }
        expect(ran).toBe(CASES.length);
    });

    test('inline_unknown gives exactly one violation on price.price_type', () => {
        const actual = validate(transaction(byName('inline_unknown').transaction));
        expect(actual).toHaveLength(1);
        expect(actual[0].getField()).toBe('price.price_type');
        expect(actual[0].getMessage()).toContain('price_type');
        expect(actual[0].getMessage()).toBe(UNKNOWN_TRADE_PRICE_TYPE);
    });

    test.each(['inline_absolute', 'inline_percentage', 'inline_rate'])('%s gives no violation', name => {
        expect(onPriceType(validate(transaction(byName(name).transaction)))).toEqual([]);
    });

    test.each(['link_no_price_type', 'link_unknown_explicit'])('%s is never checked', name => {
        expect(onPriceType(validate(transaction(byName(name).transaction)))).toEqual([]);
    });

    test('an unrecognised raw value passes', () => {
        const proto = new TransactionProto().setPrice(new PriceProto().setPriceType(999 as PriceTypeProto));
        expect(validate(proto)).toEqual([]);
    });

    test('every named price type except UNKNOWN_PRICE_TYPE passes', () => {
        const visited: number[] = [];
        for (const value of Object.values(PriceTypeProto)) {
            if (typeof value !== 'number' || value === PriceTypeProto.UNKNOWN_PRICE_TYPE) continue;
            const proto = new TransactionProto().setPrice(new PriceProto().setPriceType(value));
            expect([value, validate(proto)]).toEqual([value, []]);
            visited.push(value);
        }
        expect(visited.length).toBeGreaterThanOrEqual(5);
        expect(visited).toContain(PriceTypeProto.RATE);
    });
});
