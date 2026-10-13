import { Decimal } from 'decimal.js';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
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
export declare const MAX_DIGITS = 4096;
export declare const MAX_SCALE = 4096;
/**
 * A minimal unscaled_value longer than this always has more than
 * `MAX_DIGITS` digits, so it is rejected before it is parsed.
 */
export declare const MAX_UNSCALED_BYTES = 1702;
/** An exact decimal: `unscaled x 10^-scale`. `scale` is a count, never a value. */
export interface CompactDecimal {
    unscaled: bigint;
    scale: number;
}
/**
 * Runs `fn`, labelling any ModelValidationError it throws with `field` (for
 * example `price`). Violations that already name a field get it as a prefix.
 */
export declare function withField<T>(field: string, fn: () => T): T;
/**
 * Parses a decimal string such as `1.50` or `1E+3`.
 *
 * Grammar: `[+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?`. No
 * whitespace, no `NaN` or `Infinity`. The exponent is folded into the scale;
 * a negative scale becomes scale 0 (`1E+3` is unscaled 1000, scale 0).
 * Trailing zeros are kept: `1.50` is unscaled 150, scale 2. Anything else, or
 * a result over `MAX_DIGITS` / `MAX_SCALE`, is a ModelValidationError.
 */
export declare function parseDecimalString(s: string): CompactDecimal;
/** Plain notation, never an exponent, keeping trailing zeros: unscaled 150 scale 2 is `1.50`. */
export declare function toCanonicalString(v: CompactDecimal): string;
/** True when `unscaled_value` is empty. A set zero is the byte 0x00. */
export declare function isUnsetDecimal(p: DecimalValueProto): boolean;
/**
 * Decodes a `DecimalValueProto`. An empty `unscaled_value` ("decimal is
 * required but unset") or an over-cap value is a ModelValidationError. Takes
 * the proto only (owner ruling, 12 Oct): label errors with `withField`.
 */
export declare function decodeDecimal(p: DecimalValueProto): CompactDecimal;
/** Encodes fields 11 and 12. */
export declare function encodeDecimal(v: CompactDecimal): DecimalValueProto;
/** `p` rewritten with minimal unscaled bytes, keeping its value and scale. */
export declare function reencodeDecimal(p: DecimalValueProto): DecimalValueProto;
/**
 * The value as a decimal.js `Decimal`, built from the canonical string. The
 * `Decimal` constructor is exact and ignores the global `precision`. A
 * `Decimal` does not keep trailing zeros, so `1.50` reads back as `1.5`.
 */
export declare function toDecimalJs(v: CompactDecimal): Decimal;
/**
 * The exact value of a decimal.js `Decimal`, from `toFixed()`, which never
 * rounds when given no argument. A `Decimal` does not keep trailing zeros, so
 * `new Decimal('1.50')` becomes scale 1: callers that need scale 2 use
 * `parseDecimalString('1.50')`. Negative zero becomes 0. NaN, Infinity and
 * values over the limits are a ModelValidationError.
 */
export declare function fromDecimalJs(d: Decimal): CompactDecimal;
