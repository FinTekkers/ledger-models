# ADR: Compact object type and version (`ObjectTypeProto` + `version_major/minor/patch`)

## Status

Accepted (LM-297), stage 1: the proto change and regenerated bindings, plus
an `ObjectTypes` helper in each language. Library writers set both forms and
readers translate the strings-only form. Stage 2 stops the string writes. Stage 3 deletes the strings. This is the same staging
as the compact decimals (LM-294 → LM-295 → LM-296).

## Context

49 messages in 46 `.proto` files carry `string object_class = 1` and
`string version = 2`. Writers fill them with irregular strings, such as
`"PriceProto"` (Python) and `"Price"` (Java, Rust, JS) on the same message,
plus `"0.0.1"`. On a stored price they take about 30 of 126 bytes. No library
code reads `object_class`.

## Decision

1. **One enum, one file.** `fintekkers/models/util/object_type.proto` defines
   `ObjectTypeProto`:
   - `OBJECT_TYPE_UNKNOWN = 0`, plus one value per message with `object_class`.
   - Value name: the message name without `Proto`, in SCREAMING_SNAKE, with the
     `OBJECT_TYPE_` prefix so it can't clash with other enums in
     `fintekkers.models.util`. For example, `QuerySecurityRequestProto` becomes
     `OBJECT_TYPE_QUERY_SECURITY_REQUEST` and `API_Key` becomes
     `OBJECT_TYPE_API_KEY`.
   - Numbers: models use `1–99` and requests `101+`, in alphabetical order when
     the enum was created. After that they are **append-only**. A removed value
     is `reserved`, never reused. `test-fixtures/object-type/enum-numbers.json`
     pins the numbers, and a test fails on any renumbering or removal.
2. **Same field numbers on every message:**

   | Field | Number | Type |
   | --- | --- | --- |
   | `object_type` | `1001` | `fintekkers.models.util.ObjectTypeProto` |
   | `version_major` | `1002` | `uint32` |
   | `version_minor` | `1003` | `uint32` |
   | `version_patch` | `1004` | `uint32` |

   - Before this change, no message used a number ≥ 1000. The only `reserved`
     entry is `security.proto`'s `reserved 15`.
   - A test against the `v0.4.33` descriptors proves 1001–1004 were never used
     or reserved on any of the 49 messages.
   - A single block that is the same everywhere is easy to grep, and easy to
     delete or `reserve` later.
   - Tags ≥ 16 take 2 bytes. A stored price goes from about 30 bytes of strings
     to 6 bytes: `object_type` (3 bytes) and `version_patch` (3 bytes). Major
     and minor are 0 for `"0.0.1"`, so proto3 doesn't write them.
3. **Fields 1 and 2 keep their numbers and meaning** and are marked
   `[deprecated = true]`. Writers still set them until stage 2.
4. **Legacy strings live in the descriptor.** A custom option,
   `repeated string legacy_object_class = 50001` on `EnumValueOptions`, lists the
   strings the library writes for each value, for example
   `OBJECT_TYPE_PRICE = 11 [(legacy_object_class) = "Price", (legacy_object_class) = "PriceProto"]`.
   - Each language builds its string-to-enum map from the generated
     descriptor, never from a hand-written list of names.
   - JS (`google-protobuf`) and Rust (`prost`) can't read custom options at
     runtime. `scripts/gen-object-type-legacy-map.py` writes a mirror of the map
     for each, from the Python descriptor. `scripts/checks/test.sh` runs it with
     `--check` and fails on drift.
   - 50001 is in the in-house extension range (50000–99999).
5. **Each string sits on exactly one value.** Some strings were written on
   more than one message type. The string is attached to the query request,
   and a reader that falls back to the string takes the decoded message's own
   type when the two disagree:
   - `"SecurityRequest"`: query and create security requests (JS), and the
     query transaction request (JS `TransactionService.ts`).
   - `"PortfolioRequest"`, `"TransactionRequest"`, `"PriceRequest"`: query and
     create requests (JS).

   Strings written only by tests (`"Request"`, `" MyClass"`) are not attached
   and decode to `OBJECT_TYPE_UNKNOWN`. The descriptor test
   (`test_object_type_descriptor.py`, `LIBRARY_WRITTEN_STRINGS`) names the
   write site of every attached string.
6. **Writing and reading go through one helper per language:**

   | Language | Helper | Warning sink |
   | --- | --- | --- |
   | Java | `common.util.ObjectTypes` | `java.util.logging` |
   | Python | `fintekkers.wrappers.util.object_types` | `logging` |
   | JS | `node/wrappers/util/object-types.ts` | `console.warn` |
   | Rust | `fintekkers::wrappers::util::object_types` | the `log` crate |

   - `stamp` sets the strings and the new fields together. Library code writes
     `object_class` nowhere else. `scripts/checks/test.sh` checks this with a
     grep for Java, Python and JS, and with `-D deprecated` for Rust.
   - Readers (`read_type` / `read_version`, or `upgrade`) use the new fields
     first and fall back to the strings field by field. An unknown string gives
     `UNKNOWN`. A malformed version gives `0.0.0`. A fallback logs one warning
     per distinct pair of strings and never throws. Empty strings are the proto3
     default, so they fall back silently.
   - `test-fixtures/object-type-legacy.json` holds strings-only bytes from
     today's writers, plus malformed and per-field rows. All four languages
     decode it.

## Consequences

- **No wire break.** Old readers skip 1001–1004 as unknown fields, and keep
  them when they re-serialise. `ObjectTypeOldReaderTest` decodes new-form bytes
  of all 49 messages with the `v0.4.33` descriptors
  (`test-fixtures/object-type/legacy-descriptors-v0.4.33.binpb`, built by
  `scripts/fixtures/make-legacy-descriptors.sh`).
- **Deprecation warnings.** The generated Java accessors for `object_class`
  and `version` are `@Deprecated`, and prost marks the Rust struct fields
  `#[deprecated]`. Consumers built with `-Werror` or `deny(warnings)` fail
  until they move to the helpers. Consumers to upgrade: `ledger-service`
  (Java), `price-service-rust`, `valuation-service` and `broker-service`
  (Rust), and `ui-service` (JS).
- **Rust struct literals** that list every field now need the new fields or
  `..Default::default()`. The Rust builders (`PriceProtoBuilder`,
  `PortfolioProtoBuilder`, `SecurityProtoBuilder`) now return a `Validation`
  error on `version` when the version string is not empty or `MAJOR.MINOR.PATCH`.
  The Rust crate gains a `log` dependency.
- **A new message with `object_class`** fails the descriptor test until it gets
  the four fields and an enum value.
- **Rollback after release:** remove the fields, add `reserved 1001 to 1004;` to
  every message, and keep the enum file so its numbers are never reused.
