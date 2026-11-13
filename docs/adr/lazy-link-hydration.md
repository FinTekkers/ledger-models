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

### LinkCache — single-slot per UUID, asOf-validating

The cache stores **one entry per UUID** (memory-bounded), but every hit is **checked against the requested asOf** before returning.

`requestedAsOf` is a `ZonedDateTime` parameter with two meanings:
- **non-null** → bitemporal-precise: cache hit only when `cached.asOf == requested`. History doesn't change, so no TTL needed.
- **null** → "latest acceptable": cache hit allowed, but **TTL applies** to bound staleness for cross-process writes that this process didn't observe.

```java
public final class LinkCache<V extends HasAsOf> {
    public static final LinkCache<SecurityProto>    SECURITY    = new LinkCache<>();
    public static final LinkCache<PortfolioProto>   PORTFOLIO   = new LinkCache<>();
    public static final LinkCache<TransactionProto> TRANSACTION = new LinkCache<>();
    public static final LinkCache<PriceProto>       PRICE       = new LinkCache<>();

    private static final Duration TTL_FOR_LATEST = Duration.ofSeconds(60);
    private final ConcurrentMap<UUID, CacheEntry<V>> map = new ConcurrentHashMap<>();

    /**
     * @param requestedAsOf null = "latest acceptable" (TTL-bounded);
     *                      non-null = exact-vintage match required.
     */
    public V get(UUID id, ZonedDateTime requestedAsOf) {
        CacheEntry<V> entry = map.get(id);
        if (entry == null) return null;
        if (requestedAsOf == null) {
            // "Latest" — TTL applies. Past TTL → force refetch.
            if (Duration.between(entry.cachedAt, Instant.now()).compareTo(TTL_FOR_LATEST) > 0) {
                return null;
            }
            return entry.value;
        }
        // Bitemporal-precise — exact match or miss. No TTL (history doesn't change).
        return entry.value.getAsOf().equals(requestedAsOf) ? entry.value : null;
    }

    /** Newest-wins write: older-vintage writes don't evict newer cached entries. */
    public void put(UUID id, V value) {
        CacheEntry<V> incoming = new CacheEntry<>(value, Instant.now());
        map.merge(id, incoming, (existing, in) ->
            existing.value.getAsOf().isAfter(in.value.getAsOf()) ? existing : in);
    }

    public void evict(UUID id) { map.remove(id); }
    public void clear()        { map.clear(); }

    private record CacheEntry<V>(V value, Instant cachedAt) {}
}
```

`HasAsOf` is a small interface the generated proto types satisfy via an adapter — `SecurityProto.getAsOf()` returns a `LocalTimestampProto`; we wrap it as `ZonedDateTime`.

The cache is **single-slot per UUID by design**. Vintage-precise queries that touch an asOf other than the most-recently-cached entry refetch every time — correct, and vintage queries are a minority code path. `null` requests are TTL-bounded to cap cross-process staleness without infra work.

#### Why not a typed `AsOfSpec` sum type?

Considered (sealed interface with `Latest` singleton + `AtVintage(timestamp)` record), but adds API surface across all four languages and four wrappers. For v1 we accept `null` as a deliberate sentinel meaning "latest acceptable" — documented at the get/set boundaries. If the null overloading becomes a source of bugs in practice, a typed `AsOfSpec` is a clean follow-up that doesn't change the cache mechanics, only the API.

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

### Path split: lazy honors link's asOf; explicit batch is the perf path

The bitemporal language in `is_link_pattern.md` said: "a link carrying `(uuid, asOf=T)` MUST resolve to the T-vintage." Lazy hydration honors that, by **reading the link's asOf and passing it through to the cache lookup + refetch**:

| Path | Vintage |
|---|---|
| Lazy hydration (`security.getProductType()` on a link-mode wrapper) | **The link's asOf vintage.** Cache hit when the most-recently-seen entry matches; refetch otherwise. Never silently returns the wrong vintage. |
| Explicit `LinkResolver.resolveSecuritiesAsOf(txs, T)` | **T-vintage.** Batch fetch. Use to pre-warm the cache before a known hot loop, or to fetch many vintages at once. |

Most consumers either want "latest" (`link.asOf == null`) or want exactly the vintage carried on the link they were handed; both are honored. The user does **not** need to "use the exact asOf to hit the cache" — they read whatever asOf the link carries, the wrapper does the right thing. Explicit batch resolve exists as a performance optimization, not a correctness requirement.

### Failure mode

- **Resolve fails** (service down, record missing): `IllegalStateException` with `uuid` in the message.
- **No sentinel defaults.** `null` → throw, missing security → throw.
- **Cache stale within a process**: best-effort; cross-process write doesn't invalidate. Local mutations do.

### Trade price stays inline (LM-394)

A transaction's trade price is a fixed fact of the transaction, not a link to market data. Java's `Transaction.getProto()` strips the embedded Security and Portfolio to links, but keeps the Price inline (price decimal, `uuid`, `as_of`); only the Price's nested Security becomes a link. A consumer that persists `getProto()` reads the price back after a cold start with no `LinkCache.PRICE` lookup. `getProto()` no longer primes `LinkCache.PRICE`. A Price that arrives already as a link passes through unchanged, and `Transaction.getPrice()` still resolves it from `LinkCache.PRICE`. Python, TypeScript and Rust never stripped the price, so all four languages now match.

### `Transaction.getSecurity()` resolves before dispatch (LM-440)

`Security.fromProto` picks the class from the product type, and a link has none, so a lazily hydrated link wrapper stayed a base `Security`: `getField(MATURITY_DATE)` returned the `2999-12-31` placeholder for every BUY on a Treasury link (LS-217). Hydrating swaps the proto, never the class.

- **Java.** `Transaction.getSecurity()` resolves a link first through the new `Security.resolveLink(SecurityProto)` (`LinkCache.SECURITY`, then the configured `Security.Fetcher`, written through to the cache), then calls `fromProto` on the resolved proto. A Treasury link returns a `BondSecurity`, `TIPSBond`, `FloatingRateNote` or `MortgageBackedSecurity`, exactly as the full security would. `fromProto` itself still does no I/O.
- **At most once per transaction.** The outcome is memoised on the `Transaction` (one volatile holder of the link proto and the resolved proto), keyed on the link, so a cache hit never fetches and repeated calls never refetch. The memo is cleared when the transaction's own link hydrates. A failed fetch (fetcher throws or returns `null`) is memoised too: `getSecurity()` returns the link wrapper and does not throw. The wrapper's first field read then retries once through `ensureHydrated()` and raises the existing error, so a `null`-returning fetcher is called at most twice on the failure path. A miss with no fetcher configured is not memoised (no fetch was made), so a cache warmed later is still picked up.
- **Never written back.** The resolved proto lives only in the memo; `getProto()` keeps strip-on-write and its bytes are unchanged.
- **ID-only reads stay on the proto.** `Transaction.getField(SECURITY_ID)` reads the link's UUID without resolving it.
- **No placeholder for a link.** Base `Security.getField` hydrates before its `MATURITY_DATE`, `ISSUE_DATE`, `TENOR` and `ADJUSTED_TENOR` placeholders, so an unresolved link with no fetcher raises "Cannot read fields on link-mode Security … no Security.Fetcher configured" instead of returning `2999-12-31`. (LM-441 has since removed the date placeholders: a hydrated security with no date returns null.)
- **TypeScript.** `Transaction.getSecurity()` calls the new cache-only `Security.resolveLink(proto)` and passes the result to `Security.create`. On a cache miss it returns the base link wrapper, as before.
- **Python and Rust** do not choose a class by product type (Python builds a base `Security`; Rust's `TransactionWrapper::security()` returns a `SecurityWrapper`), so their lazy `get_maturity_date` already reads the hydrated bond details. No change.

### Java `Transaction` is a plain object again; links resolve at build (LM-444)

On 6 Nov two ledger-service threads serialised the same BUY at once. The #340 wrapper used its shared `overlay` builder as scratch space in `getProto()`, so 10 stored SOMA rows got 0, 3 or 4 children instead of 2. Java `Transaction` is now object-plus-serializer, as before #340. Python, TypeScript and Rust are unchanged.

- **Fields, not a proto.** `Transaction` holds its fields and child list directly; it has no `proto`, `overlay` or lazy hydration. `TransactionSerializer` (`common.models.transaction`) builds a fresh `TransactionProto` on every `getProto()` call and only reads the transaction, so concurrent serialises cannot corrupt each other.
- **Same bytes.** Security and Portfolio are still written as links and the Price inline with its Security as a link. Each nested part's wire form (the link, or the inline price) is captured once when the field is set; `object_type`, `version` and `valid_from` are written back as received.
- **Links resolve once, at build.** `new Transaction(proto)` resolves a Security link through `Security.resolveLink` before choosing the class (this replaces the LM-440 memo above), a Portfolio link through the new `Portfolio.resolveLink`, a Price link from `LinkCache.PRICE`, and an `is_link` Transaction through `LinkCache.TRANSACTION` and the `Transaction.Fetcher`. Getters and `getProto()` never fetch. A miss, or a Security or Portfolio fetcher failure, keeps the link (logged as a warning), never throws, and writes the same link back. A Transaction fetcher failure also keeps the link and writes it back, but is not logged: see the next bullet (LM-450). `Security.ensureHydrated()` and `Portfolio.ensureHydrated()` still throw on a miss.
- **Price link miss.** `Transaction.getPrice()` raises the "LinkCache.PRICE miss" error if the price was not cached when the transaction was built; warming the cache later needs a rebuild.
- **Unresolved transaction link.** Only `getID()` and `getAsOf()` are known; business getters raise `IllegalStateException` naming the UUID when the fetcher missed (no fetcher, or it returned `null` or a link). If the `Transaction.Fetcher` threw a `RuntimeException`, the build still succeeds and every business getter (and `getField`, `isMatch`, `getMeasure`) rethrows that same exception instance (LM-450), so a typed error such as ledger-service's `UnknownLinkException` reaches the caller as it did before LM-444. Its stack trace is from the build, not the getter. This applies to the default gRPC fetcher too: with the ledger unreachable, a getter on such a link now throws gRPC's `StatusRuntimeException` instead of `IllegalStateException`. Security and Portfolio fetcher failures are unchanged.

### Position resolves before dispatch (LM-442)

The Position counterpart of LM-440: `PositionSerializer.deserialize` built `SECURITY` with `Security.fromProto` on the raw link, so a Treasury link read as a base `Security` and its maturity was missing.

- **Java: resolve once, at deserialize.** For `SECURITY` and `CASH_IMPACT_SECURITY`, `PositionSerializer.deserialize` calls the new `Security.resolveLinkOrKeep` (`Security.resolveLink`, so `LinkCache.SECURITY` then the `Security.Fetcher`) before `fromProto`. `TransactionSerializer` now uses the same helper: one resolve path, no new cache. A miss, a fetcher failure or no fetcher keeps the link (logged as a warning) and never throws. Getters never fetch.
- **The link is written back.** `Position` records the incoming link proto of a security field (only a link, never resolved data) and `PositionSerializer.serialize` packs that link, so strip-on-write is unchanged. `setFieldValue` on that field drops the recorded link. `Position.setSecurityFieldValue` and `Position.getSecurityWireForm` are serializer-internal.
- **`Position.getField(MATURITY_DATE | ISSUE_DATE)` falls back to the security.** A map entry with a value wins. With no entry, the date is read from `SECURITY` only when it is resolved (not a link), so an unresolved link returns `null` without fetching or throwing. A `MATURITY_DATE` entry with no value is absent (`field.proto`), so the fallback applies. No other field delegates to the security.
- **Cold cache.** Deserializing N link positions makes up to N fetches up front; pre-warm `LinkCache.SECURITY` (e.g. through `LinkResolver`) before large position searches.
- **TypeScript.** `Position.getField(SECURITY)` calls the cache-only `Security.resolveLink` before `Security.create`, as `Transaction.getSecurity()` does. A cache miss returns the base link wrapper.
- **Python and Rust** do not choose a class by product type (Python's `Position.get_field` builds a base `Security`; Rust's returns a `SecurityWrapper`), and their lazy date reads already use the hydrated bond details. No change.
- **Not changed.** Other `fromProto` sites that can receive a link: `ProtoSerializationUtil.deserialize(Any)` (filter values, JS `CASH_IMPACT_SECURITY`), `SerializerFactory` and `PriceSerializer`'s embedded security.

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
