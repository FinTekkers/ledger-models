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
export const DEFAULT_TTL_FOR_LATEST_MS = 600_000;

interface CacheEntry<V> {
  value: V;
  /** Bitemporal asOf carried by the cached value. */
  asOf: ZonedDateTime;
  /** Wall-clock ms at the moment this entry was cached. */
  cachedAtMs: number;
}

export class LinkCache<V> {
  private map = new Map<string, CacheEntry<V>>();

  constructor(private ttlForLatestMs: number = DEFAULT_TTL_FOR_LATEST_MS) {
    if (ttlForLatestMs < 0) {
      throw new Error(`ttlForLatestMs must be non-negative; got ${ttlForLatestMs}`);
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
  get(uuidKey: string, requestedAsOf: ZonedDateTime | null): V | undefined {
    const entry = this.map.get(uuidKey);
    if (!entry) return undefined;
    if (requestedAsOf == null) {
      if (Date.now() - entry.cachedAtMs > this.ttlForLatestMs) {
        return undefined;
      }
      return entry.value;
    }
    return this._sameAsOf(entry.asOf, requestedAsOf) ? entry.value : undefined;
  }

  /**
   * Newest-wins write: if a cached entry for `uuidKey` already exists with
   * an asOf strictly after the incoming asOf, the write is ignored.
   */
  put(uuidKey: string, value: V, asOf: ZonedDateTime): void {
    if (!uuidKey || !value || !asOf) {
      throw new Error(
        `uuidKey / value / asOf must all be set; got uuidKey=${uuidKey} value=${value ? '<non-null>' : 'null'} asOf=${asOf}`
      );
    }
    const existing = this.map.get(uuidKey);
    if (existing && this._isStrictlyAfter(existing.asOf, asOf)) {
      return;
    }
    this.map.set(uuidKey, { value, asOf, cachedAtMs: Date.now() });
  }

  evict(uuidKey: string): void {
    this.map.delete(uuidKey);
  }

  clear(): void {
    this.map.clear();
  }

  /** Test helper. */
  size(): number {
    return this.map.size;
  }

  private _sameAsOf(a: ZonedDateTime, b: ZonedDateTime): boolean {
    return a.getSeconds() === b.getSeconds() && a.getNanoSeconds() === b.getNanoSeconds();
  }

  private _isStrictlyAfter(a: ZonedDateTime, b: ZonedDateTime): boolean {
    if (a.getSeconds() !== b.getSeconds()) return a.getSeconds() > b.getSeconds();
    return a.getNanoSeconds() > b.getNanoSeconds();
  }
}

export const SECURITY = new LinkCache<SecurityProto>();
export const PORTFOLIO = new LinkCache<PortfolioProto>();
export const PRICE = new LinkCache<PriceProto>();
export const TRANSACTION = new LinkCache<TransactionProto>();
