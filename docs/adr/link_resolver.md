# ADR: LinkResolver — consumer-side utility for `is_link` resolution

## Status

Accepted (JS implementation only — Python/Java/Rust parity is a separate follow-up).

## Context

The `is_link` pattern (see [`is_link_pattern.md`](./is_link_pattern.md)) defines how entity protos are returned from search RPCs in two shapes — full entities (`is_link = false`) and lightweight references (`is_link = true`, only the `uuid` populated). The pattern is a wire-format optimisation: a single security referenced by 1,000 prices is serialized once, not 1,000 times.

The pattern works at the wire layer, but every consumer that wants to render or process those entities has to re-implement the same recipe:

1. Walk the result list and collect unique link-mode UUIDs.
2. Call `XService.GetByIds` with the deduped UUIDs.
3. Stitch the resolved entities back onto the originals.

`ui-service` got bitten in the prices browse UI (`/data/prices` rendered "—" for every row because it tried `price.getSecurity().getIdentifier().getIdentifierValue()` on link-mode prices) and worked around it ad-hoc. Other consumers will hit the same problem unless we provide an SDK affordance.

## Decision

Ship a `LinkResolver` utility in the JS wrappers (`wrappers/util/link-resolver.ts`) with:

- **Single-UUID accessors** — `getSecurity(uuid)`, `getPortfolio(uuid)` — for one-off lookups.
- **Bulk accessors** — `resolveSecurities(items)`, `resolvePortfolios(items)` — for whole result sets. They walk the input, collect unique link UUIDs, fire **one batched `GetByIds` RPC** per entity type, and mutate each item's embedded entity proto in place (link → full).
- **Process-level LRU cache**, default 1000 entries, no TTL. Configurable via `{ cacheSize, ttlMs }`. Set `cacheSize: 0` to disable (useful in tests).
- **Concurrent-call dedupe** — N parallel callers for the same UUID share one RPC.

On top of that, two service-wrapper convenience methods compose the search and resolve into a single call:

- `PriceService.searchWithSecurities(asOf, filter, linkResolver?)` → `Promise<Price[]>` with hydrated securities.
- `TransactionService.searchWithSecurityAndPortfolio(asOf, filter, max, linkResolver?)` → `Promise<Transaction[]>` with hydrated securities **and** portfolios (resolved in parallel since they hit different services).

Pass an optional shared `linkResolver` to share caching across multiple service-wrapper calls in the same request scope.

## Why these specific choices

### `GetByIds` not `Search`

Both unary `GetByIds` and streaming `Search` accept the same `uuIds` field on the request. We use `GetByIds` because:

- It's purpose-built for the "fetch by UUID list" semantic (per the ADR table in `is_link_pattern.md`).
- Unary is simpler client code than streaming.
- No schema reason to prefer one over the other for batched-by-UUID lookups; the streaming variant just adds a wire-protocol overhead we don't need.

### Mutate proto in place, not return new wrappers

When `resolveSecurities` resolves a link, it mutates the **embedded** `SecurityProto` inside each item — replaces the link sub-message with the resolved full entity (which carries `is_link = false`). The outer entity (Price, Transaction) is untouched.

This means after `resolveSecurities(prices)`, `price.getSecurity().getIdentifier().getIdentifierValue()` "just works" — no API change required at the call site beyond opting into the convenience method.

### Process-level LRU, no TTL by default

Process-lifetime cache is the right default for the dominant use case (UI request handlers reading a few hundred prices). Long-running services that worry about staleness can pass `{ ttlMs: 60_000 }`. Tests pass `{ cacheSize: 0 }` to opt out.

### Honors per-link `as_of` (time-travel)

Per the [`is_link_pattern.md`](./is_link_pattern.md) addendum: when the link sub-message has `as_of` set, the resolver fetches the version of the entity at that timestamp; otherwise it fetches the latest.

- The cache is keyed on **(uuid, as_of)** — the same UUID at different timestamps does not collide. "Latest" is its own bucket (key suffix `@latest`).
- Bulk lookups group items by `as_of` and fire **one `GetByIds` RPC per bucket** (the request proto carries a single `as_of`, so different timestamps cannot share a request).
- Single-UUID `getSecurity(uuid)` defaults to latest; `getSecurity(uuid, asOf)` time-travels.

This matters for backtesting and deterministic replay: a search at `asOf=2024-01-01` returns prices whose embedded link-securities also carry `as_of=2024-01-01`. Without per-link `as_of` propagation the resolver would silently return *current* securities, mixing time vintages in one result set.

## Out of scope

- **Python / Java / Rust parity.** The same shape transplants directly (each language has typed protobuf accessors and the same `GetByIds` RPCs), but each is its own ticket — different consumer surface, different reviewer.
- **Auto-resolution on access.** Considered (Option 1 in the original analysis) but rejected: sync getters can't `await` an RPC, and making all getters async is a four-language breaking change with poor ergonomics. Explicit batch-then-access is better.
- **Streaming hydration during `search`.** The `priceService.search` stream still returns link-mode prices; only `searchWithSecurities` hydrates. Streaming buffer-and-hydrate is a possible future optimisation but isn't worth the complexity until profiling shows it's needed.

## Migration

Existing call sites are unchanged. Opt in by switching from `search` to `searchWithSecurities`:

```ts
// before
const prices = await priceService.search(asOf, filter);
// price.getSecurity()... → "—" because is_link=true

// after
const prices = await priceService.searchWithSecurities(asOf, filter);
// price.getSecurity().getIdentifier().getIdentifierValue() → real ticker
```

To share cache across multiple calls in one request scope:

```ts
const linkResolver = new LinkResolver();
const prices = await priceService.searchWithSecurities(asOf, filter, linkResolver);
const txns   = await txnService.searchWithSecurityAndPortfolio(asOf, txnFilter, 100, linkResolver);
// security UUIDs that overlap between prices + txns are fetched once total.
```

## References

- ADR: [`is_link_pattern.md`](./is_link_pattern.md)
- Discussion: FinTekkers/second-brain#196
- Implementation PR: this PR (JS-first).
