# ADR: Row-cap marker on price query responses (`truncated`, `row_cap`)

## Status

Accepted (LM-348). Proto fields, comments and wire tests only; the server
side that sets the fields is PSR-46 (price-service-rust).

## Context

`QueryPriceRequestProto.limit = 27` documents a default cap (typically 1000)
when `limit` is unset or `< 1`, and a hard ceiling above which `limit` is
clamped silently. A caller that hits either cap gets a short result and,
apart from a default-cap warning in `errors_or_warnings`, no way to tell it
was cut off or what cap applied.

## Decision

Add two plain proto3 scalars to `QueryPriceResponseProto` only:

| Field | Type | Number |
| --- | --- | --- |
| `truncated` | `bool` | **new** `60` |
| `row_cap` | `int32` | **new** `61` |

- **Plain scalars, no `optional`, no wrapper types**, the same style as
  `docs/adr/query_paging.md`. A complete result leaves both unset, which reads
  as `false` / `0`, so the wire bytes of a complete result are unchanged and
  existing clients see no difference.
- **Numbers 60/61** sit above the previous highest tag (`next_page_token =
  50`) and leave 51–59 free, matching the gaps the paging ADR left. Nothing
  is reserved.
- No request field, cursor or RPC changes. `limit`, `as_of`, `horizon` and
  `date_range` keep their numbers and comments.

### Contract

The proto comments are the spec.

- **`truncated`** is true only when the server stopped at `row_cap`, more
  matching rows exist, **and `next_page_token` is empty**. Truncation means
  rows the caller cannot reach by paging. A page that returns a
  `next_page_token` is never truncated, even though `limit` doubles as the
  page size; the caller follows the token instead. Without this rule every
  non-final page would be `truncated = true` and "raise `limit`" would be
  wrong advice for callers that page.
- **`row_cap`** is the effective cap the server applied, in rows: the
  request's `limit` clamped to the server ceiling, or the default cap when
  `limit` is unset or `< 1`. A client-set `limit` counts: asking for 100 when
  more rows exist and no token is returned gives `truncated = true,
  row_cap = 100`. Set when `truncated` is true; unset (`0`) when complete.
- **Recovery** when `truncated` is true: raise the request's `limit` up to the
  server ceiling, or narrow the as-of window with a shorter `date_range` or
  `horizon`. The item text said "narrow the `asof` window"; the request has no
  field named `asof` (`as_of = 23` is a single timestamp), and the window is
  `oneof time_range { horizon = 25; date_range = 26; }`, so the comment names
  the real fields.
- **Unset is ambiguous by design.** A server that predates PSR-46 never sets
  `truncated`, so "not truncated" and "not reported" look the same. The
  default-cap warning in `errors_or_warnings` is unchanged and still the
  signal from older servers. Explicit presence (`optional`) was rejected: it
  breaks the paging ADR's no-presence rule and adds a third state to define.

### RPCs

`PriceService` returns `QueryPriceResponseProto` from three RPCs:

- **`Search`** (server-streaming) can truncate. Only the **final** message of
  the stream carries `truncated` and `row_cap`; `row_cap` counts rows across
  the whole stream, as `limit` does.
- **`ListIds`** (unary) can truncate: it returns the matching price IDs under
  the same `limit` and caps.
- **`GetByIds`** (unary) looks up the IDs the caller names. Its result size is
  bounded by the request, so servers are not expected to truncate it; if a
  server does cap it, the same rule applies.

### `limit` comment tension

The `limit` comment holds two paragraphs: the shared paging block ("Unset or
0 = no client page cap; the server keeps today's behaviour") and Price's
older paragraph ("If unset or < 1 the server applies a default cap"). They
agree for Price because "today's behaviour" on Price is the default cap.
`row_cap` follows the second paragraph. The `limit` comment is not edited
here: the item's guardrail forbids changing its meaning.

## Tests

- `ledger-models-python/test/requests/test_query_price_truncation_contract.py`
  — types, numbers above 50, no presence, existing fields snapshot, comment
  phrases including the `next_page_token` rule, and the Python wire tests.
- Wire tests in every other binding (round-trip with existing fields; parse
  without the new fields reads `false` / `0`; explicit `false` / `0` encodes
  the same as unset):
  - Java `ledger-models-java/src/test/java/common/requests/QueryPriceTruncationTest.java`
  - Rust `ledger-models-rust/tests/query_price_truncation_test.rs`
  - JS `ledger-models-javascript/node/wrappers/requests/query-price-truncation.test.ts`
- `scripts/checks/wire-diff.py` rule `lm348` allows exactly the two additions.

Server behaviour (the stream rule, the `next_page_token` rule, the value of
`row_cap`) cannot be tested here and belongs in PSR-46.
