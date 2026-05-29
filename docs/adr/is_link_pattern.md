# The `is_link` pattern — user guide

> **TL;DR.** Most entity protos in FinTekkers (`SecurityProto`, `PortfolioProto`, `PriceProto`, `TransactionProto`, ...) can appear in two forms on the wire: a **full entity** carrying every field, or a tiny **link** carrying only `uuid` and (optionally) `as_of`. The wrappers handle the link form automatically — call `transaction.getSecurity().getMaturityDate()` and it works whether the embedded security arrived as a link or as a full entity. This page tells you when to think about it, and when you can ignore it.

---

## What problem this solves

A single Treasury security can appear inside thousands of `TransactionProto` messages on a busy day. If every embedded reference carried the full security record — CUSIP, maturity, coupon, bond_details, identifiers — the wire would carry that record ten thousand times even though it doesn't change. Big response, slow request, expensive serialization, and a lot of duplicate bytes sitting on disk.

The `is_link` field lets us inline a **reference** instead: just the UUID, plus the as-of timestamp the parent message is anchored to. The full entity is fetched on demand, once, and cached. Net effect: messages get small, and the round-trip cost is paid once per process per entity instead of per message. (Storage on the server is unchanged — `is_link` is a wire-shape choice for embedded references, not a change to how entities are persisted.)

```
┌────────────────────────────┐         ┌────────────────────────────┐
│  TransactionProto          │         │  TransactionProto          │
│  ├─ uuid                   │         │  ├─ uuid                   │
│  ├─ as_of                  │         │  ├─ as_of                  │
│  ├─ security (full)        │   vs.   │  ├─ security (is_link=true)│
│  │   ├─ uuid               │         │  │   ├─ uuid               │
│  │   ├─ issuer_name        │         │  │   ├─ as_of              │
│  │   ├─ identifiers (× N)  │         │  │   └─ is_link=true       │
│  │   ├─ bond_details       │         │  └─ price (is_link=true)   │
│  │   └─ ...                │         │      ├─ uuid               │
│  └─ price (full)           │         │      ├─ as_of              │
│      ├─ uuid               │         │      └─ is_link=true       │
│      ├─ price              │         └────────────────────────────┘
│      └─ security (full)    │
│          └─ ...            │              ~80 bytes
└────────────────────────────┘
       ~2 KB
```

Same on-wire response — orders of magnitude smaller in the link form. (The database row is unchanged; `is_link` is a wire-shape choice, not a storage choice.)

---

## The mental model

Think of `is_link = true` as a **foreign key inside a protobuf message**. The UUID identifies the row; the as-of timestamp pins the version. The wrapper layer plays the role of the ORM: it sees the foreign key, looks it up when you ask for a real field, and gives you the resolved object as if it had always been there.

You'll meet two ideas across this guide:

- **LinkCache** — a process-wide map of `(uuid, asOf) → resolved proto`. The wrappers consult it on every accessor read. Populated automatically as resolved data flows through the system.
- **LinkResolver** — a batch utility that takes a list of items, walks every embedded link, fetches them in one or a few RPCs, mutates the items in place, and populates LinkCache as a side effect. Optional — only useful for explicit batch pre-warm.

Most code never touches either of these directly. You construct a wrapper, you read fields off it, and everything works.

---

## Quick start by language

### Java

```java
// You received a TransactionProto over the wire.
Transaction txn = new Transaction(protoFromRpc);

// Just read fields — hydration happens behind the scenes.
String issuer    = txn.getSecurity().getIssuerName();
LocalDate maturity = txn.getSecurity().getMaturityDate();
boolean   isCash   = txn.getSecurity().isCash();
```

If the security inside `protoFromRpc` arrived as `is_link=true`, the first call to `txn.getSecurity().getIssuerName()` triggers `ensureHydrated()`:
1. Consult `LinkCache.SECURITY.get(uuid, asOf)`. If hit → swap in resolved proto, return field.
2. Miss → call the registered `Security.Fetcher` → swap, populate cache, return field.
3. No fetcher registered and cache miss → throw `IllegalStateException` naming the missing UUID.

A default Fetcher targeting the standard `SecurityServiceClient` ships pre-registered for typical consumers. Override only if you need the wrapper to resolve from somewhere other than the default gRPC service — for example, a unit test that returns canned protos, or an in-process consumer that prefers a direct local API call over a self-RPC.

### Python

```python
from fintekkers.wrappers.models.transaction import Transaction

txn = Transaction(proto_from_rpc)
issuer = txn.proto.security.issuer_name      # auto-hydrates if needed
```

Same mental model as Java: accessor reads on a link-mode embedded entity consult the cache, then fall back to the default Fetcher (which calls the corresponding gRPC service), then cache the result. `set_security_fetcher`, `set_portfolio_fetcher`, `set_price_fetcher`, `set_transaction_fetcher` exist if you need to override the default — for tests with canned data, or to point at a non-default endpoint.

### TypeScript / Node.js

TS getters are **synchronous**, so the wrapper doesn't fire RPCs from inside an accessor. Use the wrapper-service methods that include hydration as part of the call:

```typescript
import { TransactionService } from 'ledger-models/wrappers/services/transaction-service/TransactionService';

const txns = await new TransactionService()
    .searchWithSecurityAndPortfolio(asOf, filter, 100);

for (const t of txns) {
  console.log(t.getSecurity().getIssuerName());
}
```

`searchWithSecurityAndPortfolio` handles batching internally and writes every resolved entity into the process-wide `LinkCache`. Once those returned items have been read, the cache also satisfies subsequent independent reads in the same process — you don't need a long-lived resolver instance to benefit from it.

If you reach for the lower-level `searchTransaction` (no hydration) instead, accessor reads on link-mode embedded securities throw — the error names the missing UUID and points you here.

For a single one-off pre-warm (no batch context), `await security.hydrate()` resolves the wrapper against the process-wide `LinkResolver.getDefault()` and populates `LinkCache` as a side effect. Subsequent synchronous accessors on the same wrapper Just Work.

### Rust

Same mental model as Java / Python — sync accessor reads consult `link_cache`, fall back to the registered fetcher on miss, and return the resolved field:

```rust
let txn = TransactionWrapper::new(proto_from_rpc);
let issuer = txn.security_wrapper().issuer_name();
```

The fetcher interface is sync (`fn fetch(uuid, as_of) -> Result<SecurityProto, FetcherError>`) so it composes with the sync accessor surface. Implementations bridge to their preferred async runtime — the typical pattern is a dedicated tokio runtime + `block_on` inside `fetch`. A default impl wrapping the standard tonic stub ships pre-registered. Override with `security::set_security_fetcher(...)` only for tests with canned data or non-default endpoints.

The `PortfolioWrapper` and `PriceWrapper` fetcher hooks are mechanical follow-ups behind `SecurityWrapper` — they read from `LinkCache` today; `set_portfolio_fetcher` / `set_price_fetcher` are slated to land in the same shape as `set_security_fetcher`.

---

## Caching: what to expect

One cache sits between you and the network, and you can ignore it for correctness — it only affects performance and freshness.

### LinkCache (process-wide)

A singleton per entity type: `LinkCache.SECURITY`, `LinkCache.PORTFOLIO`, `LinkCache.PRICE`, `LinkCache.TRANSACTION`. Lives for the lifetime of the process. Keyed on UUID, with the cached entry's as-of validated on read. Bounded LRU — capacity is per-entity (see below).

**What writes to it**

- Wrapper auto-hydration on a cache miss: after the Fetcher returns a resolved proto, it's put into the cache. Covered for **Security, Portfolio, and Transaction** in all four languages — Java / Python / Rust use sync accessors that call into a default Fetcher; TypeScript exposes an async `wrapper.hydrate(resolver?)` method that resolves through `LinkResolver.getDefault()`. Rust's `PriceWrapper` is the only remaining mechanical follow-up.
- `LinkResolver.getSecurity/.getPortfolio/.resolveSecuritiesOn*`: every successful resolve writes through to the cache (added in v0.4.10 #237).
- Service-client `createOrUpdate`: the just-persisted entity is mirrored into the cache (v0.4.10 #238 for Python + TS; Java equivalent lives in ledger-service's `SecurityAPIGRPCImpl` etc.).
- `CashSecurity.USD` is primed at class load so the well-known cash singleton is always available.

**What reads from it**

- Every accessor that calls `ensureHydrated()` / `_ensure_hydrated()` on a link-mode wrapper. Hit → swap proto, return field. Miss → continue to the Fetcher.

**Read semantics**

- `cache.get(uuid, asOf)` with a **specific** `asOf` returns a hit only if the cached entry's as-of equals the requested. Two distinct versions of the same UUID never alias — bitemporal precision preserved. No TTL — history doesn't change, so a past vintage can be cached arbitrarily long.
- `cache.get(uuid, null)` ("latest acceptable") returns a hit if the entry was cached recently enough — a TTL bounds cross-process staleness. Per-entity TTL / cap:

  | Entity | TTL (null-asOf reads) | Max entries (LRU cap) |
  |---|---|---|
  | `SECURITY`    | 1 day    | 100,000 |
  | `PORTFOLIO`   | 1 day    | 10,000  |
  | `TRANSACTION` | 1 minute | 100,000 |
  | `PRICE`       | 30 sec   | 200,000 |

  Tuned for the typical access pattern of each entity (slow-churning entities get a long TTL; fast-churning ones get a short one).

**Write semantics**

Newest-as-of wins. A late-arriving write with an older as-of doesn't displace a fresher entry.

**Eviction**

Bounded LRU. When a `put` causes the map to exceed `max_entries`, the least-recently-used entry is dropped. `get` bumps recency.

### LinkResolver concurrency

`LinkResolver` does not own its own cache — reads and writes route through `LinkCache` directly. What `LinkResolver` does own: an in-flight dedup map so N concurrent callers for the same `(uuid, asOf)` share one `GetByIds` RPC. (Rust currently lacks the in-flight dedup; same-key parallel calls hit the wire twice. Documented as a follow-up.)

---

## Common patterns

### Single-entity read in a request handler

Do nothing special. Construct the wrapper, read fields:

```java
Security s = securityServiceClient.getByUuid(uuid).getProto();   // full proto
String issuer = s.getIssuerName();                                // works
```

If you happened to start with a link-mode proto (rare in single-read paths), the wrapper auto-hydrates on the first non-link-safe field access.

### Batch read of N items

Use the wrapper-service method that bundles the bulk resolve:

```python
prices = PriceService().search_with_securities(query_request)
# Each price's embedded security is now full. One batched GetByIds RPC
# was fired, not N individual ones.
```

```typescript
const txns = await new TransactionService()
    .searchWithSecurityAndPortfolio(asOf, filter, 100);
// Each transaction's embedded security AND portfolio resolved in parallel.
```

```java
// Java consumer: explicit resolver call before reading.
List<TransactionProto> protos = transactionConnector.search(filter);
LinkResolver resolver = new LinkResolver(host, port, /*isHttp*/ true);
protos = resolver.resolveSecuritiesOnTransactions(protos);
protos = resolver.resolvePortfoliosOnTransactions(protos);
List<Transaction> txns = protos.stream().map(Transaction::new).toList();
```

After any of the above, accessor reads on the returned items go straight to the populated `LinkCache` — no second RPC.

### Writing — create / update flow

Service-client `createOrUpdate` methods write through to `LinkCache` automatically (v0.4.10). After

```python
SecurityService().create_or_update(create_request)
```

returns, the persisted security is already in `LinkCache.SECURITY`. Any subsequent read in the same process that touches the same UUID gets a cache hit. No extra wiring required.

### Building a link reference

When you embed a Security inside another message you're building (a Position, a Transaction, a Price), use `linkOf`:

```java
SecurityProto link = Security.linkOf(securityUuid, parentAsOf);
priceBuilder.setSecurity(link);
```

```python
link = Security.link_of(security_uuid, parent_as_of)
```

```typescript
const link = Security.linkOf(securityUuid, parentAsOf);
```

```rust
let link = security::link_of(security_uuid, parent_as_of);
```

`asOf` is required on `linkOf` — the link must carry the same as-of as the parent message so the consumer hydrates the correct point-in-time vintage. There's a `linkOfLatest(uuid)` escape hatch for the rare "I really want latest regardless of my parent's as-of" case (UI flows where the link reference outlives any single result set).

---

## Errors you might hit

### "Cannot read X on link-mode Y uuid=Z — LinkCache miss"

You called a non-link-safe accessor (`getMaturityDate`, `getProductType`, etc.) on a wrapper whose underlying proto is `is_link=true`, and the cache had no entry for that UUID at the requested as-of.

In Java / Python / Rust — for Security, Portfolio, **and** Transaction wrappers: the default Fetcher should have auto-resolved this. If you still see the error, either you've cleared the default Fetcher (`Security.setFetcher(null)` / `set_portfolio_fetcher(None)` / equivalent) or the entity genuinely doesn't exist for that UUID — that's a data lineage problem; investigate why a link points at a non-existent record.

In TypeScript — for Security, Portfolio, **and** Transaction wrappers: TS getters are synchronous and don't fire RPCs. Either pre-warm via the wrapper-service `searchWithSecurityAnd*` variants, call `LinkResolver.resolveSecuritiesOn*` explicitly, or `await wrapper.hydrate()` for a single one-off resolve.

In Rust's `PriceWrapper`: the auto-fetch hook is a mechanical follow-up behind the other three wrappers — pre-warm via `LinkResolver` until it lands.

### "as_of required for link_of"

You called `Security.linkOf(uuid)` without an as-of. Use `linkOf(uuid, asOf)` (preferred — propagates the parent message's as-of) or `linkOfLatest(uuid)` (explicit "I want latest").

### Position aggregator returns more rows than expected

If you saw this before v0.4.10 #241: known bug — `Portfolio` and `Price` overrode `equals` without `hashCode`, so HashMap-based `groupingBy` mis-bucketed fresh wrapper instances. Fixed in v0.4.10. Upgrade.

### Subsequent reads are slower than they should be

`LinkResolver` is stateless apart from in-flight dedup — its cache lives in the process-wide `LinkCache`, so throwaway resolvers are fine. If you're seeing repeated RPCs for the same `(uuid, asOf)` across calls in one process, check that you're not evicting via `LinkCache.SECURITY.evict(...)` between reads (rare; mostly only test code does this) and that the cache TTL hasn't expired on a stream of null-asOf reads.

---

## Reference

This section captures the wire-level and protocol contracts that producers (services) and consumers must follow. Most application code doesn't need it.

### Which protos carry `is_link`

All entity protos that have a UUID primary key, with the field at the same tag for cross-entity uniformity:

| Proto | Service that resolves it |
|---|---|
| `SecurityProto` | `SecurityService.GetByIds(uuids, [as_of])` |
| `PriceProto` | `PriceService.GetByIds(uuids, [as_of])` |
| `PortfolioProto` | `PortfolioService.GetByIds(uuids, [as_of])` |
| `TransactionProto` | `TransactionService.GetByIds(uuids, [as_of])` |
| `StrategyProto` | No service yet — link mode unused in practice |
| `StrategyAllocationProto` | No service yet — link mode unused in practice |

`IssuanceProto` reserves the tag but doesn't use it — issuances are always stored inline on their parent security.

### Wire shape of a link sub-message

A link is the same proto message type as the full entity, with `is_link = true` and only these fields populated:

| Field | Tag | Required when `is_link = true` | Notes |
|---|---|---|---|
| `uuid` | 5 | **Yes** | Identifies the record to resolve. |
| `as_of` | 6 | No — unset means "latest" | If set, resolver fetches the version at that timestamp. |
| `is_link` | 7 | Yes (`true`) | Flags this as a reference. |

All other fields MUST be at proto3 defaults. Producers MUST NOT populate them; consumers MUST NOT read them.

### Resolution semantics: `uuid` only vs. `uuid` + `as_of`

- **`uuid` set, `as_of` unset** → resolve to the **latest** version. Right for live UI flows where the reference outlives a single result.
- **`uuid` set, `as_of` set** → resolve to the version **as of that timestamp**. Required for backtesting, deterministic replay, position aggregation, and anything where the link itself encodes a point in time.

A resolver that ignores `as_of` and always returns "latest" silently mixes time vintages — a position computed as-of 2024-01-01 must not embed a security modified in 2025. v0.2.5 of this contract tightened "should" to **MUST** for as-of propagation.

### Server emission contract

When a server emits a link inside a parent that itself carries an `as_of`, the server MUST echo that `as_of` onto the emitted link:

```
position.as_of == T
  → position.security.is_link == true, position.security.as_of == T   ✓
  → position.security.is_link == true, position.security.as_of UNSET  ✗ — resolver loses time vintage
```

For position aggregation, ledger-service stamps the link's `as_of` at the same moment it stamps the parent.

### Batching contract

Because `GetByIds` carries a single `as_of` per request, a resolver consuming a heterogeneous result set MUST:

1. Walk the items and collect every link sub-message.
2. **Group by `as_of` bucket** — one bucket per distinct `as_of` value, plus a `latest` bucket for unset.
3. Fire **one `GetByIds` RPC per bucket**, with the bucket's `as_of` set on the request.
4. Within a bucket, deduplicate UUIDs.

Buckets MAY fire in parallel. Consumers MUST NOT collapse different `as_of` values into one RPC.

### Cache key

A resolver's cache MUST be keyed on the **`(uuid, as_of)` pair**, not on `uuid` alone. Two distinct timestamps for the same UUID are two different versions of the same record and MUST NOT alias.

### Edge cases

- **Zero / default `LocalTimestampProto`** (`seconds=0, nanos=0, time_zone=""`) is proto3 default, not "latest". Resolvers MUST treat field-unset (HasField false) as the "latest" sentinel, not field-present-but-zero. Field-present-but-zero is the Unix epoch.
- **`is_link = true` without `uuid`** — malformed. Resolvers MUST skip or surface an error, never fetch arbitrary entities.
- **`is_link = false` with `as_of` populated** — a normal full entity; the `as_of` is data, not a resolution hint.
- **Link in a write request** — `createOrUpdate` RPCs MUST NOT accept link-mode entities for fields requiring full data. Servers SHOULD reject `is_link = true` on input.

### `GetByIds` request shape

```proto
message QueryXRequestProto {
  // ... other search-time fields ...
  repeated fintekkers.models.util.UUIDProto       uuIds = 21;
  fintekkers.models.position.PositionFilterProto  search_x_input = 22;  // unused by resolver
  fintekkers.models.util.LocalTimestampProto      as_of = 23;
}
```

- `uuIds` — list of UUIDs to fetch (deduplicate before sending). Note: camelCase `uuIds` not snake_case; generated accessors are `getUuidsList()` / `setUuidsList()`.
- `as_of` — single timestamp applied to **all** UUIDs in the request. Unset means latest.

Response is a list of full entities (`is_link = false`), one per UUID found. UUIDs not found are silently omitted — resolvers SHOULD treat that as a not-found error rather than returning a partial result.

---

## Further reading

- `docs/adr/lazy-link-hydration.md` — the design rationale for the wrapper-side auto-hydration model (cache, fetcher hook, async/sync split per language).
- `docs/adr/lazy-link-hydration-checklist.md` — live progress on the rollout across the four languages.
- `link_resolver.md` (sibling) — deep dive on `LinkResolver`'s internals.
