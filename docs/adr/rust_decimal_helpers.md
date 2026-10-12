# ADR: Rust decimal helpers and the `test-utils` feature

## Status

Accepted for Rust (LM-312). Java, Python and JS equivalents are separate items if needed.

## Context

Rust services wrote their own decimal helpers around `ProtoSerializationUtil::deserialize_decimal` and `decimal_proto`, and the copies drifted:

- price-service-rust has test builders `dec`, `legacy` and `value_and_scale`. `legacy` hand-encodes wire bytes with a 1-byte length.
- valuation-service has `decimal_from_proto`, `decimal_to_proto` and `decode_error_message`, and its bootstrapper repeats "missing is an error, a bad decode is an error" three times.
- valuation-service's tests find every decimal in a message by parsing `{:?}` output, which breaks when `Debug` output or field names change.

Per the project's "Models first" rule, logic that exists in two or more places belongs in ledger-models.

## Decision

### `require_decimal` (production)

`utils::decimal::require_decimal(&Option<DecimalValueProto>, field) -> Result<Decimal, Error>`:

- `None` is `Error::Validation` with message `decimal is required but unset`, the same text `decode_decimal` gives for an empty `DecimalValueProto`, labelled with `field`.
- `Some(p)` is `deserialize_decimal(p).map_err(|e| e.in_field(field))`.

It only composes existing functions: no new decode path, no wire change. It returns the library `Error`; mapping to a gRPC status stays in each service, and no new `tonic` coupling is added.

`Error`'s `Display` is unchanged. It already joins violations with `; ` as `<field>: <message> (id <uuid>)`, with `(id null)` when there is no object id, matching Java's `ModelValidationException`. Callers use `to_string()` instead of their own formatter.

### `test-utils` feature

`utils::decimal_test_utils` is compiled only with `features = ["test-utils"]`, which also enables the optional `prost-reflect` dependency. Default features are empty, so production builds compile neither. Consumers add the feature under `[dev-dependencies]` only; with Cargo resolver 2 (the default for edition 2021) it then stays out of their production build. `scripts/checks/test.sh` fails if `prost-reflect` appears in the default dependency tree.

It provides:

- Builders: `string_only` (field 10 only, kept as written), `compact_only` (fields 11 and 12 only) and `both_forms` (what `encode_decimal` writes). `form_of` and `value_and_scale` read a decimal back. No wire bytes are written by hand.
- `find_decimals(&msg)`: every `DecimalValueProto` in a message, with its path (`bond_details.face_value`, `curve_inputs[1].tenor`).
- `rewrite_decimals(&msg, form)`: a copy with every set decimal in one form, value and scale kept.

### Why reflection

The finder has to work for any message, including fields added later, without parsing `{:?}` output. Two ways were considered:

- **Reflection (chosen):** encode the message, decode it as a `prost_reflect::DynamicMessage` against the descriptor set already embedded as `LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET`, and walk messages, lists and maps. No codegen change.
- **A generated visitor in `gen.rs`:** checked at compile time, but every `./compile.sh` would regenerate it, making the generator a second thing to keep correct.

The walk treats a `DecimalValueProto` as a leaf: it never recurses into a found decimal, so nothing is counted twice.

### Finding the descriptor from the Rust type

`prost` 0.11 has no `Name` trait, so the proto full name comes from `std::any::type_name::<M>()`. Module paths in `lib.rs` mirror the proto packages, so the first `::` segment (the crate name, whatever it is called) is dropped and the remaining `::` become `.`: `ledger_models::fintekkers::models::security::SecurityProto` is `fintekkers.models.security.SecurityProto`.

Prost's nested messages live in snake_case modules and do not map; nor does any type outside the descriptor set. Both panic with a message naming the type. A unit test pins the mapping for `DecimalValueProto`, `SecurityProto` and `CurveRequestProto`. A module rename in `lib.rs` that breaks the mirror fails that test.

## Consequences

- `prost-reflect` must stay on the same minor line as `prost` (0.11 today). A mismatch fails to compile, so it is visible.
- If `ledger_models_file_descriptor_set_v_todo.bin` lags the generated code, the finder misses fields. The literal counts in `tests/decimal_test_utils_test.rs` catch it; the fix is `./compile.sh`.
- Services can delete their copies once they pin the release that ships these helpers. That is done in follow-up items per service.
