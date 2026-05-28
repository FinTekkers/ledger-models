# Lazy link hydration — implementation checklist

Companion to [`lazy-link-hydration.md`](lazy-link-hydration.md). One checkbox per concrete action. Update this file as we go — each completed item gets the PR number and date.

## Phase 0 — Pre-execution

- [ ] ADR PR #230 merged
- [ ] Tracking issue filed in `FinTekkers/second-brain` titled "Lazy link hydration rollout — Java/Python/TS/Rust" with this checklist's URL in the body
- [ ] Open the four language follow-up issues, linked to the tracking issue: `lazy-hydrate (java)`, `lazy-hydrate (python)`, `lazy-hydrate (typescript)`, `lazy-hydrate (rust)`. Each is "ready" + `agent:ledger-models-dev`.

---

## Phase 1 — Java (reference implementation)

### Phase 1.A — `LinkCache` class

PR title: `feat(linkcache): latest-only UUID → entity cache for lazy hydration`

- [ ] Branch `feat/linkcache` off `main`
- [ ] Create `ledger-models-java/src/main/java/common/util/LinkCache.java`
  - [ ] Generic class `LinkCache<V>` with `ConcurrentMap<UUID, V>` backing
  - [ ] `static final` singletons: `SECURITY`, `PORTFOLIO`, `PRICE`, `TRANSACTION`
  - [ ] `get(UUID id)`, `put(UUID id, V value)`, `evict(UUID id)`, `clear()`
- [ ] Tests at `ledger-models-java/src/test/java/common/util/LinkCacheTest.java`
  - [ ] `get_returnsNullOnMiss`
  - [ ] `get_returnsPutValue`
  - [ ] `put_overwritesPrior`
  - [ ] `evict_removesEntry`
  - [ ] `singletons_areIsolated` (writing to SECURITY doesn't affect PORTFOLIO)
  - [ ] `concurrentPutsAndGets_areThreadSafe` (small concurrent stress test)
- [ ] `./compile.sh --skip-integration` green
- [ ] PR opened
- [ ] PR merged
- [ ] No release tag yet — `LinkCache` is unused; release after the first consumer

### Phase 1.B — `Security` wrapper migration

PR title: `feat(security): lazy hydrate on first non-link-field access`

- [ ] Branch `feat/security-lazy-hydrate` off latest `main` (which now has LinkCache)
- [ ] `ledger-models-java/src/main/java/common/models/security/Security.java`
  - [ ] Add private mutable fields `proto` (the SecurityProto) and `boolean isHydrated`
  - [ ] Constructor sets `isHydrated = !proto.getIsLink()`
  - [ ] Add `public SecurityProto proto()` accessor
  - [ ] Add private `void ensureHydrated()` that: returns early if hydrated; checks `LinkCache.SECURITY`; on miss calls `SecurityServiceClient.singleton().getLatestByUuid(getID())`; on null throws `IllegalStateException` with uuid in message; on success populates cache + swaps `this.proto`
  - [ ] Route every non-link-safe getter through `ensureHydrated()` (these are: `getProductType`, `getProductTypeProto`, `getAssetClass`, `getIssuerName`, `getDescription`, `getIdentifiers`, `getIdentifierByType`, `getBondDetails`, `getMaturityDate`, `getIssueDate`, `getCouponRate`, `getFaceValue`, `getCurrentFactor`, `isCash`, and the MBS / TIPS / FRN extension getters)
  - [ ] Leave `getID`, `getAsOf`, `isLink` untouched — they only read `proto.getUuid` / `proto.getAsOf` / `proto.getIsLink` + the `isHydrated` flag
  - [ ] Delete the `_assert_not_link` / `throwIfLink` guard helper and all references
- [ ] `ledger-models-java/src/main/java/common/models/security/bonds/*.java` (subclasses): no change needed — they read fields through `Security` accessors which now hydrate themselves
- [ ] Tests at `ledger-models-java/src/test/java/common/models/security/SecurityLazyHydrateTest.java`
  - [ ] `getProductType_onHydratedWrapper_returnsField` (no fetch happens)
  - [ ] `getProductType_onLinkWrapper_hitsCache` (pre-populate cache; assert no RPC)
  - [ ] `getProductType_onLinkWrapper_fetchesOnMiss` (mock service; assert exactly one RPC)
  - [ ] `getProductType_resolveFails_throws` (mock service returns null; assert `IllegalStateException`)
  - [ ] `linkSafeAccessors_doNotHydrate` (call `getID`, `getAsOf`, `isLink` on a link-mode wrapper with no cache + no service; assert no RPC, no exception)
  - [ ] `isLink_falseAfterHydrate` (link wrapper → trigger hydrate → `isLink()` returns false)
  - [ ] `secondReadAfterHydrate_doesNotRefetch` (hydrate once; assert one RPC across multiple getter calls)
  - [ ] `nullProto_throwsAtConstruction` (defensive)
- [ ] `SecurityServiceClient` — add `getLatestByUuid(UUID)` method if it doesn't exist, with proper failure handling
- [ ] `./compile.sh --skip-integration` green
- [ ] PR opened
- [ ] PR merged

### Phase 1.C — `Portfolio` wrapper migration

PR title: `feat(portfolio): lazy hydrate on first non-link-field access`

- [ ] Branch off latest `main`
- [ ] `common/models/portfolio/Portfolio.java` — same pattern as Security
  - [ ] `proto` field + `isHydrated`
  - [ ] `proto()` accessor
  - [ ] `ensureHydrated()` → `LinkCache.PORTFOLIO` → `PortfolioServiceClient.getLatestByUuid`
  - [ ] Route `getPortfolioName` and all other non-uuid/asOf getters
- [ ] Tests mirror Security suite at `PortfolioLazyHydrateTest.java` (8 cases)
- [ ] `PortfolioServiceClient.getLatestByUuid` exists / added
- [ ] `./compile.sh` green
- [ ] PR opened, merged

### Phase 1.D — `Price` wrapper migration

PR title: `feat(price): lazy hydrate on first non-link-field access`

- [ ] Branch
- [ ] `common/models/price/Price.java`
  - [ ] Same pattern
  - [ ] `ensureHydrated()` → `LinkCache.PRICE` → `PriceServiceClient.getLatestByUuid`
  - [ ] Route `getPrice`, `getSecurity` (returns wrapped Security — itself lazy), and other non-link-safe getters
- [ ] Tests at `PriceLazyHydrateTest.java`
- [ ] `PriceServiceClient.getLatestByUuid` exists / added
- [ ] PR opened, merged

### Phase 1.E — `Transaction` wrapper migration

PR title: `feat(transaction): lazy hydrate on first non-link-field access`

- [ ] Branch
- [ ] `common/models/transaction/Transaction.java`
  - [ ] Add `isHydrated` (the proto field already exists from #340)
  - [ ] `proto()` accessor — replaces the existing `getProto()` if not already present in that form; keep the `getWireProto()` strip path from a future C.4 refactor for now stub it as `getProto()` for compat
  - [ ] `ensureHydrated()` → `LinkCache.TRANSACTION` → `TransactionServiceClient.getLatestByUuid`
  - [ ] Route `getTransactionType`, `getQuantity`, `getTradeDate`, `getSettlementDate`, `getTradeName`, `getPositionStatus`, `isCancelled`, `getChildTransactions`, `getStrategyAllocation` through `ensureHydrated()`
  - [ ] Leave `getID`, `getAsOf`, `isLink`, `getValidFrom`, `getValidTo` untouched
  - [ ] `getSecurity()` / `getPortfolio()` / `getPrice()` return the wrapped sub-entity — those wrappers handle their own lazy hydration; no `ensureHydrated()` on the Transaction is needed for embedded-link reads
- [ ] Tests at `TransactionLazyHydrateTest.java`
  - [ ] `getQuantity_onLinkTransactionWrapper_fetchesViaTransactionService`
  - [ ] `getSecurity_onLinkTransaction_returnsLazySecurityWrapper` (asserts the returned Security is link-mode; reading product_type on it triggers SecurityService fetch, not TransactionService)
  - [ ] Plus the standard 8-case suite
- [ ] `TransactionServiceClient.getLatestByUuid` exists / added
- [ ] PR opened, merged

### Phase 1.F — `LinkResolver` writes through to `LinkCache`

PR title: `feat(linkresolver): batch pre-warm populates LinkCache`

- [ ] Branch
- [ ] `common/util/LinkResolver.java`
  - [ ] `resolveSecuritiesOnTransactions(txs)`: after the batch `getByIds` RPC, populate `LinkCache.SECURITY.put(id, proto)` for each resolved entity
  - [ ] `resolvePortfoliosOnTransactions(txs)`: same for `LinkCache.PORTFOLIO`
  - [ ] Add `resolvePricesOnTransactions(txs)` if it didn't exist; populate `LinkCache.PRICE`
  - [ ] Add `resolveTransactionsByLink(txs)` for transaction-level link refs; populate `LinkCache.TRANSACTION`
  - [ ] Stop mutating wrapper internals directly — wrappers handle their own state via `ensureHydrated()` reading from cache
- [ ] Tests
  - [ ] `linkResolver_batchPreWarm_populatesCache` (after call, `LinkCache.SECURITY.get(id)` returns the resolved proto)
  - [ ] `linkResolver_batchPreWarm_subsequentGetterCallsAreCacheHits` (assert no per-getter RPC after batch)
  - [ ] `linkResolver_emptyInput_noRpc`
- [ ] PR opened, merged

### Phase 1.G — Service-client write-through on mutation

PR title: `feat(clients): createOrUpdate writes through to LinkCache`

- [ ] Branch
- [ ] `SecurityServiceClient.createOrUpdate`: after RPC, `LinkCache.SECURITY.put(s.getID(), persisted)`
- [ ] `PortfolioServiceClient.createOrUpdate`: same
- [ ] `PriceServiceClient.createOrUpdate`: same
- [ ] `TransactionServiceClient.createOrUpdate`: same
- [ ] Tests
  - [ ] `createOrUpdate_writesThroughToCache` (mock service; assert cache.put called with the right id+proto)
  - [ ] `createOrUpdate_readBackHitsCache` (call createOrUpdate; immediate read of the same entity returns cached value without RPC)
- [ ] PR opened, merged

### Phase 1.H — release ledger-models + migrate ledger-service callers

PR title (in ledger-service): `feat: consume ledger-models with lazy hydrate`

- [ ] Tag ledger-models — `./release.sh` to publish next version
- [ ] Bump ledger-service `subledger/build.gradle` to the new version
- [ ] Remove explicit `LinkResolver.resolveXOnTransactions(...)` call sites that exist purely to make subsequent reads work — they keep working as pre-warm optimizations, but they're not required for correctness anymore. Audit and remove the ones that are no longer doing useful batching.
- [ ] Run `./gradlew :subledger:test` — the 5 `Cannot read productType on link-mode Security` failures should now pass
- [ ] PR opened, merged
- [ ] Confirm the test suite drops from 25 failures to ≤20

---

## Phase 2 — Python

PR title pattern: `feat(<area>): lazy hydrate on first non-link-field access (python)`

- [ ] Phase 2.A — `fintekkers/wrappers/util/link_cache.py` + tests
- [ ] Phase 2.B — `fintekkers/wrappers/models/security/security.py` lazy hydrate + tests
- [ ] Phase 2.C — `fintekkers/wrappers/models/portfolio.py` (file if missing) lazy hydrate + tests
- [ ] Phase 2.D — `fintekkers/wrappers/models/price.py` lazy hydrate + tests
- [ ] Phase 2.E — `fintekkers/wrappers/models/transaction.py` lazy hydrate + tests
- [ ] Phase 2.F — `fintekkers/wrappers/util/link_resolver.py` writes through to LinkCache + tests
- [ ] Phase 2.G — `fintekkers/wrappers/services/{security,portfolio,price,transaction}.py`: `create_or_update` writes through + tests
- [ ] `compile.sh` green (Python unit tests pass)
- [ ] Release new ledger-models-python wheel to PyPI

For each step:
- [ ] Behavior tests mirror the Java suite (10 cases per wrapper)
- [ ] `_assert_not_link(accessor)` calls replaced with `_ensure_hydrated()`
- [ ] PR opened, merged

---

## Phase 3 — TypeScript / JavaScript

PR title pattern: `feat(<area>): lazy hydrate on first non-link-field access (typescript)`

- [ ] Phase 3.A — `node/wrappers/util/LinkCache.ts` + Jest tests
- [ ] Phase 3.B — `node/wrappers/models/security/Security.ts` + subclasses (`BondSecurity`, `MortgageBackedSecurity`, `FloatingRateNote`, `IndexSecurity`, `TipsBond`) — lazy hydrate via the base `Security` class
- [ ] Phase 3.C — `node/wrappers/models/portfolio/Portfolio.ts`
- [ ] Phase 3.D — `node/wrappers/models/price/Price.ts`
- [ ] Phase 3.E — `node/wrappers/models/transaction/transaction.ts`
- [ ] Phase 3.F — `node/wrappers/util/link-resolver.ts` writes through to LinkCache
- [ ] Phase 3.G — `node/wrappers/services/*-service/*Service.ts`: `createOrUpdate` writes through

For each step:
- [ ] Jest tests mirror the Java suite
- [ ] PR opened, merged
- [ ] npm package published

---

## Phase 4 — Rust

PR title pattern: `feat(<area>): lazy hydrate on first non-link-field access (rust)`

The async wrinkle is decided (Shape B — sync + async getter pair). For each component:

- [ ] Phase 4.A — `fintekkers/wrappers/util/link_cache.rs` + `cargo test`
  - [ ] Module exposes `SECURITY`, `PORTFOLIO`, `PRICE`, `TRANSACTION` static singletons. Choose between `OnceCell` + `RwLock<HashMap<Uuid, Proto>>` vs `dashmap::DashMap` (lean DashMap for read-heavy concurrency).
  - [ ] Tests: same shape as Java's `LinkCacheTest`
- [ ] Phase 4.B — `SecurityWrapper`: lazy hydrate
  - [ ] Replace `assert_not_link(accessor)` panics with cache-and-fetch logic
  - [ ] Sync getter: returns `Result<_, LinkNotResolved>` — cache hit only
  - [ ] Async getter (`_async` suffix): does the RPC on miss
  - [ ] Define `LinkNotResolved { id: Uuid }` and `ResolveError` (network / not-found) error types
  - [ ] Tests
- [ ] Phase 4.C — `PortfolioWrapper`: mirror change
- [ ] Phase 4.D — `PriceWrapper`: mirror change
- [ ] Phase 4.E — `TransactionWrapper`: mirror change
- [ ] Phase 4.F — `LinkResolver` writes through to the new `LinkCache`
  - [ ] Existing `(uuid, as_of)` LRU stays for explicit-vintage path
  - [ ] New `LinkCache` populated as the latest-only-by-uuid path
  - [ ] Tests verify both caches are written when LinkResolver runs
- [ ] Phase 4.G — Service-stub write-through (`tonic`-generated clients wrapped by client structs)
- [ ] `cargo test` green
- [ ] Release new ledger-models crate to crates.io

---

## Phase 5 — Cleanup + ADR follow-ups

- [ ] Delete the (now-unused) `_assert_not_link` / `throwIfLink` / `assert_not_link` guards across all four languages
- [ ] Update [`is_link_pattern.md`](is_link_pattern.md) to point at this ADR for the lazy-vs-explicit-vintage path split
- [ ] Update [`link_resolver.md`](link_resolver.md) — `LinkResolver` is now opt-in pre-warm, not required
- [ ] Close the per-language follow-up issues
- [ ] Close the umbrella tracking issue

---

## Notes for during execution

- **One PR per checkbox.** Resist the urge to bundle multiple components into one PR — review cost dominates.
- **Each PR has a follow-up checkpoint here.** Add the PR number and date in the box (e.g. `[x] ... — #234 (2026-05-30)`).
- **Branch protection on `main`** (FinTekkers/second-brain#327) means every PR must have green CI before merge. If a PR is red, the next phase doesn't start.
- **Tests come with the implementation, not after.** A PR without the matching test row above doesn't merge.
- **Strategy / StrategyAllocation are out of scope** — they have no backing service. Don't add `LinkCache.STRATEGY`.
- **Consumer call-site audit** (Phase 1.H, and the equivalent step for each downstream language) is where regressions actually disappear. If a callsite was hardcoded to call `LinkResolver` before every read, decide explicitly whether to keep it (still useful as pre-warm batching) or remove it (now redundant).
