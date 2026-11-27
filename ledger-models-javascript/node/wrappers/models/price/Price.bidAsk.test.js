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
// LM-508: PriceProto bid / ask / mid. Driven by
// test-fixtures/price/lm-508-cases.json, which the Java, Python and Rust
// tests share. Values compare as canonical plain strings (Decimal.toFixed() /
// toCanonicalString), so a scale or precision drift fails.
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const decimal_js_1 = require("decimal.js");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const errors_1 = require("../errors");
const security_1 = __importDefault(require("../security/security"));
const datetime_1 = require("../utils/datetime");
const decimal_1 = require("../utils/decimal");
const uuid_1 = require("../utils/uuid");
const Price_1 = __importStar(require("./Price"));
const price_rules_1 = require("./price_rules");
const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/price/lm-508-cases.json');
const CASES = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const LEGACY = CASES.legacy;
const RESOLVE = CASES.resolve;
const VALIDATE = CASES.validate;
const GOLDEN = CASES.golden_cases;
const AS_OF = datetime_1.ZonedDateTime.from(new Date('2024-06-14T14:00:00Z'));
function hex(bytes) {
    return Buffer.from(bytes).toString('hex');
}
function legacyProto() {
    return price_pb_1.PriceProto.deserializeBinary(new Uint8Array(Buffer.from(LEGACY.hex, 'hex')));
}
function quote(c) {
    const side = (v) => (v === undefined ? undefined : new decimal_js_1.Decimal(v));
    return Price_1.default.createQuote({ mid: side(c.mid), bid: side(c.bid), ask: side(c.ask) }, null, AS_OF, price_type_pb_1.PriceTypeProto.PERCENTAGE);
}
const plain = (d) => (d === undefined ? undefined : d.toFixed());
test('legacy bytes read as mid', () => {
    const proto = legacyProto();
    expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(proto.getMid()))).toBe(LEGACY.mid);
    expect(proto.hasBid()).toBe(false);
    expect(proto.hasAsk()).toBe(false);
    const price = new Price_1.default(proto);
    expect(price.getPrice().toFixed()).toBe('99.5');
    expect(price.getPriceKind()).toBe(Price_1.PriceKind.MID);
    expect(plain(price.getMid())).toBe('99.5');
    expect(price.getBid()).toBeUndefined();
    expect(price.getAsk()).toBeUndefined();
});
test('the one-number helper rebuilds the legacy bytes exactly', () => {
    const old = legacyProto();
    const security = new security_1.default(new security_pb_1.SecurityProto().setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(LEGACY.security_uuid)).toUUIDProto()));
    const rebuilt = Price_1.default.create(new decimal_js_1.Decimal('99.5'), security, new datetime_1.ZonedDateTime(old.getAsOf()), price_type_pb_1.PriceTypeProto.PERCENTAGE).proto;
    rebuilt.setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(LEGACY.uuid)).toUUIDProto());
    expect(hex(rebuilt.serializeBinary())).toBe(LEGACY.hex);
});
describe.each(RESOLVE)('$name', (c) => {
    test('getPrice resolves to the exact value and kind', () => {
        const price = quote(c);
        expect(price.getPrice().toFixed()).toBe(c.value);
        expect(price.getPriceKind()).toBe(Price_1.PriceKind[c.kind]);
        const q = price.getPriceQuote();
        expect(q.value.toFixed()).toBe(c.value);
        expect(q.kind).toBe(Price_1.PriceKind[c.kind]);
    });
    test('a stored quote reads back unchanged', () => {
        const read = new Price_1.default(price_pb_1.PriceProto.deserializeBinary(quote(c).proto.serializeBinary()));
        expect(plain(read.getMid())).toBe(c.mid);
        expect(plain(read.getBid())).toBe(c.bid);
        expect(plain(read.getAsk())).toBe(c.ask);
        expect(read.getPrice().toFixed()).toBe(c.value);
        expect(read.getPriceKind()).toBe(Price_1.PriceKind[c.kind]);
    });
    test('the proto-level resolver gives the same value', () => {
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)((0, Price_1.resolvedPriceDecimal)(quote(c).proto)))).toBe(c.value);
    });
});
test('no side set throws a ModelValidationError on mid', () => {
    const price = quote({});
    for (const read of [() => price.getPrice(), () => price.getPriceKind(), () => price.getPriceQuote()]) {
        let err;
        try {
            read();
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(errors_1.ModelValidationError);
        expect(err.violations.map(v => v.getField())).toEqual(['mid']);
    }
    expect((0, Price_1.resolvedPriceDecimal)(price.proto)).toBeUndefined();
});
describe.each(VALIDATE)('validate: $name', (c) => {
    test('gives the expected violations', () => {
        const proto = new price_pb_1.PriceProto()
            .setSecurity(new security_pb_1.SecurityProto().setUuid(uuid_1.UUID.random().toUUIDProto()))
            .setPriceType(price_type_pb_1.PriceTypeProto.PERCENTAGE);
        if (c.mid !== undefined)
            proto.setMid((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(c.mid)));
        if (c.bid !== undefined)
            proto.setBid((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(c.bid)));
        if (c.ask !== undefined)
            proto.setAsk((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(c.ask)));
        expect((0, price_rules_1.validate)(proto).map(v => v.getField())).toEqual(c.violations);
    });
});
test('golden cases match at their tolerance', () => {
    var _a;
    for (const c of GOLDEN) {
        const diff = quote(c).getPrice().minus(new decimal_js_1.Decimal(c.value)).abs();
        expect(diff.lte(new decimal_js_1.Decimal((_a = c.tolerance) !== null && _a !== void 0 ? _a : '0'))).toBe(true);
    }
});
//# sourceMappingURL=Price.bidAsk.test.js.map