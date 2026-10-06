# ADR: Paging on ListIds and Search requests (`limit`, `page_token`, `next_page_token`)

## Status

Accepted (LM-257). Proto fields, comments and wire tests only; the paging
logic itself lives in the services (ledger-service items following LS-25).

## Context

ledger-service could not meet LS-25's paging requirements (a page cap, and
paging to the end without duplicates): `QuerySecurityRequestProto` had no
page size or page token, `ListIds` is unary and `Search` is server-streaming
with no resume point. The same gap exists for Transaction, Portfolio and
Price queries.

Two of the four request messages already had a `limit`:

- `QueryTransactionRequestProto.limit = 24` — "Max number of records to return".
- `QueryPriceRequestProto.limit = 27` — unset or `< 1` means the server applies
  a default cap (typically 1000) and adds a warning to
  `QueryPriceResponseProto.errors_or_warnings`.

## Decision

Add plain proto3 scalar paging fields to the existing query messages, with
the same names and types on all four entities:

| Message | `limit` (int32) | `page_token` (string) | `next_page_token` (string) |
| --- | --- | --- | --- |
| `QuerySecurityRequestProto` | **new** `50` | **new** `51` | — |
| `QueryTransactionRequestProto` | existing `24` | **new** `51` | — |
| `QueryPortfolioRequestProto` | **new** `50` | **new** `51` | — |
| `QueryPriceRequestProto` | existing `27` | **new** `51` | — |
| `QuerySecurityResponseProto` | — | — | **new** `50` |
| `QueryTransactionResponseProto` | — | — | **new** `50` |
| `QueryPortfolioResponseProto` | — | — | **new** `50` |
| `QueryPriceResponseProto` | — | — | **new** `50` |

- Transaction and Price **reuse** their existing `limit`; a second field named
  `limit` is impossible and a differently named page size would give those
  messages two overlapping caps. Nothing is renamed, renumbered or retyped.
- New numbers sit above every existing number in each message (requests top
  out at 24–27, responses at 30/40). None of the messages has a `reserved`
  range. Transaction and Price leave `50` unused so `page_token = 51` is the
  same everywhere; `50` is not reserved there.
- On Price, `page_token` sits outside `oneof time_range`.
- No `optional` and no wrapper types: unset reads as `0` / `""`, which is
  exactly what old clients send.

### Contract

The proto comments are the spec; the same comment block is on each field in
all four entities (Price keeps its existing default-cap paragraph under it).

- **`limit`** — max records returned in this response: the page size the
  client asks for. Unset or `0` = no client page cap; the server keeps today's
  behaviour for that RPC (Price keeps its documented default cap and warning;
  Transaction keeps "max records to return"). The server may cap `limit` and
  return fewer items. Fewer items does **not** mean last page; only an empty
  `next_page_token` does.
- **`page_token`** — opaque token copied from a previous response's
  `next_page_token`. Unset or empty = first page. Clients must not parse or
  build tokens, and should send the other request fields unchanged across
  pages.
- **`next_page_token`** — opaque token for the next page. Empty = last page.
- **Old clients** that set neither `limit` nor `page_token` get exactly
  today's results; clients that ignore `next_page_token` see today's results.
- **Tokens are opaque.** Models define no token format and encode no cursor;
  each service chooses its own (and may make tokens expire).

### Streaming `Search`

`Search` returns a stream of response messages per call. For `Search`:

- `limit` caps the **total items across the whole stream**, not items per
  streamed message.
- Only the **final** message of the stream carries `next_page_token`; earlier
  messages leave it empty. A client resumes by calling `Search` again with
  that token.

### Errors (guidance for services)

Models define no error codes; gRPC status mapping belongs to the service.

- A malformed, expired or foreign `page_token`: `INVALID_ARGUMENT` is
  recommended.
- A negative `limit` follows each RPC's **existing** behaviour. On Price,
  `limit < 1` already means "apply the default cap", so a negative value stays
  valid there; Transaction keeps whatever it does today. `INVALID_ARGUMENT` is
  suggested only for Security and Portfolio, where `limit` is new.

### Guarantees service tests should prove

These are server behaviour and cannot be tested in this repo (models contain
no paging logic). The ledger-service items should cover:

- a full traversal until `next_page_token` is empty returns every item once:
  no duplicates and nothing skipped;
- a request with no paging fields returns today's results;
- a malformed token returns `INVALID_ARGUMENT`;
- a server-capped `limit` returns fewer items **plus** a non-empty token;
- what happens when the filter changes between pages (recommended: reject the
  token with `INVALID_ARGUMENT`).

## Why not streaming or new RPCs

- **Keep every RPC signature.** `ListIds` and `GetByIds` stay unary and
  `Search` stays server-streaming. Switching `ListIds` to streaming, or adding
  a `ListIdsPaged`/`SearchPaged` RPC, would force every consumer (broker,
  ui-service, valuation, the four language wrappers) to migrate at once.
- **Fields are additive.** Old clients never send the new fields and ignore
  `next_page_token`, so they keep today's behaviour with no code change; new
  clients opt in per call.
- **Streaming does not give paging.** `Search` already streams but has no page
  cap and no resume point: a dropped stream must restart from the beginning.
  A page token works the same way for unary and streaming RPCs.
- **One shape for all four entities.** The same names on every message keep
  service code and wrappers uniform.

## Alternatives rejected

- **Shared `PageRequestProto` / `PageResponseProto` submessage.** One place for
  the comments, but a message field has presence (unset vs empty `page`) — a
  third state the contract would need to define — and callers would write
  `getPage().getLimit()`. Plain scalars keep unset == default.
- **New `page_limit` field on all four.** Would give Transaction and Price two
  overlapping caps.
- **Golden-bytes fixture files.** Unset proto3 scalars are not emitted, so the
  tests instead decode short hex literals produced from the pre-change
  bindings, without wiring fixtures into four build systems.

## Tests

- `ledger-models-python/test/requests/test_query_paging_contract.py` — field
  names, numbers, types, no presence, Price `oneof`, identical comment blocks
  and contract phrases, RPC signatures unchanged, this ADR exists.
- Wire tests in every language (old request reads `limit = 0` and an empty
  `page_token`; old-bytes hex literals; round-trip on all four entities; empty
  `next_page_token` encodes the same as unset; Price `oneof` round-trip):
  - Java `ledger-models-java/src/test/java/common/requests/QueryPagingTest.java`
  - Python `ledger-models-python/test/requests/test_query_paging.py`
  - Rust `ledger-models-rust/query_paging_tests.rs` (lib unit test, mounted from `lib.rs`)
  - JS `ledger-models-javascript/node/wrappers/requests/query-paging.test.ts`
