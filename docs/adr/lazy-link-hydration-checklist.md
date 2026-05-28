# Lazy link hydration — implementation checklist

Companion to [`lazy-link-hydration.md`](lazy-link-hydration.md). **5 PRs total** — one per language migration plus one for the ledger-service consumer side. Each PR is large but coherent ("here's how lazy hydration works in <language>"). Tick boxes inside as we go.

## Phase 0 — Pre-execution

- [x] ADR PR #230 merged (2026-05-28)
- [ ] Tracking issue filed in `FinTekkers/second-brain` titled "Lazy link hydration rollout" with this checklist's URL in the body. One issue total — not one per language.

## Live progress (auto-updated as PRs land)

| PR | What | Status |
|---|---|---|
| ledger-models#231 | Java partial: LinkCache + Security wrapper lazy-hydrate + cash-cache prime + Transaction strip self-prewarm + Transaction.getPrice link-aware | open 2026-05-28 |
| ledger-service#73 | Consumer: bump ledger-models to 0.4.10-SNAPSHOT; validates **5 deterministic test fixes** + 1 bonus | draft (depends on #231) |
| follow-up | Portfolio + Price proto-back + lazy-hydrate (still POJO today) | pending |
| follow-up | Transaction full ensureHydrated | pending (only Price-field lazy in #231) |
| follow-up | LinkResolver write-through to LinkCache | pending |
| follow-up | Service-client write-through on createOrUpdate | pending |
| ledger-models#233 | Python partial: LinkCache (python) + Security wrapper `_ensure_hydrated` + 19 new tests | merged 2026-05-28 |
| follow-up | Python Portfolio + Price + Transaction wrappers (some still not proto-backed) | pending |
| follow-up | Python LinkResolver write-through + service-client write-through | pending |
| ledger-models#234 | TypeScript partial: LinkCache (ts) + Security wrapper `ensureHydrated` + 18 new tests. Cache-only — no fetcher hook, sync getter API preserved | merged 2026-05-28 |
| follow-up | TypeScript Portfolio + Price + Transaction wrappers | pending |
| follow-up | TypeScript LinkResolver write-through + service-client write-through | pending |
| ledger-models#236 | Rust partial: LinkCache (rust) + SecurityWrapper `ensure_hydrated` + 18 new tests. Cache-only via `OnceLock` resolved slot; same design as #234 | open 2026-05-28 |
| follow-up | Rust two-getter Shape B (sync `Result` + async `_async` variant) | pending — captured in ADR §"async wrinkle" |
| follow-up | Rust Portfolio + Price + Transaction wrappers | pending |
| follow-up | Rust LinkResolver write-through + service-stub write-through | pending |
| follow-up | **Collapse LinkResolver internal LRU → LinkCache** (all 4 langs). Post-#237 write-through, the resolver's per-instance LRU stores the same protos as the process-wide LinkCache and is GC'd at the end of most service-wrapper calls (callers rarely thread a shared resolver across calls). Route the resolver's "have we already fetched?" check through `LinkCache.get(uuid, as_of)`, delete the `_TinyLRU` + `cache_size` / `ttl_ms` ctor params, and give `LinkCache` an LRU-with-cap option (per-entity TTLs already noted: Portfolio ~1d, Security ~1d, Transaction ~1m, Price ~30s). Net effect: one cache, one TTL story, one source of truth. Removes the asymmetry where #240's `isCash()` ensure-hydrate reads LinkCache but the resolver writes (and reads) the LRU first. | pending |

**Cross-language scope audit (2026-05-28)**

| Object | Java #231 | Python #233 | TS #234 | Rust #236 |
|---|---|---|---|---|
| `LinkCache` module | ✅ | ✅ | ✅ | ✅ |
| Security wrapper lazy-hydrate | ✅ | ✅ | ✅ | ✅ |
| Cash USD cache priming (tactical) | ✅ | n/a | n/a | n/a |
| Transaction strip-on-write prewarm (tactical) | ✅ | n/a — Python doesn't strip on serialize | n/a | n/a |
| Transaction.getPrice link-aware (tactical) | ✅ | n/a | n/a | n/a |
| Portfolio wrapper lazy-hydrate | pending | pending | pending | pending |
| Price wrapper lazy-hydrate | pending | pending | pending | pending |
| Transaction full `ensureHydrated()` | pending | pending | pending | pending |
| LinkResolver write-through to LinkCache | pending | pending | pending | pending |
| Service-client write-through on createOrUpdate | pending | pending | pending | pending |

**Why Java has tactical extras the others don't:** Java's `Transaction.getProto()` strips embedded Security/Portfolio/Price to `is_link=true` before serializing (see `stripSecurity` / `stripPortfolio` / `stripPrice` in `Transaction.java`). That strip path needed to populate `LinkCache` before stripping so downstream consumers can rehydrate. Python/TS/Rust **do not strip on serialize** — they pass embedded entities through whole — so the same tactical fix does not apply there.

**ledger-service test suite: 25 → 19 failures with #231 merged.** The 5 deterministic failures listed below all turn green. Remaining 19 are fixture gaps, other-service-down tests, and pre-existing unrelated bugs.

**ledger-models-python wrappers: 71/71 pass with #233.** No regressions.
**ledger-models-javascript wrappers: 258/258 pass with #234.** No regressions.
**ledger-models-rust lib: 108/108 pass with #236.** No regressions.

---

## PR #1 — Java migration (ledger-models)

Title: `feat(lazy-hydrate): Security/Portfolio/Price/Transaction wrappers + LinkCache + cache write-through (java)`

The whole Java story lands in one PR. Reviewer sees the full shape: cache → wrappers → resolver pre-warm → mutation write-through.

**Pre-req discovered during planning**: `Portfolio` and `Price` wrappers were never proto-backed (the wrapper-migration work in #338/#340 covered only `Security` and `Transaction`). Both still hold POJO fields and rely on `PortfolioSerializer` / `PriceSerializer`. The lazy-hydrate work depends on the proto-backed shape, so this PR also proto-backs Portfolio and Price before adding their `ensureHydrated()`. The PR is bigger as a result but stays single-concern: "bring all four wrappers to the lazy-hydrate baseline."

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

**Portfolio wrapper** — proto-back AND lazy-hydrate in one move
- [ ] `common/models/portfolio/Portfolio.java`
  - [ ] Replace POJO fields (`portfolioName`) with `proto` (PortfolioProto) + `isHydrated`
  - [ ] Constructor accepts `PortfolioProto`; validate required fields (uuid, asOf)
  - [ ] Keep POJO-args constructor for back-compat (builds proto internally, validates non-null)
  - [ ] `proto()` accessor
  - [ ] `getPortfolioName()` and all non-link-safe getters route through `ensureHydrated()` → `LinkCache.PORTFOLIO` → `PortfolioServiceClient.getLatestByUuid` (or `getByUuid(id, asOf)`)
- [ ] Delete `PortfolioSerializer` (mirror of how `TransactionSerializer` was retired in #340)
- [ ] Update callers of `PortfolioSerializer.getInstance().serialize/deserialize` → `portfolio.proto()` / `new Portfolio(proto)`
  - [ ] `Transaction.buildBaselineProto` line that uses PortfolioSerializer
  - [ ] `ProtoSerializationUtil` serialize/deserialize branches for PortfolioProto

**Price wrapper** — proto-back AND lazy-hydrate in one move
- [ ] `common/models/price/Price.java`
  - [ ] Replace POJO fields (`price`, `security`) with `proto` (PriceProto) + `isHydrated`
  - [ ] Constructor accepts `PriceProto`; validate required fields
  - [ ] Keep POJO-args constructor; build proto internally, validate non-null
  - [ ] `proto()` accessor
  - [ ] `getPrice()`, `getSecurity()`, and all non-link-safe getters route through `ensureHydrated()` → `LinkCache.PRICE` → `PriceServiceClient.getLatestByUuid`
  - [ ] `getSecurity()` returns a wrapped `Security` — that wrapper self-hydrates if its own embedded security is link-mode
  - [ ] Static `CASH_PRICE` rebuild — construct via proto, not POJO field-by-field
- [ ] Delete `PriceSerializer`
- [ ] Update callers
  - [ ] `Transaction.buildBaselineProto` line that uses PriceSerializer
  - [ ] `ProtoSerializationUtil` serialize/deserialize branches for PriceProto

**Transaction wrapper** — already proto-backed; just add lazy-hydrate
- [ ] `common/models/transaction/Transaction.java`
  - [ ] Add `isHydrated` field (proto field already exists from #340)
  - [ ] `ensureHydrated()` → `LinkCache.TRANSACTION` → `TransactionServiceClient.getLatestByUuid`
  - [ ] Route `getTransactionType`, `getQuantity`, `getTradeDate`, `getSettlementDate`, `getTradeName`, `getPositionStatus`, `isCancelled`, `getChildTransactions`, `getStrategyAllocation` through `ensureHydrated()`
  - [ ] `getSecurity()` / `getPortfolio()` / `getPrice()` return wrapped sub-entities (those wrappers self-hydrate); no `ensureHydrated()` on Transaction needed for embedded-link reads

**LinkResolver** — `common/util/LinkResolver.java`
- [ ] `resolveSecuritiesOnTransactions(txs)`: after batch RPC, populate `LinkCache.SECURITY` (no longer mutates wrapper internals)
- [ ] Same for portfolios, prices, transactions
- [ ] Becomes opt-in pre-warm; correctness no longer depends on calling it

**Service-client write-through**
- [ ] `SecurityServiceClient.createOrUpdate`: after RPC, `LinkCache.SECURITY.put(s.getID(), persisted)`
- [ ] Same for Portfolio, Price, Transaction clients
- [ ] Add `getLatestByUuid(UUID)` to each client if missing

**Tests** — one class per wrapper. Every test is **Given / When / Then** so it documents the behavior, not just the name. Mock the service stub at the boundary; assert on RPC invocation count where relevant.

### A. Hydration is called on each accessor when starting from a link-mode proto

The test below proves the wrapper actually hydrates on getter call — without it, lazy hydration is unverified.

- [ ] **`getProductType_onLinkWrapper_invokesResolverOnce`**
  - **Given:** a `SecurityWrapper` built from a `SecurityProto` with `is_link=true`, only `uuid` and `asOf` populated. The mock `SecurityServiceClient.getByUuid(uuid, asOf)` is set to return a full SecurityProto. The `LinkCache.SECURITY` is empty.
  - **When:** caller invokes `wrapper.getProductType()`.
  - **Then:** the mock service is invoked **exactly once** (verify with `verify(mockClient, times(1)).getByUuid(uuid, asOf)`), and the returned ProductTypeProto matches the resolved proto's product_type.

- [ ] **`everyNonLinkSafeAccessor_invokesResolverOnLinkWrapper`** *(parameterized — one row per accessor)*
  - **Given:** link-mode SecurityWrapper, empty cache, mock client returns a populated proto on call.
  - **When:** caller invokes each accessor in turn — `getProductType`, `getAssetClass`, `getIssuerName`, `getDescription`, `getIdentifiers`, `getIdentifierByType(CUSIP)`, `getBondDetails`, `getMaturityDate`, `getIssueDate`, `getCouponRate`, `getFaceValue`, `isCash`, MBS/TIPS/FRN extension getters.
  - **Then:** the first accessor triggers exactly one RPC (or one cache check then one RPC if cache is empty); each accessor returns the field from the resolved proto.

- [ ] **`linkSafeAccessors_doNotInvokeResolver`**
  - **Given:** link-mode SecurityWrapper, empty cache, mock client throws if called.
  - **When:** caller invokes `getID`, `getAsOf`, `isLink`.
  - **Then:** no RPC is made (`verify(mockClient, never()).getByUuid(any(), any())`); returns are correct (uuid from proto, asOf from proto, isLink=true).

### B. Cache behavior — three explicit sub-tests

- [ ] **B.i — `firstAccessorCall_hydratesAndPopulatesCache`**
  - **Given:** link-mode SecurityWrapper for uuid `X`, asOf `T`. `LinkCache.SECURITY.get(X, T)` returns null. Mock client returns a full proto.
  - **When:** caller invokes `wrapper.getProductType()`.
  - **Then:** (1) mock client is called exactly once with `(X, T)`; (2) `LinkCache.SECURITY.get(X, T)` now returns the full proto; (3) wrapper's internal `isHydrated` is `true`.

- [ ] **B.ii — `secondAccessorCallOnSameWrapper_doesNotInvokeResolverAgain`**
  - **Given:** the wrapper from B.i, in the state after the first `getProductType()` call. Cache and internal `isHydrated` flag are populated.
  - **When:** caller invokes `wrapper.getAssetClass()`, then `wrapper.getIssuerName()`, then `wrapper.getProductType()` again.
  - **Then:** mock client is invoked **zero additional times** (still total of 1 across the whole test). All accessors return the right values from the in-wrapper proto.

- [ ] **B.iii — `subsequentNewWrapper_sameUuidSameAsOf_hitsCache`**
  - **Given:** the cache is populated for uuid `X` at asOf `T` (e.g., by a prior LinkResolver pre-warm or by a B.i-style first access). The mock client throws if invoked.
  - **When:** a brand-new `SecurityWrapper(linkProtoFor(X, T))` is constructed and `wrapper.getProductType()` is invoked.
  - **Then:** no RPC is made; cached proto is used; wrapper's `isHydrated` is `true` after the first accessor call.

### C. asOf semantics — the cache honors the link's asOf

- [ ] **C.i — `linkAsOfMatchesCachedAsOf_isCacheHit`**
  - **Given:** cache has an entry for uuid `X` whose `proto.asOf == T1`. Mock client throws if invoked.
  - **When:** caller creates a fresh wrapper from a link proto with `(uuid=X, asOf=T1)` and reads `getProductType()`.
  - **Then:** no RPC; cached entry returned. **Cache key insight verified: matching asOf → hit.**

- [ ] **C.ii — `linkAsOfDiffersFromCached_forcesRefetch`**
  - **Given:** cache has uuid `X` at asOf `T2`. Mock client returns a different proto at asOf `T1` when called for `(X, T1)`.
  - **When:** caller creates a wrapper from a link proto with `(uuid=X, asOf=T1)` and reads `getProductType()`.
  - **Then:** RPC IS made (`verify(...).getByUuid(X, T1)`); the returned product_type matches the T1-vintage proto (NOT the cached T2 one); user is never silently served the wrong vintage.

- [ ] **C.iii — `requestedAsOfNull_withinTtl_hitsCache`**
  - **Given:** cache has uuid `X` at asOf `T2`, cached 10 seconds ago. TTL_FOR_LATEST = 60s. Mock client throws if invoked.
  - **When:** caller creates a wrapper from a link proto with `(uuid=X, asOf=null)` (no asOf specified, meaning "latest acceptable") and reads `getProductType()`.
  - **Then:** within TTL → no RPC; cached entry returned. **null is the deliberate "latest acceptable" sentinel — documented at the get/set boundaries.**

- [ ] **C.iv — `requestedAsOfNull_pastTtl_refetches`**
  - **Given:** cache has uuid `X` at asOf `T2`, cached 90 seconds ago. TTL = 60s. Mock client returns the current version.
  - **When:** caller invokes `read(X, asOf=null)`.
  - **Then:** past TTL → cache miss → service called once. Cache updated with refreshed `cachedAt`. **This closes the cross-process staleness window: a write by another process at 4:05 PM does not stay invisible forever to this process's null-asOf readers — bounded by TTL.**

- [ ] **C.v — `bitemporallyPreciseRead_neverExpiresByTtl`**
  - **Given:** cache has uuid `X` at asOf `T1`, cached 24 hours ago. Mock client throws if invoked.
  - **When:** caller invokes `read(X, asOf=T1)` (non-null, exact match to cached vintage).
  - **Then:** TTL does NOT apply — history doesn't change — cache hit, no RPC.

- [ ] **C.vi — `putOnCache_doesNotEvictNewerVintage`**
  - **Given:** cache has uuid `X` at asOf `T2`.
  - **When:** caller `put`s a proto for uuid `X` at asOf `T1` where `T1 < T2` (older vintage).
  - **Then:** cache entry remains at `T2`; the older `T1` write does not displace the newer cached entry. **(This is the `put` merge logic from the ADR — single-slot semantics with newest-wins on writes.)**

- [ ] **C.vii — `putOnCache_overwritesOlderVintage`**
  - **Given:** cache has uuid `X` at asOf `T1`.
  - **When:** caller `put`s a proto for uuid `X` at asOf `T2` where `T2 > T1` (newer vintage).
  - **Then:** cache entry is now at `T2`; the older proto is gone.

### D. Resolve-failure surfaces clearly

- [ ] **D.i — `getProductType_resolveReturnsNull_throwsIllegalStateException`**
  - **Given:** link-mode wrapper, empty cache, mock client returns null.
  - **When:** caller invokes `wrapper.getProductType()`.
  - **Then:** throws `IllegalStateException` whose message contains the uuid in question. No sentinel value is returned.

- [ ] **D.ii — `getProductType_resolveThrows_propagatesException`**
  - **Given:** link-mode wrapper, empty cache, mock client throws gRPC `UNAVAILABLE`.
  - **When:** caller invokes `wrapper.getProductType()`.
  - **Then:** the gRPC exception propagates. The wrapper does not swallow or transform it into a sentinel.

### E. Mutation write-through

- [ ] **E.i — `createOrUpdate_populatesCache`**
  - **Given:** `LinkCache.SECURITY` does not have uuid `X`. Mock client's `createOrUpdate` returns the persisted proto with asOf `T2`.
  - **When:** caller invokes `SecurityServiceClient.createOrUpdate(wrapper)`.
  - **Then:** after the call returns, `LinkCache.SECURITY.get(X, T2)` returns the persisted proto.

- [ ] **E.ii — `readAfterCreateOrUpdate_hitsCache_noExtraRpc`**
  - **Given:** the state after E.i. Mock client throws on subsequent `getByUuid` calls.
  - **When:** caller wraps a fresh link proto for `(X, T2)` and reads `getProductType()`.
  - **Then:** no RPC; cached proto used.

### F. LinkResolver pre-warm

- [ ] **F.i — `resolveSecuritiesOnTransactions_populatesCacheWithBatchEntries`**
  - **Given:** a `List<Transaction>` with 100 transactions whose security links cover 30 distinct uuid/asOf pairs. Mock client's `getByIds` returns the 30 protos.
  - **When:** `LinkResolver.resolveSecuritiesOnTransactions(txs)` runs.
  - **Then:** the mock client is invoked **exactly once** (batch RPC). After the call, `LinkCache.SECURITY.get(...)` returns the resolved proto for each of the 30 keys.

- [ ] **F.ii — `prewarmThenGetter_isCacheHit`**
  - **Given:** state after F.i. Mock client throws if `getByUuid` is invoked.
  - **When:** caller reads `txs.get(0).getSecurity().getProductType()`.
  - **Then:** no per-getter RPC; cached proto used.

### Coverage scope

Each of these test cases is required for **Security**. The test classes for **Portfolio**, **Price**, and **Transaction** repeat the same 16-case suite (A through F) against their respective service mocks and `LinkCache.PORTFOLIO` / `LinkCache.PRICE` / `LinkCache.TRANSACTION`. The transaction test class adds:

- [ ] **G.i — `txGetSecurity_returnsLazySecurityWrapperWhoseGettersIndependentlyHydrate`**
  - **Given:** a Transaction with a link-mode embedded security (uuid `S`). `LinkCache.TRANSACTION` is empty; `LinkCache.SECURITY` is empty. Mock `TransactionServiceClient` returns a full Transaction proto whose embedded security is itself link-mode (uuid `S`). Mock `SecurityServiceClient` returns a full SecurityProto for `S`.
  - **When:** caller reads `tx.getSecurity().getProductType()`.
  - **Then:** TransactionService is called once (to hydrate the Transaction wrapper); SecurityService is called once (to hydrate the embedded Security). Each cache is populated for its respective wrapper.

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
