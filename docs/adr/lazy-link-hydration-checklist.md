# Lazy link hydration — implementation checklist

Companion to [`lazy-link-hydration.md`](lazy-link-hydration.md). **5 PRs total** — one per language migration plus one for the ledger-service consumer side. Each PR is large but coherent ("here's how lazy hydration works in <language>"). Tick boxes inside as we go.

## Phase 0 — Pre-execution

- [ ] ADR PR #230 merged
- [ ] Tracking issue filed in `FinTekkers/second-brain` titled "Lazy link hydration rollout" with this checklist's URL in the body. One issue total — not one per language.

---

## PR #1 — Java migration (ledger-models)

Title: `feat(lazy-hydrate): Security/Portfolio/Price/Transaction wrappers + LinkCache + cache write-through (java)`

The whole Java story lands in one PR. Reviewer sees the full shape: cache → wrappers → resolver pre-warm → mutation write-through.

**LinkCache** — `ledger-models-java/src/main/java/common/util/LinkCache.java`
- [ ] Generic `LinkCache<V>` with `ConcurrentMap<UUID, V>` backing
- [ ] `static final` singletons: `SECURITY`, `PORTFOLIO`, `PRICE`, `TRANSACTION`
- [ ] `get`, `put`, `evict`, `clear`

**Security wrapper** — `common/models/security/Security.java`
- [ ] Mutable `proto` + `isHydrated` boolean
- [ ] `proto()` accessor (never fetches)
- [ ] `getID`, `getAsOf`, `isLink` — link-safe; never hydrate
- [ ] Every other getter (`getProductType`, `getAssetClass`, `getIssuerName`, `getDescription`, `getIdentifiers`, `getIdentifierByType`, `getBondDetails`, `getMaturityDate`, `getIssueDate`, `getCouponRate`, `getFaceValue`, `getCurrentFactor`, `isCash`, MBS/TIPS/FRN extension getters) routes through `ensureHydrated()`
- [ ] `ensureHydrated()`: cache check → on miss `SecurityServiceClient.getLatestByUuid(id)` → on null throw `IllegalStateException` with uuid in message → swap `this.proto`, set `isHydrated=true`, populate cache
- [ ] Delete the `_assert_not_link` / `throwIfLink` guard

**Portfolio, Price, Transaction wrappers** — same shape
- [ ] `common/models/portfolio/Portfolio.java`
- [ ] `common/models/price/Price.java`
- [ ] `common/models/transaction/Transaction.java`
- [ ] For Transaction: `getSecurity()` / `getPortfolio()` / `getPrice()` return wrapped sub-entities (those wrappers self-hydrate); no `ensureHydrated()` on Transaction needed for embedded-link reads

**LinkResolver** — `common/util/LinkResolver.java`
- [ ] `resolveSecuritiesOnTransactions(txs)`: after batch RPC, populate `LinkCache.SECURITY` (no longer mutates wrapper internals)
- [ ] Same for portfolios, prices, transactions
- [ ] Becomes opt-in pre-warm; correctness no longer depends on calling it

**Service-client write-through**
- [ ] `SecurityServiceClient.createOrUpdate`: after RPC, `LinkCache.SECURITY.put(s.getID(), persisted)`
- [ ] Same for Portfolio, Price, Transaction clients
- [ ] Add `getLatestByUuid(UUID)` to each client if missing

**Tests** — single test class per wrapper, 8 cases each:
- [ ] `LinkCacheTest` — get-on-miss, get-after-put, overwrite, evict, singleton isolation, concurrent stress
- [ ] `SecurityLazyHydrateTest` — getter-on-hydrated-no-fetch, getter-on-link-cache-hit, getter-on-link-fetches-on-miss, resolve-fails-throws, link-safe-accessors-don't-hydrate, isLink-false-after-hydrate, second-read-no-refetch, null-proto-throws
- [ ] `PortfolioLazyHydrateTest`, `PriceLazyHydrateTest`, `TransactionLazyHydrateTest` — same 8 cases
- [ ] `LinkResolverWriteThroughTest` — batch resolve populates cache; subsequent getters are cache hits
- [ ] `ServiceClientWriteThroughTest` (one class covering all 4) — createOrUpdate populates cache; immediate read-back is cache hit

**Verification**
- [ ] `./compile.sh --skip-integration` green
- [ ] PR opened
- [ ] PR merged
- [ ] `./release.sh` tags new ledger-models version, publishes to Maven Central + crates.io + PyPI + npm

---

## PR #2 — ledger-service consumer migration

Title: `feat: consume lazy-hydrate ledger-models; remove redundant explicit hydrate calls`

- [ ] Bump `subledger/build.gradle` to the new ledger-models version
- [ ] Audit every `LinkResolver.resolveXOnTransactions(...)` call site
  - [ ] Keep it where it's doing useful batch pre-warming (replay path, large position aggregation)
  - [ ] Remove it where it was there purely "to make the next read work" — now redundant
- [ ] Run `./gradlew :subledger:test` — expect the 5 `Cannot read productType on link-mode Security` failures to disappear. The 20 unrelated failures (fixture / treasury-curve / threading) stay.
- [ ] PR opened, merged

---

## PR #3 — Python migration (ledger-models-python)

Title: `feat(lazy-hydrate): wrappers + LinkCache + cache write-through (python)`

Mirrors PR #1's shape in Python idioms.

- [ ] `fintekkers/wrappers/util/link_cache.py` — module with process-wide singletons; `dict[UUID, X]` backed; `get`, `put`, `evict`
- [ ] `fintekkers/wrappers/models/security/security.py` — replace `_assert_not_link(accessor)` calls with `_ensure_hydrated()`; route every non-link-safe getter
- [ ] `fintekkers/wrappers/models/portfolio.py` (file if missing) — same pattern
- [ ] `fintekkers/wrappers/models/price.py` — same
- [ ] `fintekkers/wrappers/models/transaction.py` — same; nested sub-entity getters return their wrappers (those self-hydrate)
- [ ] `fintekkers/wrappers/util/link_resolver.py` — pre-warm populates `LinkCache`
- [ ] `fintekkers/wrappers/services/{security,portfolio,price,transaction}.py` — `create_or_update` writes through to cache
- [ ] Pytest equivalents of the Java test suite (8 cases per wrapper + LinkCache + LinkResolver + client write-through)
- [ ] `./compile.sh --skip-integration` green (Python unit tests pass)
- [ ] PR opened, merged
- [ ] PyPI wheel published as part of the next ledger-models release

---

## PR #4 — TypeScript migration (ledger-models-javascript)

Title: `feat(lazy-hydrate): wrappers + LinkCache + cache write-through (typescript)`

- [ ] `node/wrappers/util/LinkCache.ts` — Map-based, module-singleton, `SECURITY`/`PORTFOLIO`/`PRICE`/`TRANSACTION` exports
- [ ] `node/wrappers/models/security/Security.ts` + subclasses (`BondSecurity`, `MortgageBackedSecurity`, `FloatingRateNote`, `IndexSecurity`, `TipsBond`) — lazy hydrate via the base class
- [ ] `node/wrappers/models/portfolio/Portfolio.ts`
- [ ] `node/wrappers/models/price/Price.ts`
- [ ] `node/wrappers/models/transaction/transaction.ts`
- [ ] `node/wrappers/util/link-resolver.ts` — pre-warm populates `LinkCache`
- [ ] `node/wrappers/services/*-service/*Service.ts` — `createOrUpdate` write-through
- [ ] Jest tests mirroring the Java suite
- [ ] PR opened, merged
- [ ] npm package published as part of the next ledger-models release

---

## PR #5 — Rust migration (ledger-models-rust)

Title: `feat(lazy-hydrate): wrappers + LinkCache + cache write-through (rust)`

Uses Shape B from the ADR — sync getters return `Result<_, LinkNotResolved>`; async `_async` variants do the RPC.

- [ ] `fintekkers/wrappers/util/link_cache.rs` — `dashmap::DashMap<Uuid, Proto>` (lean DashMap for read-heavy concurrency); module-level `static` singletons via `OnceCell`
- [ ] `fintekkers/wrappers/models/security.rs` — replace `assert_not_link(accessor)` panics with cache-or-error; sync getter returns `Result<_, LinkNotResolved>`; async `_async` getter does the RPC on miss
- [ ] `fintekkers/wrappers/models/portfolio.rs` — same
- [ ] `fintekkers/wrappers/models/price.rs` — same
- [ ] `fintekkers/wrappers/models/transaction.rs` — same
- [ ] `fintekkers/wrappers/util/link_resolver.rs` — populate new `LinkCache` (existing `(uuid, as_of)` LRU stays for explicit-vintage path)
- [ ] Service-stub write-through on `create_or_update`
- [ ] `LinkNotResolved { id: Uuid }` and `ResolveError` error types
- [ ] `cargo test` parity with the Java suite
- [ ] PR opened, merged
- [ ] crates.io publication as part of the next ledger-models release

---

## Phase 5 — Cleanup

- [ ] Delete the (now-unused) `_assert_not_link` / `throwIfLink` / `assert_not_link` guards across all four languages (likely already done as part of each PR; verify nothing was missed)
- [ ] Update [`is_link_pattern.md`](is_link_pattern.md) to point at this ADR for the lazy-vs-explicit-vintage path split
- [ ] Update [`link_resolver.md`](link_resolver.md) — `LinkResolver` is now opt-in pre-warm, not required
- [ ] Close the umbrella tracking issue

---

## Notes for during execution

- **5 PRs total** (#1 Java, #2 ledger-service consumer, #3 Python, #4 TS, #5 Rust) plus Phase 0/5 housekeeping. Resist further splitting.
- **PR #1 must land + release before PR #2 can be merged** — ledger-service consumes the new ledger-models version.
- **PRs #3, #4, #5 are parallel** with each other and with PR #2; each language's release is independent.
- **Update each box with PR number + date** as we go (e.g. `[x] ... — #237 (2026-05-30)`).
- **Branch protection on `main`** (FinTekkers/second-brain#327) means every PR needs green CI before merge.
- **Tests come with the implementation, not after.** Each PR ships its full 8-case wrapper suite.
- **Strategy / StrategyAllocation are out of scope** — no backing service. Don't add `LinkCache.STRATEGY`.
