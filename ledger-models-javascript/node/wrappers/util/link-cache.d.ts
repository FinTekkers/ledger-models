import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';
import { ZonedDateTime } from '../models/utils/datetime';
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
 * Later Portfolio can likely be 1 day, security 1 day, transaction 1 minute,
 * price 30 seconds — once per-entity TTLs are wired up, the shared singletons
 * below should be constructed with those values.
 */
export declare const DEFAULT_TTL_FOR_LATEST_MS = 600000;
export declare class LinkCache<V> {
    private ttlForLatestMs;
    private map;
    constructor(ttlForLatestMs?: number);
    /**
     * @param uuidKey         the entity uuid rendered as a stable string key
     *                        (use uuid.toString())
     * @param requestedAsOf   null = "latest acceptable" (TTL-bounded);
     *                        non-null = exact-vintage match required (no TTL)
     * @returns the cached value if the lookup is a hit; otherwise undefined
     *          (caller must refetch)
     */
    get(uuidKey: string, requestedAsOf: ZonedDateTime | null): V | undefined;
    /**
     * Newest-wins write: if a cached entry for `uuidKey` already exists with
     * an asOf strictly after the incoming asOf, the write is ignored.
     */
    put(uuidKey: string, value: V, asOf: ZonedDateTime): void;
    evict(uuidKey: string): void;
    clear(): void;
    /** Test helper. */
    size(): number;
    private _sameAsOf;
    private _isStrictlyAfter;
}
export declare const SECURITY: LinkCache<SecurityProto>;
export declare const PORTFOLIO: LinkCache<PortfolioProto>;
export declare const PRICE: LinkCache<PriceProto>;
export declare const TRANSACTION: LinkCache<TransactionProto>;
