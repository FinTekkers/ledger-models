# ADR: Lazy link hydration

## Status

Proposed. Companion to [`is_link_pattern.md`](is_link_pattern.md) — refines what consumers actually have to do.

## Context

`is_link_pattern.md` established that nested Security / Portfolio / Price / Transaction sub-protos can be stored as link references (`is_link=true`, `uuid` and `as_of` only) and that callers must call `LinkResolver.resolveXOnTransactions(...)` before reading non-link fields. PR #226 (Transaction wrapper) + #338 (Security wrapper) wired this up.

The contract has two acute failure modes today:

1. **Forgetting to hydrate.** Any code path that reads `tx.getSecurity().getProductType()` on a transaction whose embedded Security is link-mode trips `IllegalStateException: Cannot read productType on a link-mode Security`. Every consumer must remember to hydrate; the compiler does not help. The strip-on-write regression that surfaced under FinTekkers/second-brain#327 was exactly this — `TaxLotCalculator._cancelAnyAssociatedCashLots` reads `tx.getCashTransaction().getSecurity().isCash()` without an explicit hydrate step, and the child cash leg's Security was link-mode after strip → `isCash()` returned `false` → NPE downstream.

2. **No defense against silent skip.** A consumer that forgets to hydrate gets either an exception (visible) or the wrong answer from the link-mode fallback (silent). Either is a brittle contract.

## Decision

Wrappers hydrate themselves lazily on first non-link-field access. Calling `security.getProductType()` on a link-mode wrapper transparently:

1. Checks a process-wide `LinkCache` keyed by UUID
2. On miss, fetches the latest vintage via `SecurityService.getLatestByUuid(id)`
3. On fetch failure, throws `IllegalStateException` (no sentinel default — surfaces the data lineage break)
4. Caches the resolved proto; swaps the wrapper's internal proto
5. Returns the requested field

`LinkResolver.resolveXOnTransactions(...)` continues to exist as an **optional pre-warming batch path** — it populates the `LinkCache` in one RPC for known batches (replay, batch aggregation) so the lazy getter calls hit the cache instead of firing N sequential RPCs. It is **not required** — wrappers work without it; the pre-warm is just a performance optimization.

### Wrapper shape (Java reference)

```java
public class Security {
    private SecurityProto proto;          // mutable — replaced on hydrate
    private boolean isHydrated;

    public Security(SecurityProto proto) {
        this.proto = proto;
        this.isHydrated = !proto.getIsLink();
    }

    /** Current proto, whatever state. Never triggers a fetch. */
    public SecurityProto proto() { return proto; }

    // Link-safe — uuid + asOf are populated on link-mode by contract.
    public UUID getID()            { return deserializeUUID(proto.getUuid()); }
    public ZonedDateTime getAsOf() { return deserializeTimestamp(proto.getAsOf()); }
    public boolean isLink()        { return proto.getIsLink() && !isHydrated; }

    // Every non-link-safe getter starts with ensureHydrated() — explicit, greppable.
    public ProductTypeProto getProductType() {
        ensureHydrated();
        return proto.getProductType();
    }
    public String getIssuerName() {
        ensureHydrated();
        return proto.getIssuerName();
    }
    public boolean isCash() {
        ensureHydrated();
        return Security.fromProto(proto).isCash();
    }
    // ... etc for every field other than uuid / asOf

    private void ensureHydrated() {
        if (isHydrated) return;
        UUID id = getID();
        SecurityProto cached = LinkCache.SECURITY.get(id);
        if (cached != null) {
            this.proto = cached;
            this.isHydrated = true;
            return;
        }
        SecurityProto resolved = SecurityServiceClient.singleton().getLatestByUuid(id);
        if (resolved == null) {
            throw new IllegalStateException(
                "Cannot resolve link-mode Security uuid=" + id
                + " — SecurityService returned no record. Data lineage broken.");
        }
        LinkCache.SECURITY.put(id, resolved);
        this.proto = resolved;
        this.isHydrated = true;
    }
}
```

### LinkCache — latest-only, keyed by UUID

```java
public final class LinkCache<V> {
    public static final LinkCache<SecurityProto>    SECURITY    = new LinkCache<>();
    public static final LinkCache<PortfolioProto>   PORTFOLIO   = new LinkCache<>();
    public static final LinkCache<TransactionProto> TRANSACTION = new LinkCache<>();
    public static final LinkCache<PriceProto>       PRICE       = new LinkCache<>();

    private final ConcurrentMap<UUID, V> map = new ConcurrentHashMap<>();

    public V get(UUID id)             { return map.get(id); }
    public void put(UUID id, V value) { map.put(id, value); }
    public void evict(UUID id)        { map.remove(id); }
}
```

### Cache update on local mutation

Any code path that mutates an entity (`SecurityService.createOrUpdate`, `PortfolioService.createOrUpdate`, etc.) writes through to the cache after the RPC succeeds:

```java
public Security createOrUpdate(Security s) {
    SecurityProto persisted = stub.CreateOrUpdate(s.proto());
    LinkCache.SECURITY.put(s.getID(), persisted);
    return new Security(persisted);
}
```

Cross-process consistency is best-effort — each process's cache is independent. Acceptable for read-mostly workloads. Future work could add TTL or a pub/sub invalidation path; not required for v1.

### Path split: lazy-latest vs explicit-vintage

The bitemporal language in `is_link_pattern.md` said: "a link carrying `(uuid, asOf=T)` MUST resolve to the T-vintage." Lazy hydration with a latest-only cache **breaks that for the lazy path**. We accept the split:

| Path | Vintage |
|---|---|
| Lazy hydration (`security.getProductType()` on a link-mode wrapper) | **Always latest.** Cached. Use for "what is this security TODAY." |
| Explicit `LinkResolver.resolveSecuritiesAsOf(txs, T)` | **T-vintage.** Bypasses cache. Use for backtests, point-in-time reports, time-travel queries. |

Most consumers want "latest" (UI, current positions, dispatch by `isCash`/`isBond`). The minority that need historical vintage call the explicit batch resolver and read off the wrappers it populates.

### Failure mode

- **Resolve fails** (service down, record missing): `IllegalStateException` with `uuid` in the message.
- **No sentinel defaults.** `null` → throw, missing security → throw.
- **Cache stale within a process**: best-effort; cross-process write doesn't invalidate. Local mutations do.

## Components to migrate

| Wrapper | Add lazy hydrate? | Service backing it | Notes |
|---|---|---|---|
| **Security** | **Yes** | SecurityService | Primary use case. Drives almost all the pain. |
| **Portfolio** | **Yes** | PortfolioService | Mirror of Security; same pattern. |
| **Transaction** | **Yes** | TransactionService | Wrapper already proto-backed (#340). Adding hydrate so `tx.getChildTransactions()` etc. work when a Transaction is itself a link reference (rare today, but the proto allows it). |
| **Price** | **Yes** | PriceService | Same pattern. `tx.getPrice()` and `tx.getPrice().getSecurity()` are both reachable through link mode; hydrating the embedded Price wrapper closes the same gap that exists for Security and Portfolio. |
| Strategy / StrategyAllocation | No | none | No service to resolve against (per session 2026-05-28 conversation). Wrapper migration done in PR #229, no is_link. |

## Per-language implementation plan

### Java (`ledger-models-java`) — reference implementation

Today: Wrappers exist for Security, Portfolio, Transaction. `is_link` returns boolean. Non-link-safe getters throw `IllegalStateException`. `LinkResolver` exists as the batch-hydrate path.

Migration:
1. `LinkCache` class + tests in `common/util/`.
2. `Security` wrapper: add `proto()`, `ensureHydrated()`, route every getter through `ensureHydrated()` except `getID()` / `getAsOf()` / `isLink()`. Delete the `_assert_not_link` (`throwIfLink`) guard — hydration replaces it.
3. `Portfolio` wrapper: mirror change.
4. `Price` wrapper: mirror change. Service backing is `PriceService`.
5. `Transaction` wrapper: same pattern. The wrapper is already proto-backed from #340; add `ensureHydrated()` and route the few non-link-safe accessors through it.
6. `SecurityServiceClient` / `PortfolioServiceClient` / `PriceServiceClient` / `TransactionServiceClient`: `createOrUpdate` writes through to `LinkCache`.
7. `LinkResolver.resolveXOnTransactions(...)`: change to write to `LinkCache` instead of (or in addition to) mutating wrapper internals. Becomes the pre-warm path.
8. Tests: lazy hydrate from cache, lazy hydrate from service on miss, throw on resolve failure, write-through on mutate, batch pre-warm populates cache.

### Python (`ledger-models-python`)

Today: Wrapper at `fintekkers/wrappers/models/security/security.py` with `is_link()` boolean and `_assert_not_link(accessor)` that throws `RuntimeError`. `LinkResolver` exists at `fintekkers/wrappers/util/link_resolver.py` as the batch-hydrate path.

Migration:
1. `LinkCache` module at `fintekkers/wrappers/util/link_cache.py` — `dict[UUID, SecurityProto]` etc., process-wide singleton.
2. `Security` wrapper: replace `_assert_not_link(accessor)` calls with `_ensure_hydrated()`. Method body cache-check, then RPC via the existing `SecurityService` wrapper, then cache-put.
3. `Portfolio` wrapper: mirror change. (May not exist yet — file if missing.)
4. `Price` wrapper: mirror change.
5. `Transaction` wrapper: extend the existing `Transaction(proto)` wrapper with `ensure_hydrated()` plus hydrating accessors for nested security/portfolio/price. Today the wrapper is thin — `get_security()` returns a wrapped `Security` and the caller hits the link guard if they read non-link fields.
6. Service-wrapper write-through: `SecurityService.create_or_update` → `LinkCache.SECURITY[id] = resolved` (and equivalents for Portfolio / Price / Transaction).
7. `LinkResolver` updated to populate `LinkCache`.
8. Tests: pytest equivalents of the Java suite.

### TypeScript / JavaScript (`ledger-models-javascript`)

Today: Wrappers exist for Security, Portfolio, Transaction. `LinkResolver` exists at `node/wrappers/util/link-resolver.ts` with `resolveSecuritiesOnPrices` and similar batch methods. The wrappers throw on non-link-safe field access in link mode (similar to Java).

Migration:
1. `LinkCache` class at `node/wrappers/util/LinkCache.ts` — Map-based, module-singleton.
2. `Security.ts` (and `BondSecurity`, `MortgageBackedSecurity`, etc. subclasses): add `ensureHydrated()`. Subclasses' field accessors route through it. The hydrate path uses the existing service stub (`SecurityServiceClient` via `node/wrappers/services/`).
3. `Portfolio.ts`: mirror.
4. `Price.ts`: mirror.
5. `Transaction.ts`: mirror.
6. Service-client write-through (Security / Portfolio / Price / Transaction).
7. `LinkResolver` updated to populate `LinkCache`.
8. Jest tests.

### Rust (`ledger-models-rust`)

Today: Full wrapper ecosystem at `fintekkers/wrappers/models/` — `SecurityWrapper`, `PortfolioWrapper`, `PriceWrapper`, etc. Same pattern as the other languages: `proto` field, `is_link()` boolean, `assert_not_link(accessor)` that **panics** (Rust idiom instead of throwing). A `LinkResolver` at `fintekkers/wrappers/util/link_resolver.rs` already implements bulk hydration with an `(uuid, as_of)` keyed LRU cache + optional TTL — in fact more sophisticated than the current Java implementation.

Migration:
1. `LinkCache` module: align with the Java pattern. Latest-vintage only, keyed by UUID. The existing `(uuid, as_of)` LRU stays available as the explicit-vintage path's cache (Rust gets to keep what's already there for the time-travel case); the latest-only `LinkCache` is the new path for lazy hydration.
2. `SecurityWrapper`: replace each `assert_not_link(accessor)` call with `ensure_hydrated()`. Method body cache-check, then call SecurityService via the generated `tonic` stub, then cache-put.
3. `PortfolioWrapper`, `PriceWrapper`, `TransactionWrapper`: mirror change.
4. Service-stub write-through on `create_or_update`.
5. `LinkResolver` updated to populate the latest-only `LinkCache` (in addition to its existing per-vintage cache).
6. `cargo test` parity with the Java suite.

**The async wrinkle — decision: two-getter pattern.** Rust is async-first; `ensure_hydrated()` needs an RPC, which is naturally `async`. Each non-link-safe field exposes both a sync and an async accessor:

```rust
impl SecurityWrapper {
    // Sync — cache-hit only. Returns Err if the link hasn't been resolved.
    // Use this when the call site is pre-warming via LinkResolver (the
    // recommended path).
    pub fn product_type(&self) -> Result<ProductTypeProto, LinkNotResolved> {
        let cached = self.try_from_cache_or_proto();
        cached.ok_or(LinkNotResolved { id: self.uuid_wrapper().to_uuid() })
            .map(|p| ProductTypeProto::try_from(p.product_type).unwrap())
    }

    // Async — does the RPC on cache miss. Use when the call site can't
    // batch up front and needs lazy semantics.
    pub async fn product_type_async(&self) -> Result<ProductTypeProto, ResolveError> {
        self.ensure_hydrated().await?;
        Ok(ProductTypeProto::try_from(self.proto.product_type).unwrap())
    }
}
```

Rejected alternatives:

- **`block_on` inside a single sync getter** — deadlocks if called from inside the same tokio runtime. Subtle, dangerous, doesn't fit Rust's "no hidden blocking" convention.
- **All getters return `impl Future`** — cleanest async story, but breaks API parity with the other languages and makes simple consumers (logging a CUSIP, comparing two securities by id) needlessly awkward.

The two-getter pattern keeps the wrapper API close to Java / Python / TypeScript for the common case (pre-warm + sync access), provides a clean lazy escape hatch via the `_async` variant, and never blocks the runtime.

## Order of execution

1. **Java first** — biggest pain surface, most active codebase. Establishes the reference behavior + tests. Single PR per wrapper to keep review tractable: PR(LinkCache) → PR(Security) → PR(Portfolio) → PR(Price) → PR(Transaction) → PR(LinkResolver → cache write-through).
2. **Python second** — parallel migration once Java pattern is stable.
3. **TypeScript third** — same pattern.
4. **Rust fourth** — same pattern, plus the sync/async getter decision (Shape B above) baked in. Includes deciding what `LinkResolver`'s existing `(uuid, as_of)` LRU keeps doing vs. the new latest-only `LinkCache`.

## Tests required (per language)

| Behavior | Test name |
|---|---|
| Hydrated wrapper getter returns field directly (no fetch) | `getProductType_onHydratedWrapper_returnsField` |
| Link-mode wrapper getter triggers cache hit when populated | `getProductType_onLinkWrapper_hitsCache` |
| Link-mode wrapper getter triggers RPC fetch on cache miss | `getProductType_onLinkWrapper_fetchesOnMiss` |
| Resolve failure throws clear exception | `getProductType_resolveFails_throws` |
| `getID()` / `getAsOf()` do NOT trigger hydration | `linkSafeAccessors_doNotHydrate` |
| `isLink()` returns false after hydration | `isLink_falseAfterHydrate` |
| Service-client mutate updates cache | `createOrUpdate_writesThroughToCache` |
| Batch pre-warm populates cache; subsequent getters skip RPC | `linkResolver_batchPreWarm_subsequentGettersAreCacheHits` |
| Cache evict invalidates entry | `evict_subsequentGettersFetchAgain` |
| No sentinel defaults — null input throws | `nullProto_throws` |

## Out of scope (v1)

- Cross-process cache invalidation (pub/sub or TTL). Future work if eventual-consistency surfaces as a real problem.
- Async hydration in Java/Python/TS (futures / coroutines). Current consumers in those languages are sync; revisit if a high-throughput async path emerges. (Rust is async by construction — see Rust section.)
- Vintage-precise caching for the latest-only `LinkCache`. Vintage queries go through explicit batch resolve. (Rust keeps its existing `(uuid, as_of)` LRU for that path.)
- Strategy + StrategyAllocation lazy hydration. No backing service exists; wrapper migration done in PR #229 without is_link.

## References

- [`is_link_pattern.md`](is_link_pattern.md) — original is_link contract
- [`link_resolver.md`](link_resolver.md) — current batch-hydrate path
- PR #338 — Security wrapper
- PR #340 — Transaction wrapper
- PR #226 — strip-on-write
- FinTekkers/second-brain#327 — test gate that surfaced the regression this ADR addresses
- Session 2026-05-28 — design discussion that produced this ADR
