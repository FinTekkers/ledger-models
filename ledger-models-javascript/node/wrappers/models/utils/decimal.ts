import { Decimal } from 'decimal.js';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { ModelValidationError, violation } from '../errors';

/**
 * Codec for `DecimalValueProto` (LM-306, the JS side of LM-294; see
 * docs/adr/compact_decimal.md and the Rust reference in
 * ledger-models-rust/fintekkers/wrappers/models/utils/decimal.rs).
 *
 * value = unscaled x 10^-scale, where `unscaled_value` (field 11) is a minimal
 * two's-complement big-endian integer of any size and `scale` is field 12. A
 * non-empty `unscaled_value` means the decimal is set; empty means unset. The
 * old string form, field 10, was deleted by LM-318.
 *
 * Lossless: no binary floating point on any path (no JS `number` value, no
 * `parseFloat`). A value that cannot be represented exactly is a
 * `ModelValidationError`, never rounded. The codec does not know which field
 * it is decoding: a caller that wants the field named wraps the call in
 * `withField`.
 */

/**
 * Most decimal digits allowed in the unscaled value, and the largest scale.
 * The same in every language (see the ADR).
 */
export const MAX_DIGITS = 4096;
export const MAX_SCALE = 4096;
/**
 * A minimal unscaled_value longer than this always has more than
 * `MAX_DIGITS` digits, so it is rejected before it is parsed.
 */
export const MAX_UNSCALED_BYTES = 1702;

// No bigint literals: tsconfig targets es2016.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const EIGHT = BigInt(8);

/** An exact decimal: `unscaled x 10^-scale`. `scale` is a count, never a value. */
export interface CompactDecimal {
    unscaled: bigint;
    scale: number;
}

/** An unlabelled ModelValidationError: the field is empty until `withField` adds it. */
function invalid(message: string): ModelValidationError {
    return new ModelValidationError([violation('', undefined, message)]);
}

/**
 * Runs `fn`, labelling any ModelValidationError it throws with `field` (for
 * example `price`). Violations that already name a field get it as a prefix.
 */
export function withField<T>(field: string, fn: () => T): T {
    try {
        return fn();
    } catch (e) {
        if (!(e instanceof ModelValidationError)) throw e;
        throw new ModelValidationError(e.violations.map(v => {
            const labelled = v.clone();
            labelled.setField(v.getField() ? `${field}.${v.getField()}` : field);
            return labelled;
        }));
    }
}

/** At most the first 64 characters of `s`, for error messages. */
function preview(s: string): string {
    return JSON.stringify(s.slice(0, 64));
}

function overCap(s: string): ModelValidationError {
    return invalid(`decimal is over the limit of ${MAX_DIGITS} digits or scale ${MAX_SCALE}: ${preview(s)}`);
}

/**
 * The only conversion from bigint to a JS number: `b` must already be
 * range-checked against MAX_DIGITS / MAX_SCALE, so it is a small integer and
 * the conversion is exact.
 */
function smallInt(b: bigint): number {
    const limit = BigInt(Math.max(MAX_DIGITS, MAX_SCALE));
    if (b < -limit || b > limit) {
        throw invalid(`decimal count ${b} is outside the limits`);
    }
    return Number(b); // lossless-allow: range-checked above, |b| <= 4096
}

function isDigit(c: string | undefined): boolean {
    return c !== undefined && c >= '0' && c <= '9';
}

/**
 * Parses a decimal string such as `1.50` or `1E+3`.
 *
 * Grammar: `[+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?`. No
 * whitespace, no `NaN` or `Infinity`. The exponent is folded into the scale;
 * a negative scale becomes scale 0 (`1E+3` is unscaled 1000, scale 0).
 * Trailing zeros are kept: `1.50` is unscaled 150, scale 2. Anything else, or
 * a result over `MAX_DIGITS` / `MAX_SCALE`, is a ModelValidationError.
 */
export function parseDecimalString(s: string): CompactDecimal {
    const notADecimal = () => invalid(`decimal is not a finite decimal: ${preview(s)}`);
    let i = 0;
    let negative = false;
    if (s[0] === '-' || s[0] === '+') {
        negative = s[0] === '-';
        i = 1;
    }
    const intStart = i;
    while (isDigit(s[i])) i++;
    const intDigits = s.slice(intStart, i);
    let fracDigits = '';
    if (s[i] === '.') {
        i++;
        const fracStart = i;
        while (isDigit(s[i])) i++;
        fracDigits = s.slice(fracStart, i);
    }
    if (intDigits === '' && fracDigits === '') throw notADecimal();
    let exponent = ZERO;
    if (s[i] === 'e' || s[i] === 'E') {
        i++;
        let expNegative = false;
        if (s[i] === '-' || s[i] === '+') {
            expNegative = s[i] === '-';
            i++;
        }
        const expStart = i;
        while (isDigit(s[i])) i++;
        if (i === expStart) throw notADecimal();
        const expDigits = s.slice(expStart, i).replace(/^0+/, '');
        // Any exponent this long is far past the caps below.
        if (expDigits.length > 12) throw overCap(s);
        const magnitude = expDigits === '' ? ZERO : BigInt(expDigits);
        exponent = expNegative ? -magnitude : magnitude;
    }
    if (i !== s.length) throw notADecimal();

    const significant = (intDigits + fracDigits).replace(/^0+/, '');
    const scale = BigInt(fracDigits.length) - exponent;
    if (significant === '') {
        // Zero has no sign and keeps its scale (`0.00` is scale 2); `0E+3` is scale 0.
        const zeroScale = scale < ZERO ? ZERO : scale;
        if (zeroScale > BigInt(MAX_SCALE)) throw overCap(s);
        return { unscaled: ZERO, scale: smallInt(zeroScale) };
    }
    const zerosToAppend = scale < ZERO ? -scale : ZERO;
    if (scale > BigInt(MAX_SCALE) || BigInt(significant.length) + zerosToAppend > BigInt(MAX_DIGITS)) {
        throw overCap(s);
    }
    const magnitude = BigInt(significant + '0'.repeat(smallInt(zerosToAppend)));
    return {
        unscaled: negative ? -magnitude : magnitude,
        scale: smallInt(scale < ZERO ? ZERO : scale),
    };
}

/** Plain notation, never an exponent, keeping trailing zeros: unscaled 150 scale 2 is `1.50`. */
export function toCanonicalString(v: CompactDecimal): string {
    const negative = v.unscaled < ZERO;
    const digits = (negative ? -v.unscaled : v.unscaled).toString();
    const sign = negative ? '-' : '';
    if (v.scale === 0) return sign + digits;
    if (digits.length > v.scale) {
        return `${sign}${digits.slice(0, digits.length - v.scale)}.${digits.slice(digits.length - v.scale)}`;
    }
    return `${sign}0.${'0'.repeat(v.scale - digits.length)}${digits}`;
}

/** Minimal two's-complement big-endian bytes. Zero is the single byte 0x00. */
function bigIntToBytes(n: bigint): Uint8Array {
    let hex: string;
    if (n >= ZERO) {
        hex = n.toString(16);
        if (hex.length % 2 === 1) hex = '0' + hex;
        // A leading byte >= 0x80 would read back as negative.
        if (/^[89a-f]/.test(hex)) hex = '00' + hex;
    } else {
        const magnitude = -n;
        let length = (magnitude.toString(16).length + 1) >> 1;
        // The most negative value in `length` bytes is -(2^(8*length - 1)).
        if (magnitude > ONE << (BigInt(length) * EIGHT - ONE)) length++;
        hex = ((ONE << (BigInt(length) * EIGHT)) + n).toString(16);
        hex = '0'.repeat(length * 2 - hex.length) + hex;
    }
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = (hexValue(hex[2 * i]) << 4) | hexValue(hex[2 * i + 1]);
    }
    return out;
}

function hexValue(c: string): number {
    return '0123456789abcdef'.indexOf(c);
}

/** Reads two's-complement big-endian bytes of any length; non-minimal input is fine. */
function bytesToBigInt(bytes: Uint8Array): bigint {
    if (bytes.length === 0) return ZERO;
    let hex = '';
    for (const b of bytes) hex += (b < 16 ? '0' : '') + b.toString(16);
    const unsigned = BigInt('0x' + hex);
    return bytes[0] & 0x80 ? unsigned - (ONE << (BigInt(bytes.length) * EIGHT)) : unsigned;
}

/**
 * Decodes the compact form (fields 11 and 12). Rejects a scale over
 * `MAX_SCALE`, then bytes over `MAX_UNSCALED_BYTES`, then more than
 * `MAX_DIGITS` digits, before any large allocation (the same order as Rust).
 */
function decodeCompact(unscaledValue: Uint8Array, scale: number): CompactDecimal {
    if (scale > MAX_SCALE) {
        throw invalid(`decimal has scale ${scale}, over the limit of ${MAX_SCALE}`);
    }
    if (unscaledValue.length > MAX_UNSCALED_BYTES) {
        throw invalid(`decimal has a ${unscaledValue.length}-byte unscaled_value, over the limit of ${MAX_UNSCALED_BYTES} bytes`);
    }
    const unscaled = bytesToBigInt(unscaledValue);
    if ((unscaled < ZERO ? -unscaled : unscaled).toString().length > MAX_DIGITS) {
        throw invalid(`decimal has more than ${MAX_DIGITS} digits`);
    }
    return { unscaled, scale };
}

/** True when `unscaled_value` is empty. A set zero is the byte 0x00. */
export function isUnsetDecimal(p: DecimalValueProto): boolean {
    return p.getUnscaledValue_asU8().length === 0;
}

/**
 * Decodes a `DecimalValueProto`. An empty `unscaled_value` ("decimal is
 * required but unset") or an over-cap value is a ModelValidationError. Takes
 * the proto only (owner ruling, 12 Oct): label errors with `withField`.
 */
export function decodeDecimal(p: DecimalValueProto): CompactDecimal {
    const unscaledValue = p.getUnscaledValue_asU8();
    if (unscaledValue.length === 0) {
        throw invalid('decimal is required but unset');
    }
    return decodeCompact(unscaledValue, p.getScale());
}

/** Encodes fields 11 and 12. */
export function encodeDecimal(v: CompactDecimal): DecimalValueProto {
    if (typeof v.unscaled !== 'bigint') {
        throw invalid('decimal unscaled value must be a bigint');
    }
    if (!Number.isInteger(v.scale) || v.scale < 0 || v.scale > MAX_SCALE) {
        throw invalid(`decimal scale must be an integer from 0 to ${MAX_SCALE}: ${v.scale}`);
    }
    return new DecimalValueProto()
        .setUnscaledValue(bigIntToBytes(v.unscaled))
        .setScale(v.scale);
}

/** `p` rewritten with minimal unscaled bytes, keeping its value and scale. */
export function reencodeDecimal(p: DecimalValueProto): DecimalValueProto {
    return encodeDecimal(decodeDecimal(p));
}

/**
 * The value as a decimal.js `Decimal`, built from the canonical string. The
 * `Decimal` constructor is exact and ignores the global `precision`. A
 * `Decimal` does not keep trailing zeros, so `1.50` reads back as `1.5`.
 */
export function toDecimalJs(v: CompactDecimal): Decimal {
    return new Decimal(toCanonicalString(v));
}

/**
 * The exact value of a decimal.js `Decimal`, from `toFixed()`, which never
 * rounds when given no argument. A `Decimal` does not keep trailing zeros, so
 * `new Decimal('1.50')` becomes scale 1: callers that need scale 2 use
 * `parseDecimalString('1.50')`. Negative zero becomes 0. NaN, Infinity and
 * values over the limits are a ModelValidationError.
 */
export function fromDecimalJs(d: Decimal): CompactDecimal {
    if (!d.isFinite()) {
        throw invalid(`decimal is not a finite decimal: ${d.toString()}`);
    }
    // Checked before toFixed(), which would write every digit out.
    if (d.e >= MAX_DIGITS || d.decimalPlaces() > MAX_SCALE) {
        throw overCap(d.toString());
    }
    return parseDecimalString(d.toFixed());
}
