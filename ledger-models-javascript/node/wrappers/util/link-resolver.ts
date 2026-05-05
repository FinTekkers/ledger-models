import { promisify } from 'util';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { UUIDProto } from '../../fintekkers/models/util/uuid_pb';

import { SecurityClient } from '../../fintekkers/services/security-service/security_service_grpc_pb';
import { PortfolioClient } from '../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';

import Security from '../models/security/security';
import Portfolio from '../models/portfolio/portfolio';
import { UUID } from '../models/utils/uuid';
import EnvConfig from '../models/utils/requestcontext';

/**
 * LinkResolver — bulk hydration of `is_link=true` entity references into
 * full entities. Implements the consumer side of the `is_link` pattern
 * documented in `docs/adr/is_link_pattern.md`.
 *
 * Two surface methods:
 *   - getSecurity(uuid) / getPortfolio(uuid): single-UUID resolution. Cached
 *     and concurrent-deduped.
 *   - resolveSecurities(items) / resolvePortfolios(items): bulk in-place
 *     mutation across a heterogeneous list of items that each have a
 *     proto-style getter+setter for the embedded entity. Collects unique
 *     link UUIDs, fires one batched GetByIds RPC, mutates each item's proto
 *     to swap the link sub-message for the resolved full entity (with
 *     is_link=false on the embedded copy).
 *
 * Caching:
 *   - Process-level LRU keyed on UUID string. Default 1000 entries, no TTL
 *     (entries live until evicted by LRU). Long-running services that need
 *     freshness should pass `{ ttlMs: <ms> }`. Tests can disable with
 *     `{ cacheSize: 0 }`.
 *   - Concurrent same-UUID requests are deduped via an in-flight promise
 *     map — N parallel callers for the same UUID share one RPC.
 *
 * RPC choice: uses `GetByIds` (unary, UUID-keyed bulk) per the ADR. The
 * existing `SecurityService.search` (streaming) would also work but
 * requires more wrapper plumbing for batched-by-UUID semantics.
 *
 * Mutation semantic: when bulk-resolving, the embedded sub-message is
 * replaced (not the outer entity). Outer Price.proto.is_link is unchanged;
 * only the inner SecurityProto is swapped from link-stub to full entity.
 * Wrapper objects that read through the proto (`price.getSecurity()`)
 * automatically see the resolved data.
 */
export interface LinkResolverOptions {
  /** Optional API key. If omitted, EnvConfig.apiCredentials is used. */
  apiKey?: string;
  /** LRU max entries. Default 1000. Set to 0 to disable caching. */
  cacheSize?: number;
  /** Per-entry TTL in ms. Default undefined (no expiry). */
  ttlMs?: number;
  /**
   * Test injection: clients to use instead of constructing real ones.
   * Production callers should not set these.
   */
  securityClient?: SecurityClient;
  portfolioClient?: PortfolioClient;
}

interface CacheEntry<V> {
  value: V;
  insertedAt: number;
}

/**
 * Tiny LRU. Map keeps insertion order; on get-hit we delete + re-insert
 * to bump to the end (most recently used). On overflow we drop the
 * oldest entry (first key in the Map). Avoids pulling in lru-cache as a
 * dependency for ~30 lines of logic.
 */
class TinyLRU<V> {
  private map = new Map<string, CacheEntry<V>>();
  constructor(private maxSize: number, private ttlMs?: number) {}

  get(key: string): V | undefined {
    if (this.maxSize === 0) return undefined;
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs !== undefined && Date.now() - entry.insertedAt > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    // Bump to most-recently-used.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.maxSize === 0) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, insertedAt: Date.now() });
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

class LinkResolver {
  private securityClient: SecurityClient;
  private portfolioClient: PortfolioClient;

  private securityCache: TinyLRU<SecurityProto>;
  private portfolioCache: TinyLRU<PortfolioProto>;

  // Concurrent-call dedupe: a UUID currently being fetched maps to the
  // promise the *first* caller is awaiting. Subsequent callers for the
  // same UUID receive that same promise.
  private securityInFlight = new Map<string, Promise<SecurityProto>>();
  private portfolioInFlight = new Map<string, Promise<PortfolioProto>>();

  constructor(opts: LinkResolverOptions = {}) {
    const cacheSize = opts.cacheSize ?? 1000;
    const ttlMs = opts.ttlMs;

    this.securityCache = new TinyLRU(cacheSize, ttlMs);
    this.portfolioCache = new TinyLRU(cacheSize, ttlMs);

    if (opts.securityClient) {
      this.securityClient = opts.securityClient;
    } else if (opts.apiKey) {
      const { credentials, interceptors } = EnvConfig.getAuthenticatedClientOptions(opts.apiKey);
      this.securityClient = new SecurityClient(EnvConfig.apiURL, credentials, { interceptors });
    } else {
      this.securityClient = new SecurityClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
    }

    if (opts.portfolioClient) {
      this.portfolioClient = opts.portfolioClient;
    } else if (opts.apiKey) {
      const { credentials, interceptors } = EnvConfig.getAuthenticatedClientOptions(opts.apiKey);
      this.portfolioClient = new PortfolioClient(EnvConfig.apiURL, credentials, { interceptors });
    } else {
      this.portfolioClient = new PortfolioClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
    }
  }

  /**
   * Resolve a single SecurityProto by UUID. Cached + concurrent-deduped.
   * Throws if the server doesn't return the UUID (no silent null).
   */
  async getSecurity(uuid: UUID): Promise<Security> {
    const proto = await this.fetchSecurityProto(uuid);
    return Security.create(proto);
  }

  /**
   * Resolve a single PortfolioProto by UUID. Cached + concurrent-deduped.
   */
  async getPortfolio(uuid: UUID): Promise<Portfolio> {
    const proto = await this.fetchPortfolioProto(uuid);
    return new Portfolio(proto);
  }

  /**
   * Walk `items`, find the ones whose embedded security is `is_link=true`
   * (or unset), batch-fetch the unique UUIDs in one GetByIds RPC, and
   * mutate each item's proto in place so subsequent `item.getSecurity()`
   * calls return the full entity. Returns the same array for chaining.
   *
   * `T` is structural: anything with a `proto` field that exposes
   * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
   */
  async resolveSecurities<T extends ResolvableSecurity>(items: T[]): Promise<T[]> {
    if (items.length === 0) return items;

    const uuidsToFetch = new Map<string, UUID>();
    for (const item of items) {
      const sec = item.proto.getSecurity();
      if (!sec || !sec.getIsLink()) continue;
      const uuidProto = sec.getUuid();
      if (!uuidProto) continue;
      const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
      const key = uuid.toString();
      // Skip if already cached.
      if (this.securityCache.get(key)) {
        uuidsToFetch.delete(key);
        continue;
      }
      if (!uuidsToFetch.has(key)) uuidsToFetch.set(key, uuid);
    }

    if (uuidsToFetch.size > 0) {
      const fetched = await this.batchFetchSecurities(Array.from(uuidsToFetch.values()));
      for (const proto of fetched) {
        const uuidProto = proto.getUuid();
        if (!uuidProto) continue;
        const key = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        this.securityCache.set(key, proto);
      }
    }

    // Mutate each item's embedded security in place.
    for (const item of items) {
      const sec = item.proto.getSecurity();
      if (!sec || !sec.getIsLink()) continue;
      const uuidProto = sec.getUuid();
      if (!uuidProto) continue;
      const key = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
      const resolved = this.securityCache.get(key);
      if (resolved) {
        item.proto.setSecurity(resolved);
      }
    }

    return items;
  }

  /**
   * Same shape as resolveSecurities, but for embedded PortfolioProto.
   */
  async resolvePortfolios<T extends ResolvablePortfolio>(items: T[]): Promise<T[]> {
    if (items.length === 0) return items;

    const uuidsToFetch = new Map<string, UUID>();
    for (const item of items) {
      const port = item.proto.getPortfolio();
      if (!port || !port.getIsLink()) continue;
      const uuidProto = port.getUuid();
      if (!uuidProto) continue;
      const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
      const key = uuid.toString();
      if (this.portfolioCache.get(key)) {
        uuidsToFetch.delete(key);
        continue;
      }
      if (!uuidsToFetch.has(key)) uuidsToFetch.set(key, uuid);
    }

    if (uuidsToFetch.size > 0) {
      const fetched = await this.batchFetchPortfolios(Array.from(uuidsToFetch.values()));
      for (const proto of fetched) {
        const uuidProto = proto.getUuid();
        if (!uuidProto) continue;
        const key = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        this.portfolioCache.set(key, proto);
      }
    }

    for (const item of items) {
      const port = item.proto.getPortfolio();
      if (!port || !port.getIsLink()) continue;
      const uuidProto = port.getUuid();
      if (!uuidProto) continue;
      const key = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
      const resolved = this.portfolioCache.get(key);
      if (resolved) {
        item.proto.setPortfolio(resolved);
      }
    }

    return items;
  }

  /** Test/debug helper. Not part of the stable API. */
  clearCache(): void {
    this.securityCache.clear();
    this.portfolioCache.clear();
    this.securityInFlight.clear();
    this.portfolioInFlight.clear();
  }

  // ---------- internals ----------

  private async fetchSecurityProto(uuid: UUID): Promise<SecurityProto> {
    const key = uuid.toString();

    const cached = this.securityCache.get(key);
    if (cached) return cached;

    const inFlight = this.securityInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchSecurities([uuid]).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Security not found: ${key}`);
      }
      const proto = protos[0];
      this.securityCache.set(key, proto);
      return proto;
    }).finally(() => {
      this.securityInFlight.delete(key);
    });

    this.securityInFlight.set(key, promise);
    return promise;
  }

  private async fetchPortfolioProto(uuid: UUID): Promise<PortfolioProto> {
    const key = uuid.toString();

    const cached = this.portfolioCache.get(key);
    if (cached) return cached;

    const inFlight = this.portfolioInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchPortfolios([uuid]).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Portfolio not found: ${key}`);
      }
      const proto = protos[0];
      this.portfolioCache.set(key, proto);
      return proto;
    }).finally(() => {
      this.portfolioInFlight.delete(key);
    });

    this.portfolioInFlight.set(key, promise);
    return promise;
  }

  private async batchFetchSecurities(uuids: UUID[]): Promise<SecurityProto[]> {
    if (uuids.length === 0) return [];
    const request = new QuerySecurityRequestProto();
    request.setObjectClass('SecurityRequest');
    request.setVersion('0.0.1');
    const uuidProtos: UUIDProto[] = uuids.map((u) => u.toUUIDProto());
    request.setUuidsList(uuidProtos);

    const getByIdsAsync = promisify(this.securityClient.getByIds.bind(this.securityClient));
    const response = (await getByIdsAsync(request)) as QuerySecurityResponseProto;
    return response.getSecurityResponseList();
  }

  private async batchFetchPortfolios(uuids: UUID[]): Promise<PortfolioProto[]> {
    if (uuids.length === 0) return [];
    const request = new QueryPortfolioRequestProto();
    request.setObjectClass('PortfolioRequest');
    request.setVersion('0.0.1');
    const uuidProtos: UUIDProto[] = uuids.map((u) => u.toUUIDProto());
    request.setUuidsList(uuidProtos);

    const getByIdsAsync = promisify(this.portfolioClient.getByIds.bind(this.portfolioClient));
    const response = (await getByIdsAsync(request)) as QueryPortfolioResponseProto;
    return response.getPortfolioResponseList();
  }
}

/**
 * Structural type — anything with a proto that has getSecurity/setSecurity
 * (Price, Transaction, etc.) is resolvable.
 */
export interface ResolvableSecurity {
  proto: {
    getSecurity(): SecurityProto | undefined;
    setSecurity(s: SecurityProto): unknown;
  };
}

export interface ResolvablePortfolio {
  proto: {
    getPortfolio(): PortfolioProto | undefined;
    setPortfolio(p: PortfolioProto): unknown;
  };
}

export default LinkResolver;
