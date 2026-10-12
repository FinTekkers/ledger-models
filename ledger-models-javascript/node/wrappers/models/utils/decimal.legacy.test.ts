import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';
import { Message } from 'google-protobuf';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import Price from '../price/Price';
import Security from '../security/security';
import MortgageBackedSecurity from '../security/MortgageBackedSecurity';
import Transaction from '../transaction/transaction';
import { ProtoSerializationUtil } from './serialization';
import { UUID } from './uuid';
import Portfolio from '../portfolio/portfolio';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { decodeDecimal, reencodeDecimal, setDecimalLogger } from './decimal';

/**
 * Metric 2 (LM-306): bytes written by ledger-models v0.4.33 carry only the
 * string form. They load through the wrappers to the same value and scale,
 * and re-saving them writes both forms.
 */

const LEGACY = path.join(__dirname, '../../../../../ledger-models-protos/fixtures/legacy_v0433');

interface LegacyDecimal { path: string; stored_string: string; unscaled: string; scale: number; read_by: string }
interface LegacyFixture { bin: string; message: string; decimals: LegacyDecimal[] }

const DESERIALIZERS: Record<string, (b: Uint8Array) => Message> = {
    PriceProto: b => PriceProto.deserializeBinary(b),
    SecurityProto: b => SecurityProto.deserializeBinary(b),
    TransactionProto: b => TransactionProto.deserializeBinary(b),
};

function load(name: string): { fixture: LegacyFixture; message: Message } {
    const fixture: LegacyFixture = JSON.parse(fs.readFileSync(path.join(LEGACY, `${name}.json`), 'utf8'));
    const deserialize = DESERIALIZERS[fixture.message];
    if (!deserialize) throw new Error(`no deserializer for ${fixture.message}`);
    return { fixture, message: deserialize(new Uint8Array(fs.readFileSync(path.join(LEGACY, fixture.bin)))) };
}

const pascal = (segment: string) => segment.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');

/** Walks `a.b_c` with getA().getBC(). */
function walk(message: Message, dotted: string): any {
    return dotted.split('.').reduce((m: any, segment) => {
        const value = m[`get${pascal(segment)}`]();
        if (value === undefined) throw new Error(`${dotted}: ${segment} is unset`);
        return value;
    }, message);
}

/** The wrapper getter that reads each path, as Rust's `read_by` names it. */
function readByWrapper(message: Message, dotted: string): Decimal {
    const mbs = (security: SecurityProto) => {
        const wrapped = Security.create(security);
        expect(wrapped).toBeInstanceOf(MortgageBackedSecurity);
        return wrapped as MortgageBackedSecurity;
    };
    const parts = dotted.split('.');
    const field = parts[parts.length - 1];
    if (dotted === 'price') return new Price(message as PriceProto).getPrice();
    if (dotted === 'quantity') return new Transaction(message as TransactionProto).getQuantity();
    if (dotted === 'price.price') return new Price(new Transaction(message as TransactionProto).getPrice()).getPrice();
    const security = parts[0] === 'security' ? walk(message, 'security') as SecurityProto : message as SecurityProto;
    const getter = `get${pascal(field)}`;
    const value = (mbs(security) as any)[getter]();
    if (!(value instanceof Decimal)) throw new Error(`${dotted}: ${getter} did not return a Decimal`);
    return value;
}

beforeAll(() => {
    setDecimalLogger({ warn: jest.fn() });
});

describe.each(['price', 'security', 'transaction'])('legacy_v0433/%s', (name) => {
    const { fixture } = load(name);

    test.each(fixture.decimals.map(d => [d.path, d] as [string, LegacyDecimal]))('%s reads through the wrapper', (_p, d) => {
        const { message } = load(name);
        const proto = walk(message, d.path) as DecimalValueProto;
        // Really string-only bytes.
        expect(proto.getUnscaledValue_asU8().length).toBe(0);
        expect(proto.getArbitraryPrecisionValue()).toBe(d.stored_string);

        // Same value and scale as the fixture.
        expect(decodeDecimal(proto)).toEqual({ unscaled: BigInt(d.unscaled), scale: d.scale });

        // The wrapper getter returns that exact value.
        const expected = new Decimal(d.unscaled).div(new Decimal(10).pow(d.scale));
        expect(readByWrapper(message, d.path).equals(expected)).toBe(true);
        if (d.read_by.startsWith('ProtoSerializationUtil')) {
            expect((ProtoSerializationUtil.deserialize(proto) as Decimal).equals(expected)).toBe(true);
        }
    });

    test('re-saving writes both forms with the same value and scale', () => {
        const { message } = load(name);
        for (const d of fixture.decimals) {
            const parentPath = d.path.split('.').slice(0, -1).join('.');
            const parent = parentPath ? walk(message, parentPath) : message;
            const field = d.path.split('.').pop()!;
            const setter = `set${pascal(field)}`;
            (parent as any)[setter](reencodeDecimal(walk(message, d.path)));
        }
        const reread = DESERIALIZERS[fixture.message](message.serializeBinary());
        for (const d of fixture.decimals) {
            const proto = walk(reread, d.path) as DecimalValueProto;
            expect(proto.getUnscaledValue_asU8().length).toBeGreaterThan(0);
            expect(proto.getArbitraryPrecisionValue()).not.toBe('');
            const expected = { unscaled: BigInt(d.unscaled), scale: d.scale };
            const stringOnly = new DecimalValueProto().setArbitraryPrecisionValue(proto.getArbitraryPrecisionValue());
            const compactOnly = new DecimalValueProto().setUnscaledValue(proto.getUnscaledValue_asU8()).setScale(proto.getScale());
            expect(decodeDecimal(compactOnly)).toEqual(expected);
            expect(decodeDecimal(stringOnly)).toEqual(expected);
        }
    });
});

describe('wrapper writers set both forms (metrics 2 and 5)', () => {
    const bothForms = (proto: DecimalValueProto | undefined, expected: Decimal) => {
        expect(proto).toBeDefined();
        const p = proto as DecimalValueProto;
        const stringOnly = new DecimalValueProto().setArbitraryPrecisionValue(p.getArbitraryPrecisionValue());
        const compactOnly = new DecimalValueProto().setUnscaledValue(p.getUnscaledValue_asU8()).setScale(p.getScale());
        expect(p.getUnscaledValue_asU8().length).toBeGreaterThan(0);
        expect(decodeDecimal(compactOnly)).toEqual(decodeDecimal(stringOnly));
        expect(new Decimal(p.getArbitraryPrecisionValue()).equals(expected)).toBe(true);
    };

    test('a legacy Price re-created through Price.create', () => {
        const legacy = new Price(load('price').message as PriceProto);
        const saved = Price.create(legacy.getPrice(), legacy.getSecurity(), legacy.getAsOf());
        const reread = PriceProto.deserializeBinary(saved.proto.serializeBinary());
        bothForms(reread.getPrice(), new Decimal('100.25'));
    });

    test('a legacy Transaction re-created through the Transaction constructor', () => {
        const legacy = new Transaction(load('transaction').message as TransactionProto);
        const legacyPrice = new Price(legacy.getPrice());
        const saved = new Transaction({
            tradeDate: new Date(2026, 0, 2),
            settlementDate: new Date(2026, 0, 4),
            security: legacy.getSecurity(),
            transactionType: legacy.getTransactionType(),
            portfolio: new Portfolio(new PortfolioProto()
                .setObjectClass('Portfolio').setVersion('0.0.1')
                .setUuid(UUID.random().toUUIDProto()).setPortfolioName('LM-306')),
            quantity: legacy.getQuantity(),
            price: legacyPrice.getPrice(),
            asOfDate: new Date(2026, 0, 2),
        });
        const reread = TransactionProto.deserializeBinary(saved.proto.serializeBinary());
        bothForms(reread.getQuantity(), new Decimal(1000));
        bothForms(reread.getPrice()?.getPrice(), new Decimal('-0.50'));
    });
});
