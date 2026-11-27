// LM-508: PriceProto bid / ask / mid. Driven by
// test-fixtures/price/lm-508-cases.json, which the Java, Python and Rust
// tests share. Values compare as canonical plain strings (Decimal.toFixed() /
// toCanonicalString), so a scale or precision drift fails.
import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ModelValidationError } from '../errors';
import Security from '../security/security';
import { ZonedDateTime } from '../utils/datetime';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';
import { UUID } from '../utils/uuid';
import Price, { PriceKind, resolvedPriceDecimal } from './Price';
import { validate } from './price_rules';

type Sides = { mid?: string; bid?: string; ask?: string };
type ResolveCase = Sides & { name: string; value: string; kind: keyof typeof PriceKind; tolerance?: string };
type ValidateCase = Sides & { name: string; violations: string[] };

const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/price/lm-508-cases.json');
const CASES = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const LEGACY = CASES.legacy;
const RESOLVE: ResolveCase[] = CASES.resolve;
const VALIDATE: ValidateCase[] = CASES.validate;
const GOLDEN: ResolveCase[] = CASES.golden_cases;
const AS_OF = ZonedDateTime.from(new Date('2024-06-14T14:00:00Z'));

function hex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
}

function legacyProto(): PriceProto {
    return PriceProto.deserializeBinary(new Uint8Array(Buffer.from(LEGACY.hex, 'hex')));
}

function quote(c: Sides): Price {
    const side = (v?: string) => (v === undefined ? undefined : new Decimal(v));
    return Price.createQuote({ mid: side(c.mid), bid: side(c.bid), ask: side(c.ask) }, null, AS_OF, PriceTypeProto.PERCENTAGE);
}

const plain = (d?: Decimal) => (d === undefined ? undefined : d.toFixed());

test('legacy bytes read as mid', () => {
    const proto = legacyProto();

    expect(toCanonicalString(decodeDecimal(proto.getMid()!))).toBe(LEGACY.mid);
    expect(proto.hasBid()).toBe(false);
    expect(proto.hasAsk()).toBe(false);
    const price = new Price(proto);
    expect(price.getPrice().toFixed()).toBe('99.5');
    expect(price.getPriceKind()).toBe(PriceKind.MID);
    expect(plain(price.getMid())).toBe('99.5');
    expect(price.getBid()).toBeUndefined();
    expect(price.getAsk()).toBeUndefined();
});

test('the one-number helper rebuilds the legacy bytes exactly', () => {
    const old = legacyProto();
    const security = new Security(new SecurityProto().setUuid(new UUID(UUID.fromString(LEGACY.security_uuid)).toUUIDProto()));
    const rebuilt = Price.create(new Decimal('99.5'), security, new ZonedDateTime(old.getAsOf()!), PriceTypeProto.PERCENTAGE).proto;
    rebuilt.setUuid(new UUID(UUID.fromString(LEGACY.uuid)).toUUIDProto());

    expect(hex(rebuilt.serializeBinary())).toBe(LEGACY.hex);
});

describe.each(RESOLVE)('$name', (c) => {
    test('getPrice resolves to the exact value and kind', () => {
        const price = quote(c);

        expect(price.getPrice().toFixed()).toBe(c.value);
        expect(price.getPriceKind()).toBe(PriceKind[c.kind]);
        const q = price.getPriceQuote();
        expect(q.value.toFixed()).toBe(c.value);
        expect(q.kind).toBe(PriceKind[c.kind]);
    });

    test('a stored quote reads back unchanged', () => {
        const read = new Price(PriceProto.deserializeBinary(quote(c).proto.serializeBinary()));

        expect(plain(read.getMid())).toBe(c.mid);
        expect(plain(read.getBid())).toBe(c.bid);
        expect(plain(read.getAsk())).toBe(c.ask);
        expect(read.getPrice().toFixed()).toBe(c.value);
        expect(read.getPriceKind()).toBe(PriceKind[c.kind]);
    });

    test('the proto-level resolver gives the same value', () => {
        expect(toCanonicalString(decodeDecimal(resolvedPriceDecimal(quote(c).proto)!))).toBe(c.value);
    });
});

test('no side set throws a ModelValidationError on mid', () => {
    const price = quote({});

    for (const read of [() => price.getPrice(), () => price.getPriceKind(), () => price.getPriceQuote()]) {
        let err: unknown;
        try {
            read();
        } catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(ModelValidationError);
        expect((err as ModelValidationError).violations.map(v => v.getField())).toEqual(['mid']);
    }
    expect(resolvedPriceDecimal(price.proto)).toBeUndefined();
});

describe.each(VALIDATE)('validate: $name', (c) => {
    test('gives the expected violations', () => {
        const proto = new PriceProto()
            .setSecurity(new SecurityProto().setUuid(UUID.random().toUUIDProto()))
            .setPriceType(PriceTypeProto.PERCENTAGE);
        if (c.mid !== undefined) proto.setMid(encodeDecimal(parseDecimalString(c.mid)));
        if (c.bid !== undefined) proto.setBid(encodeDecimal(parseDecimalString(c.bid)));
        if (c.ask !== undefined) proto.setAsk(encodeDecimal(parseDecimalString(c.ask)));

        expect(validate(proto).map(v => v.getField())).toEqual(c.violations);
    });
});

test('golden cases match at their tolerance', () => {
    for (const c of GOLDEN) {
        const diff = quote(c).getPrice().minus(new Decimal(c.value)).abs();
        expect(diff.lte(new Decimal(c.tolerance ?? '0'))).toBe(true);
    }
});
