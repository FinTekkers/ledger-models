"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION = exports.PRICE = exports.PORTFOLIO = exports.SECURITY = exports.LinkCache = exports.DEFAULT_MAX_ENTRIES = exports.DEFAULT_TTL_FOR_LATEST_MS = void 0;
/**
 * LinkCache — process-wide cache of resolved proto bodies backing link-mode
 * wrappers. TypeScript mirror of `common.util.LinkCache` (Java) and
 * `fintekkers.wrappers.util.link_cache` (Python). See
 * `docs/adr/lazy-link-hydration.md`.
 *
 * Read semantics (`get`):
 *   - `requestedAsOf == null` ("latest acceptable") — cache hit allowed;
 *     subject to `ttlForLatestMs` to bound cross-process staleness this
 *     process can't observe. Past TTL ⇒ miss.
 *   - `requestedAsOf != null` (bitemporal-precise) — cache hit only when the
 *     cached entry's asOf equals the requested. No TTL — history doesn't
 *     change, so a past vintage cached arbitrarily long is fine.
 *
 * Write semantics (`put`): newest-vintage wins. An older-vintage put does
 * not evict a newer cached entry.
 *
 * Eviction: bounded LRU. When `put` causes the map to exceed `maxEntries`,
 * the least-recently-used entry is removed. `get` bumps recency.
 *
 * Per-entity singletons SECURITY/PORTFOLIO/PRICE/TRANSACTION are tuned
 * for the typical access pattern of each entity (Portfolio + Security
 * change slowly so TTL is 1 day; Price + Transaction change quickly so
 * TTL is short).
 */
exports.DEFAULT_TTL_FOR_LATEST_MS = 600000;
exports.DEFAULT_MAX_ENTRIES = 10000;
class LinkCache {
    constructor(ttlForLatestMs = exports.DEFAULT_TTL_FOR_LATEST_MS, maxEntries = exports.DEFAULT_MAX_ENTRIES) {
        this.ttlForLatestMs = ttlForLatestMs;
        this.maxEntries = maxEntries;
        // Map iteration order = insertion order in JS; on hit we delete+re-insert
        // to bump recency, on overflow we drop the oldest (first) key.
        this.map = new Map();
        if (ttlForLatestMs < 0) {
            throw new Error(`ttlForLatestMs must be non-negative; got ${ttlForLatestMs}`);
        }
        if (maxEntries <= 0) {
            throw new Error(`maxEntries must be > 0; got ${maxEntries}`);
        }
    }
    /**
     * @param uuidKey         the entity uuid rendered as a stable string key
     *                        (use uuid.toString())
     * @param requestedAsOf   null = "latest acceptable" (TTL-bounded);
     *                        non-null = exact-vintage match required (no TTL)
     * @returns the cached value if the lookup is a hit; otherwise undefined
     *          (caller must refetch)
     */
    get(uuidKey, requestedAsOf) {
        const entry = this.map.get(uuidKey);
        if (!entry)
            return undefined;
        if (requestedAsOf == null) {
            if (Date.now() - entry.cachedAtMs > this.ttlForLatestMs) {
                return undefined;
            }
        }
        else {
            if (entry.asOf == null)
                return undefined;
            if (!this._sameAsOf(entry.asOf, requestedAsOf))
                return undefined;
        }
        // Hit — bump recency.
        this.map.delete(uuidKey);
        this.map.set(uuidKey, entry);
        return entry.value;
    }
    /**
     * Newest-wins write: if a cached entry for `uuidKey` already exists with
     * an asOf strictly after the incoming asOf, the write is ignored (but
     * recency is still bumped — the caller saw a fresh reference).
     */
    put(uuidKey, value, asOf) {
        if (!uuidKey || !value) {
            throw new Error(`uuidKey / value must be set; got uuidKey=${uuidKey} value=${value ? '<non-null>' : 'null'}`);
        }
        const existing = this.map.get(uuidKey);
        if (existing && existing.asOf != null && asOf != null && this._isStrictlyAfter(existing.asOf, asOf)) {
            // Recency bump only — older vintage doesn't displace newer cached entry.
            this.map.delete(uuidKey);
            this.map.set(uuidKey, existing);
            return;
        }
        if (this.map.has(uuidKey))
            this.map.delete(uuidKey);
        this.map.set(uuidKey, { value, asOf, cachedAtMs: Date.now() });
        while (this.map.size > this.maxEntries) {
            const oldest = this.map.keys().next().value;
            if (oldest === undefined)
                break;
            this.map.delete(oldest);
        }
    }
    evict(uuidKey) {
        this.map.delete(uuidKey);
    }
    clear() {
        this.map.clear();
    }
    /** Test helper. */
    size() {
        return this.map.size;
    }
    _sameAsOf(a, b) {
        return a.getSeconds() === b.getSeconds() && a.getNanoSeconds() === b.getNanoSeconds();
    }
    _isStrictlyAfter(a, b) {
        if (a.getSeconds() !== b.getSeconds())
            return a.getSeconds() > b.getSeconds();
        return a.getNanoSeconds() > b.getNanoSeconds();
    }
}
exports.LinkCache = LinkCache;
// Per-entity singletons. Tuned for the access pattern of each entity:
//   Portfolio / Security: 1-day TTL on null-as_of reads (entities change
//       infrequently); large caps because the universe is large.
//   Transaction: 1-minute TTL (high churn).
//   Price: 30-second TTL (very high churn).
exports.SECURITY = new LinkCache(86400000, 100000);
exports.PORTFOLIO = new LinkCache(86400000, 10000);
exports.PRICE = new LinkCache(30000, 200000);
exports.TRANSACTION = new LinkCache(60000, 100000);
//# sourceMappingURL=link-cache.js.map