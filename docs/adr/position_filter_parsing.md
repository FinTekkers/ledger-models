# ADR: Typed parsing of PositionFilterProto (Rust)

Status: accepted (LM-299). Rust-only; Java, Python and JS are a separate item.

## Context

Rust services read `PositionFilterProto` entries with getters such as
`PositionFilter::get_uuid`. They accept one encoding per field, and
`PositionFilter::matches` returns `false` for anything it does not understand.
Bad or unexpected filters were silently skipped (price-service PSR-2, PSR-3,
PSR-7).

## Decision

`PositionFilter::parse()` (in
`ledger-models-rust/fintekkers/wrappers/models/position_filter_parser.rs`)
returns every entry as a typed `ParsedFilter { field, operator, value }`, or
one `FilterParseError` for the first bad entry. It is all-or-nothing: a filter
never comes back with an entry skipped. `parse_entry` checks a single entry.
The existing getters and `matches` are unchanged. No proto changes; the proto
comments stay as they are.

### Field → kind table

| Kind | Fields | Accepted encodings |
| --- | --- | --- |
| UUID | `ID`, `SECURITY_ID`, `PORTFOLIO_ID`, `PRICE_ID` | packed `fintekkers.models.util.UUIDProto`, or `string_value` accepted by `Uuid::parse_str` (e.g. hyphenated) |
| Timestamp | `AS_OF` | packed `fintekkers.models.util.LocalTimestampProto`, or `string_value` in RFC 3339 **with an offset** (`2026-10-12T00:00:00Z`); strings are returned in UTC |
| Date | `EFFECTIVE_DATE`, `ISSUE_DATE`, `MATURITY_DATE`, `TRADE_DATE`, `SETTLEMENT_DATE`, `TAX_LOT_OPEN_DATE`, `TAX_LOT_CLOSE_DATE` | packed `fintekkers.models.util.LocalDateProto`, or `string_value` as `YYYY-MM-DD` |
| Enum | `TRANSACTION_TYPE`, `POSITION_STATUS` | `enum_value` within `TransactionTypeProto` / `PositionStatusProto` |
| Bool | `IS_CANCELLED` | packed `google.protobuf.BoolValue`, or `string_value` `true` / `false` |
| String | `ASSET_CLASS`, `PRODUCT_CLASS`, `PRODUCT_TYPE`, `SECURITY_DESCRIPTION`, `SECURITY_ISSUER_NAME`, `PORTFOLIO_NAME` | `string_value`, or packed `google.protobuf.StringValue` (how Java and Python clients send it) |
| Unsupported | `SECURITY`, `CASH_IMPACT_SECURITY`, `PORTFOLIO`, `PRICE`, `STRATEGY`, `IDENTIFIER`, `TENOR`, `ADJUSTED_TENOR` | none: `UnsupportedField`. Filter on the object's id or attributes instead |

The table is an exhaustive `match` on `FieldProto` with no catch-all, so adding
a `FieldProto` value fails to compile until it is given a kind here. Update
this ADR in the same change.

### Other rules

- A packed value's `type_url`, when non-empty, must end in `/<full proto
  name>` (e.g. `/fintekkers.models.util.UUIDProto`, the wire name, not the
  Rust type name `UuidProto`). Otherwise `WrongValueKind`.
- `UNKNOWN_FIELD` (0) and numbers outside `FieldProto` give `UnknownField`.
- `UNKNOWN_OPERATOR` (0) and numbers outside `PositionFilterOperator` give
  `UnknownOperator`. Proto3 sends 0 when a client forgot the operator, so
  passing it through would recreate the silent-skip bug.
- An empty oneof gives `MissingValue`.
- Every `FilterParseError` carries the raw field and operator numbers, and its
  `Display` names them (`filter SECURITY_ID EQUALS: malformed UUID string ...`).
- The parser never panics on input: the module denies clippy's `unwrap_used`,
  `expect_used`, `indexing_slicing` and `panic`, and `cargo clippy --lib` runs
  in `scripts/checks/test.sh` and CI.

## Consequences

- Services get one call that either fully understands a filter or says
  exactly which entry is wrong, ready to map to `INVALID_ARGUMENT`.
- Errors stop at the first bad entry. A `to_violation()` returning
  `FieldViolationProto` is a possible follow-up.
- The same parser in Java, Python and JS is a separate item.
