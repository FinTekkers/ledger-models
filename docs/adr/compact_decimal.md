# ADR: Compact binary form for DecimalValueProto

## Status

**Superseded by LM-318** for the string field: see the section at the end. The compact form is unchanged.

Accepted for Rust (LM-294). Java and JS follow in LM-294b and LM-294d, and Python in LM-305, using the same fixtures. This is stage 1 of 3: LM-295 stops writing the string, and LM-296 deletes it.

## Context

Every decimal is `string arbitrary_precision_value = 10`, about 13 bytes per value against roughly 5–7 in binary. A 2023 sketch in `decimal_value.proto` (`uint32 scale = 1`, `bytes value = 3`) was commented out and never released.

Services upgrade ledger-models at different times, so readers on older releases must keep working while the new form rolls out.

## Decision

### Wire format

```proto
message DecimalValueProto {
  reserved 1, 3;
  string arbitrary_precision_value = 10 [deprecated = true];
  bytes unscaled_value = 11;
  uint32 scale = 12;
}
```

- **value = unscaled_value × 10^-scale.**
- `unscaled_value` is a **minimal two's-complement big-endian** integer of any size. Zero is the single byte `0x00`. `-1` is `0xff`; `150` is `0x0096` (the leading `0x00` keeps it positive). Readers accept non-minimal input (`0x0001`, `0xffff`); writers always emit the minimal form.
- `scale` is never negative. An exponent string such as `1E+3` becomes unscaled 1000, scale 0.
- Field 10 keeps its number, type and meaning. 11 and 12 are new numbers. 1 and 3 are reserved so the 2023 sketch can never be reused with a different meaning.
- Fields are declared, and so serialised, in the order 10, 11, 12. Proto3 leaves `scale` out when it is 0.
- Flat fields, not a nested message: a nested `CompactDecimal` would cost 2–3 bytes and an allocation per value.

### Presence rule

Proto3 cannot tell an empty `bytes` from an unset one, so:

- **Non-empty `unscaled_value` means the compact form is set.** It wins over field 10, even if field 10 disagrees or is malformed.
- Otherwise readers fall back to `arbitrary_precision_value`.
- Both empty means the decimal is unset. A set zero is `0x00`, so it is never empty.

### String grammar (field 10)

`[+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?`

No whitespace, no `NaN`, no `Infinity`. Anything else is a typed input error naming the field. Writers emit the **canonical string**: plain notation, no exponent, trailing zeros kept (`1.50`), no sign on zero.

### Limits

The same in every language, so a value one language accepts is never rejected by another:

| Limit | Value |
|---|---|
| Digits in the unscaled value | at most 4,096 |
| `scale` | at most 4,096 |
| `unscaled_value` length | at most 1,702 bytes (checked before parsing) |

These stop input such as `1E+999999999` or `scale = 4000000000` from allocating gigabytes. They apply to both the string and the compact form.

### Lossless

No binary floating point on any encode or decode path. A value that cannot be represented exactly is a typed error, never rounded. In Rust, `CompactDecimal` holds a `num_bigint::BigInt`; converting to `rust_decimal::Decimal` fails with `Error::Validation` when the scale is over 28 or the magnitude needs more than 96 bits.

### Errors

Bad input uses the existing typed input error (docs/adr/typed-input-errors.md). In Rust that is `Error::Validation`. Decoding is one plain call, `ProtoSerializationUtil::deserialize_decimal(&d)`, with no message-type or field arguments (LM-307). Its error names no field; a caller that wants one adds it while handling the error: `deserialize_decimal(&d).map_err(|e| e.in_field("price"))`. `TryFrom<DecimalWrapper> for Decimal` keeps returning `Error::DecimalConversion` for its existing callers. Python matches it (LM-305): `decode_decimal(proto)` takes only the proto and returns an exact `decimal.Decimal` whose exponent is `-scale`; `encode_decimal(value)` takes a `Decimal` or `int` and raises `TypeError` for `float`. Errors are `ModelValidationError`, naming `unscaled_value`, `scale` or `arbitrary_precision_value` but not the parent field.

### Deprecation

- Field 10 carries `[deprecated = true]`. Generated code marks it: `#[deprecated]` in Rust, `@Deprecated` in Java, JSDoc `@deprecated` in JS. Python's generator emits nothing, so LM-305 adds `legacy_string(proto)` in `fintekkers.wrappers.models.util.decimal`, which raises a `DeprecationWarning` on every call. The generated `.arbitrary_precision_value` attribute itself does not warn.
- Each language has one codec, the only code allowed to touch field 10.
- A fallback read of field 10 logs one deprecation warning per process (LM-307). The guard is process-wide and thread-safe, with no per-type or per-call-site key, so the warning names no message type or field. Rust does this now; Java, Python and JS follow in LM-304, LM-305 and LM-306. In Rust it goes through the `log` crate: a service sees it only if it installs a logger (`tracing` consumers bridge `log`). In Python it is one `WARNING` on the `fintekkers.decimal` logger, naming `DecimalValueProto.arbitrary_precision_value`.

### Stages

1. **LM-294 (this):** read both forms, write both forms. Readers on v0.4.33 and older still read field 10. Messages are about 6 bytes larger per decimal for now.
2. **LM-295:** stop writing field 10, once every consumer runs a release that reads the compact form: ledger-service, valuation-service, price-service-rust, ui-service, market-data-inputs. LM-294b/c/d must be released first too.
3. **LM-296:** delete field 10 and reserve 10.

## Shared fixtures

- `ledger-models-protos/fixtures/decimal_compact.json`: the cross-language oracle. Each case gives the input string, canonical string, unscaled hex, scale and the exact stage-1 wire bytes. It also lists string and compact inputs that must fail.
- `ledger-models-protos/fixtures/legacy_v0433/`: price, security and transaction bytes written by the published v0.4.33 (field 10 only), with the expected value and scale at each decimal path. Regenerate with `cargo run --example gen_legacy_decimal_fixtures` in `ledger-models-rust`.

## Consequences

- Rust struct literals `DecimalValueProto { arbitrary_precision_value: .. }` no longer compile without `..Default::default()`, and reading the field warns under `#[deprecated]`. Consumers built with `-D warnings` must use the codec (`decimal_proto`, `deserialize_decimal`) or add `#[allow(deprecated)]`.
- `DecimalWrapper`'s `Display` prints the canonical string when the compact form is set, so `1E+3` now prints `1000`. Other values print as before.
- The Rust tests pin ledger-models `=0.4.33` as a dev-dependency to prove old readers decode new bytes.

## Superseded by LM-318: the string is deleted in place

LM-318 replaced LM-295 and LM-296 with one breaking release, together with
the object type and version cutover (docs/adr/compact_object_type_and_version.md).

- `DecimalValueProto` is `bytes unscaled_value = 11; uint32 scale = 12` and
  nothing else. Field 10 is deleted with no `reserved` line.
- Every codec drops the string read, the string write and the LM-307
  deprecation warning. A non-empty `unscaled_value` means set; an empty one
  means unset, and a required decimal that is unset is the typed
  required-field error (Rust `decimal is required but unset`, Java
  `UnsetDecimalException`). Compact zero (`0x00`) is still set.
- **Bytes written by earlier releases are not readable as values.** A
  decimal with only field 10 parses, with field 10 as an unknown field, and
  reads as unset: the typed error, never `0`. Each language has a test that
  decodes `52 03 31 2e 35` ("1.5" as field 10).
- The `legacy_v0433` decimal fixtures, their generator and the `=0.4.33`
  dev-dependency are deleted. `decimal_compact.json`'s `wire_hex` holds
  fields 11 and 12 only.
- `scripts/checks/proto-shape.sh` fails if a `.proto`, library code or
  generated code in any language names `arbitrary_precision_value`.
