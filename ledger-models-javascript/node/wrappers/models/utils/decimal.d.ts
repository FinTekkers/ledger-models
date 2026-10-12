import { Decimal } from 'decimal.js';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
/**
 * Codec for `DecimalValueProto` (LM-306, the JS side of LM-294; see
 * docs/adr/compact_decimal.md and the Rust reference in
 * ledger-models-rust/fintekkers/wrappers/models/utils/decimal.rs).
 *
 * value = unscaled x 10^-scale, where `unscaled_value` (field 11) is a minimal
 * two's-complement big-endian integer of any size and `scale` is field 12. A
 * non-empty `unscaled_value` means the compact form is set and it wins.
 * Otherwise the deprecated `arbitrary_precision_value` string (field 10) is
 * read, with a warning logged once per process (LM-307).
 *
 * Lossless: no binary floating point on any path (no JS `number` value, no
 * `parseFloat`). A value that cannot be represented exactly is a
 * `ModelValidationError`, never rounded. The codec does not know which field
 * it is decoding: a caller that wants the field named wraps the call in
 * `withField`.
 *
 * Stage 1 (until LM-295): writers set both forms, so readers on older
 * ledger-models keep working. This module is the only code allowed to touch
 * the deprecated string field.
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
/** Where the once-per-process deprecation warning goes. Defaults to `console`. */
export interface DecimalLogger {
    warn(message: string): void;
}
/** Sends the deprecation warning to `l` from now on. Tests use it to spy. */
export declare function setDecimalLogger(l: DecimalLogger): void;
/**
 * Runs `fn`, labelling any ModelValidationError it throws with `field` (for
 * example `price`). Violations that already name a field get it as a prefix.
 */
export declare function withField<T>(field: string, fn: () => T): T;
/**
 * Parses a decimal string, as written to `arbitrary_precision_value`.
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
/** True when neither form is set: `unscaled_value` and `arbitrary_precision_value` are both empty. */
export declare function isUnsetDecimal(p: DecimalValueProto): boolean;
/**
 * Decodes a `DecimalValueProto`. The compact form wins when set. Otherwise
 * falls back to the deprecated string and logs a deprecation warning, once
 * per process. Both forms empty is a ModelValidationError; so is a malformed
 * or over-cap value. Takes the proto only (owner ruling, 12 Oct): label
 * errors with `withField`.
 */
export declare function decodeDecimal(p: DecimalValueProto): CompactDecimal;
/**
 * Encodes both forms (stage 1): fields 11 and 12, plus the canonical string
 * in field 10 for readers on ledger-models older than v0.4.34.
 */
export declare function encodeDecimal(v: CompactDecimal): DecimalValueProto;
/**
 * `p` rewritten in both forms (stage 1), keeping its value and scale. Used
 * when re-saving a message loaded from older bytes.
 */
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
