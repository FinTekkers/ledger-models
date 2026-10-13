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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const decimal_js_1 = require("decimal.js");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const errors_1 = require("../errors");
const serialization_1 = require("./serialization");
const decimal_1 = require("./decimal");
/** Codec tests against the shared fixture (LM-306, JS side of LM-294). */
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../../ledger-models-protos/fixtures/decimal_compact.json'), 'utf8'));
const CASES = FIXTURE.cases;
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const unhex = (s) => new Uint8Array(Buffer.from(s, 'hex'));
/** Two's-complement big-endian, written independently of the codec. */
function expectedUnscaled(unscaledHex) {
    const unsigned = BigInt('0x' + unscaledHex);
    const negative = parseInt(unscaledHex.slice(0, 2), 16) >= 0x80;
    return negative ? unsigned - (BigInt(1) << BigInt(unscaledHex.length * 4)) : unsigned;
}
/** Only fields 11 and 12 set. */
function compactOnly(c) {
    return new decimal_value_pb_1.DecimalValueProto().setUnscaledValue(unhex(c.unscaled_hex)).setScale(c.scale);
}
function expectInvalid(fn) {
    expect(fn).toThrow(errors_1.ModelValidationError);
}
describe('metric 1: shared fixture', () => {
    test('fixture limits match the codec', () => {
        expect(FIXTURE.limits).toEqual({
            max_digits: decimal_1.MAX_DIGITS, max_scale: decimal_1.MAX_SCALE, max_unscaled_bytes: decimal_1.MAX_UNSCALED_BYTES,
        });
        expect(CASES.length).toBeGreaterThanOrEqual(12);
    });
    test.each(CASES.map(c => [c.name, c]))('%s encodes to wire_hex and decodes exactly', (_name, c) => {
        const parsed = (0, decimal_1.parseDecimalString)(c.string);
        expect(parsed).toEqual({ unscaled: expectedUnscaled(c.unscaled_hex), scale: c.scale });
        expect((0, decimal_1.toCanonicalString)(parsed)).toBe(c.canonical);
        const proto = (0, decimal_1.encodeDecimal)(parsed);
        expect(hex(proto.getUnscaledValue_asU8())).toBe(c.unscaled_hex);
        expect(proto.getScale()).toBe(c.scale);
        expect(hex(proto.serializeBinary())).toBe(c.wire_hex);
        // The proto alone is enough to decode (metric 3).
        const decoded = (0, decimal_1.decodeDecimal)(decimal_value_pb_1.DecimalValueProto.deserializeBinary(unhex(c.wire_hex)));
        expect(decoded).toEqual({ unscaled: expectedUnscaled(c.unscaled_hex), scale: c.scale });
    });
    const stringErrors = FIXTURE.string_errors.map((c) => [c.name, c.string]);
    test.each(stringErrors)('string error %s is a ModelValidationError', (_name, s) => {
        expectInvalid(() => (0, decimal_1.parseDecimalString)(s));
    });
    const decodeErrors = FIXTURE.decode_errors.map((c) => [c.name, c]);
    test.each(decodeErrors)('decode error %s is a ModelValidationError', (_name, c) => {
        const bytes = c.unscaled_hex_repeat
            ? unhex(c.unscaled_hex_repeat.hex.repeat(c.unscaled_hex_repeat.count))
            : unhex(c.unscaled_hex);
        expectInvalid(() => (0, decimal_1.decodeDecimal)(new decimal_value_pb_1.DecimalValueProto().setUnscaledValue(bytes).setScale(c.scale)));
    });
    test('the 1702-byte case passes the byte check and fails on digits; 1703 fails on bytes', () => {
        const message = (n) => {
            try {
                (0, decimal_1.decodeDecimal)(new decimal_value_pb_1.DecimalValueProto().setUnscaledValue(unhex('7f'.repeat(n))));
            }
            catch (e) {
                return e.message;
            }
            return '';
        };
        expect(message(1702)).toContain(`more than ${decimal_1.MAX_DIGITS} digits`);
        expect(message(1703)).toContain('1703-byte');
    });
    test('the committed decimal.js (what npm publishes) encodes and decodes fixture cases', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const shipped = require(path.join(__dirname, 'decimal.js'));
        for (const name of ['zero', 'two_pow_127', 'tiny_fraction']) {
            const c = CASES.find(x => x.name === name);
            const proto = shipped.encodeDecimal(shipped.parseDecimalString(c.string));
            expect(hex(proto.serializeBinary())).toBe(c.wire_hex);
            expect(shipped.decodeDecimal(decimal_value_pb_1.DecimalValueProto.deserializeBinary(unhex(c.wire_hex))))
                .toEqual({ unscaled: expectedUnscaled(c.unscaled_hex), scale: c.scale });
        }
    });
    test('negative zero from decimal.js encodes to 0x00 at scale 0', () => {
        const v = (0, decimal_1.fromDecimalJs)(new decimal_js_1.Decimal('-0'));
        expect(v).toEqual({ unscaled: BigInt(0), scale: 0 });
        const proto = (0, decimal_1.encodeDecimal)(v);
        expect(hex(proto.getUnscaledValue_asU8())).toBe('00');
        expect(proto.getScale()).toBe(0);
    });
    test('a string-only decimal from old bytes is unset (LM-318)', () => {
        // 0x52 = field 10, length-delimited: "1.5" as a v0.4.33 writer stored
        // it. LM-318 deleted field 10, so the decimal is unset.
        const old = decimal_value_pb_1.DecimalValueProto.deserializeBinary(new Uint8Array([0x52, 0x03, 0x31, 0x2e, 0x35]));
        expect((0, decimal_1.isUnsetDecimal)(old)).toBe(true);
        expect(() => (0, decimal_1.decodeDecimal)(old)).toThrow(errors_1.ModelValidationError);
        expect(() => (0, decimal_1.decodeDecimal)(old)).toThrow('decimal is required but unset');
        // Compact zero is still set.
        expect((0, decimal_1.isUnsetDecimal)((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('0')))).toBe(false);
    });
});
describe('metric 3: decodeDecimal takes the proto only', () => {
    test('a type or field argument does not type-check', () => {
        const p = (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('1.50'));
        // ts-jest type-checks this file: an unused @ts-expect-error fails it.
        const typeChecked = () => {
            // @ts-expect-error decodeDecimal takes no type argument
            (0, decimal_1.decodeDecimal)(p);
            // @ts-expect-error decodeDecimal takes no field argument
            (0, decimal_1.decodeDecimal)(p, 'price');
        };
        expect(typeof typeChecked).toBe('function');
        expect(decimal_1.decodeDecimal.length).toBe(1);
    });
    test('withField names the field on a codec error', () => {
        try {
            (0, decimal_1.withField)('price', () => (0, decimal_1.decodeDecimal)(new decimal_value_pb_1.DecimalValueProto()));
            throw new Error('expected a ModelValidationError');
        }
        catch (e) {
            expect(e).toBeInstanceOf(errors_1.ModelValidationError);
            expect(e.field).toBe('price');
        }
    });
});
describe('guardrail: lossless', () => {
    const NODE = path.join(__dirname, '../../..');
    const SCANNED = [
        'wrappers/models/utils/decimal.ts',
        'wrappers/models/utils/serialization.ts',
        'wrappers/models/price/Price.ts',
        'wrappers/models/price/price_rules.ts',
        'wrappers/models/transaction/transaction.ts',
        'wrappers/models/security/BondSecurity.ts',
        'wrappers/models/security/Issuance.ts',
        'wrappers/models/security/MortgageBackedSecurity.ts',
        'wrappers/models/security/TIPSBond.ts',
        'wrappers/models/security/FloatingRateNote.ts',
        'wrappers/models/security/security_rules.ts',
    ];
    test.each(SCANNED)('%s has no float conversion on the decimal path', (file) => {
        const lines = fs.readFileSync(path.join(NODE, file), 'utf8').split('\n');
        const allowed = [];
        lines.forEach((line, n) => {
            // Comment lines don't count.
            const code = /^\s*(\*|\/\*)/.test(line) ? '' : line.split('//')[0];
            expect({ file, line: n + 1, code, banned: /parseFloat|parseInt|\.toNumber\(/.test(code) })
                .toEqual({ file, line: n + 1, code, banned: false });
            if (/\bNumber\(/.test(code))
                allowed.push(n + 1);
        });
        // The one documented, range-checked conversion in smallInt().
        const expectedNumberCalls = file.endsWith('utils/decimal.ts') ? 1 : 0;
        expect(allowed.length).toBe(expectedNumberCalls);
        if (expectedNumberCalls)
            expect(lines[allowed[0] - 1]).toContain('lossless-allow');
    });
    test('serialize(number) accepts only safe integers', () => {
        expectInvalid(() => serialization_1.ProtoSerializationUtil.serialize(0.1));
        expectInvalid(() => serialization_1.ProtoSerializationUtil.serialize(2 ** 53));
        const proto = serialization_1.ProtoSerializationUtil.serialize(42);
        expect(hex(proto.getUnscaledValue_asU8())).toBe('2a');
        expect(proto.getScale()).toBe(0);
    });
    test('serialize(Decimal) writes the compact form; deserialize returns a Decimal', () => {
        const proto = serialization_1.ProtoSerializationUtil.serialize(new decimal_js_1.Decimal('-123.45'));
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(proto))).toBe('-123.45');
        expect(hex(proto.getUnscaledValue_asU8())).toBe('cfc7');
        const big = CASES.find(c => c.name === 'two_pow_127');
        const read = serialization_1.ProtoSerializationUtil.deserialize(compactOnly(big));
        expect(read).toBeInstanceOf(decimal_js_1.Decimal);
        expect(read.toFixed()).toBe(big.canonical);
    });
    test('a value over the limits is an error, never rounded', () => {
        expectInvalid(() => (0, decimal_1.fromDecimalJs)(new decimal_js_1.Decimal('1e-5000')));
        expectInvalid(() => (0, decimal_1.fromDecimalJs)(new decimal_js_1.Decimal('1e+5000')));
        expectInvalid(() => (0, decimal_1.fromDecimalJs)(new decimal_js_1.Decimal(NaN)));
        expectInvalid(() => (0, decimal_1.encodeDecimal)({ unscaled: BigInt(1), scale: 1.5 }));
    });
});
//# sourceMappingURL=decimal.test.js.map