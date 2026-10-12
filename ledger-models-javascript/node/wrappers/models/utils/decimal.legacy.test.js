"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const decimal_js_1 = require("decimal.js");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const Price_1 = __importDefault(require("../price/Price"));
const security_1 = __importDefault(require("../security/security"));
const MortgageBackedSecurity_1 = __importDefault(require("../security/MortgageBackedSecurity"));
const transaction_1 = __importDefault(require("../transaction/transaction"));
const serialization_1 = require("./serialization");
const uuid_1 = require("./uuid");
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const decimal_1 = require("./decimal");
/**
 * Metric 2 (LM-306): bytes written by ledger-models v0.4.33 carry only the
 * string form. They load through the wrappers to the same value and scale,
 * and re-saving them writes both forms.
 */
const LEGACY = path.join(__dirname, '../../../../../ledger-models-protos/fixtures/legacy_v0433');
const DESERIALIZERS = {
    PriceProto: b => price_pb_1.PriceProto.deserializeBinary(b),
    SecurityProto: b => security_pb_1.SecurityProto.deserializeBinary(b),
    TransactionProto: b => transaction_pb_1.TransactionProto.deserializeBinary(b),
};
function load(name) {
    const fixture = JSON.parse(fs.readFileSync(path.join(LEGACY, `${name}.json`), 'utf8'));
    const deserialize = DESERIALIZERS[fixture.message];
    if (!deserialize)
        throw new Error(`no deserializer for ${fixture.message}`);
    return { fixture, message: deserialize(new Uint8Array(fs.readFileSync(path.join(LEGACY, fixture.bin)))) };
}
const pascal = (segment) => segment.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
/** Walks `a.b_c` with getA().getBC(). */
function walk(message, dotted) {
    return dotted.split('.').reduce((m, segment) => {
        const value = m[`get${pascal(segment)}`]();
        if (value === undefined)
            throw new Error(`${dotted}: ${segment} is unset`);
        return value;
    }, message);
}
/** The wrapper getter that reads each path, as Rust's `read_by` names it. */
function readByWrapper(message, dotted) {
    const mbs = (security) => {
        const wrapped = security_1.default.create(security);
        expect(wrapped).toBeInstanceOf(MortgageBackedSecurity_1.default);
        return wrapped;
    };
    const parts = dotted.split('.');
    const field = parts[parts.length - 1];
    if (dotted === 'price')
        return new Price_1.default(message).getPrice();
    if (dotted === 'quantity')
        return new transaction_1.default(message).getQuantity();
    if (dotted === 'price.price')
        return new Price_1.default(new transaction_1.default(message).getPrice()).getPrice();
    const security = parts[0] === 'security' ? walk(message, 'security') : message;
    const getter = `get${pascal(field)}`;
    const value = mbs(security)[getter]();
    if (!(value instanceof decimal_js_1.Decimal))
        throw new Error(`${dotted}: ${getter} did not return a Decimal`);
    return value;
}
beforeAll(() => {
    (0, decimal_1.setDecimalLogger)({ warn: jest.fn() });
});
describe.each(['price', 'security', 'transaction'])('legacy_v0433/%s', (name) => {
    const { fixture } = load(name);
    test.each(fixture.decimals.map(d => [d.path, d]))('%s reads through the wrapper', (_p, d) => {
        const { message } = load(name);
        const proto = walk(message, d.path);
        // Really string-only bytes.
        expect(proto.getUnscaledValue_asU8().length).toBe(0);
        expect(proto.getArbitraryPrecisionValue()).toBe(d.stored_string);
        // Same value and scale as the fixture.
        expect((0, decimal_1.decodeDecimal)(proto)).toEqual({ unscaled: BigInt(d.unscaled), scale: d.scale });
        // The wrapper getter returns that exact value.
        const expected = new decimal_js_1.Decimal(d.unscaled).div(new decimal_js_1.Decimal(10).pow(d.scale));
        expect(readByWrapper(message, d.path).equals(expected)).toBe(true);
        if (d.read_by.startsWith('ProtoSerializationUtil')) {
            expect(serialization_1.ProtoSerializationUtil.deserialize(proto).equals(expected)).toBe(true);
        }
    });
    test('re-saving writes both forms with the same value and scale', () => {
        const { message } = load(name);
        for (const d of fixture.decimals) {
            const parentPath = d.path.split('.').slice(0, -1).join('.');
            const parent = parentPath ? walk(message, parentPath) : message;
            const field = d.path.split('.').pop();
            const setter = `set${pascal(field)}`;
            parent[setter]((0, decimal_1.reencodeDecimal)(walk(message, d.path)));
        }
        const reread = DESERIALIZERS[fixture.message](message.serializeBinary());
        for (const d of fixture.decimals) {
            const proto = walk(reread, d.path);
            expect(proto.getUnscaledValue_asU8().length).toBeGreaterThan(0);
            expect(proto.getArbitraryPrecisionValue()).not.toBe('');
            const expected = { unscaled: BigInt(d.unscaled), scale: d.scale };
            const stringOnly = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(proto.getArbitraryPrecisionValue());
            const compactOnly = new decimal_value_pb_1.DecimalValueProto().setUnscaledValue(proto.getUnscaledValue_asU8()).setScale(proto.getScale());
            expect((0, decimal_1.decodeDecimal)(compactOnly)).toEqual(expected);
            expect((0, decimal_1.decodeDecimal)(stringOnly)).toEqual(expected);
        }
    });
});
describe('wrapper writers set both forms (metrics 2 and 5)', () => {
    const bothForms = (proto, expected) => {
        expect(proto).toBeDefined();
        const p = proto;
        const stringOnly = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(p.getArbitraryPrecisionValue());
        const compactOnly = new decimal_value_pb_1.DecimalValueProto().setUnscaledValue(p.getUnscaledValue_asU8()).setScale(p.getScale());
        expect(p.getUnscaledValue_asU8().length).toBeGreaterThan(0);
        expect((0, decimal_1.decodeDecimal)(compactOnly)).toEqual((0, decimal_1.decodeDecimal)(stringOnly));
        expect(new decimal_js_1.Decimal(p.getArbitraryPrecisionValue()).equals(expected)).toBe(true);
    };
    test('a legacy Price re-created through Price.create', () => {
        const legacy = new Price_1.default(load('price').message);
        const saved = Price_1.default.create(legacy.getPrice(), legacy.getSecurity(), legacy.getAsOf());
        const reread = price_pb_1.PriceProto.deserializeBinary(saved.proto.serializeBinary());
        bothForms(reread.getPrice(), new decimal_js_1.Decimal('100.25'));
    });
    test('a legacy Transaction re-created through the Transaction constructor', () => {
        var _a;
        const legacy = new transaction_1.default(load('transaction').message);
        const legacyPrice = new Price_1.default(legacy.getPrice());
        const saved = new transaction_1.default({
            tradeDate: new Date(2026, 0, 2),
            settlementDate: new Date(2026, 0, 4),
            security: legacy.getSecurity(),
            transactionType: legacy.getTransactionType(),
            portfolio: new portfolio_1.default(new portfolio_pb_1.PortfolioProto()
                .setObjectClass('Portfolio').setVersion('0.0.1')
                .setUuid(uuid_1.UUID.random().toUUIDProto()).setPortfolioName('LM-306')),
            quantity: legacy.getQuantity(),
            price: legacyPrice.getPrice(),
            asOfDate: new Date(2026, 0, 2),
        });
        const reread = transaction_pb_1.TransactionProto.deserializeBinary(saved.proto.serializeBinary());
        bothForms(reread.getQuantity(), new decimal_js_1.Decimal(1000));
        bothForms((_a = reread.getPrice()) === null || _a === void 0 ? void 0 : _a.getPrice(), new decimal_js_1.Decimal('-0.50'));
    });
});
//# sourceMappingURL=decimal.legacy.test.js.map