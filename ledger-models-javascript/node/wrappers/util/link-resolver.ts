import { promisify } from 'util';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { UUIDProto } from '../../fintekkers/models/util/uuid_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';

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
 *
 * Time-travel (`as_of`) semantic: per is_link_pattern.md addendum, when
 * a link sub-message has only `uuid` set the resolver fetches the latest
 * version. When the link sub-message ALSO has `as_of` set, the resolver
 * fetches the version of the entity as of that timestamp. The cache is
 * keyed on (uuid, as_of) so the same UUID at different timestamps does
 * not collide. Bulk lookups group by `as_of` (one GetByIds RPC per unique
 * timestamp bucket, since the request proto carries a single as_of).
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

/**
 * Stable serialization of a LocalTimestampProto for use in cache keys
 * and as_of-bucket grouping. Uses the proto's binary form (Uint8Array
 * → base64). Returns the literal "latest" when as_of is undefined so
 * unset and explicit-undefined collapse to the same bucket.
 *
 * Two LocalTimestampProto instances representing the same moment will
 * produce the same key as long as the underlying nanos/seconds match —
 * proto3 binary encoding is canonical for unset fields.
 */
function asOfKey(asOf: LocalTimestampProto | undefined): string {
  if (!asOf) return 'latest';
  // serializeBinary returns Uint8Array.
  const bytes = asOf.serializeBinary();
  return Buffer.from(bytes).toString('base64');
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
   * Resolve a single SecurityProto by UUID. If `asOf` is supplied, fetch
   * the version of the entity as of that timestamp; otherwise fetch the
   * latest. Cached + concurrent-deduped on the (uuid, asOf) pair.
   * Throws if the server doesn't return the UUID (no silent null).
   */
  async getSecurity(uuid: UUID, asOf?: LocalTimestampProto): Promise<Security> {
    const proto = await this.fetchSecurityProto(uuid, asOf);
    return Security.create(proto);
  }

  /**
   * Resolve a single PortfolioProto by UUID, optionally as of `asOf`.
   * Cached + concurrent-deduped on (uuid, asOf).
   */
  async getPortfolio(uuid: UUID, asOf?: LocalTimestampProto): Promise<Portfolio> {
    const proto = await this.fetchPortfolioProto(uuid, asOf);
    return new Portfolio(proto);
  }

  /**
   * Walk `items`, find the ones whose embedded security is `is_link=true`,
   * batch-fetch the unique (uuid, as_of) pairs (grouped by as_of so each
   * GetByIds RPC carries one timestamp), and mutate each item's proto in
   * place so subsequent `item.getSecurity()` calls return the full entity.
   * Returns the same array for chaining.
   *
   * Honors per-link `as_of`: if the embedded sub-message has `as_of` set,
   * the resolver fetches the version of the entity at that timestamp,
   * not the latest.
   *
   * `T` is structural: anything with a `proto` field that exposes
   * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
   */
  async resolveSecurities<T extends ResolvableSecurity>(items: T[]): Promise<T[]> {
    if (items.length === 0) return items;

    // Group: as_of bucket → (cacheKey → UUID) for items not yet cached.
    const buckets = new Map<string, Map<string, UUID>>();
    for (const item of items) {
      const sec = item.proto.getSecurity();
      if (!sec || !sec.getIsLink()) continue;
      const uuidProto = sec.getUuid();
      if (!uuidProto) continue;
      const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
      const asOf = sec.getAsOf();
      const bucketKey = asOfKey(asOf);
      const cacheKey = `${uuid.toString()}@${bucketKey}`;
      // Skip if already cached for this exact (uuid, as_of).
      if (this.securityCache.get(cacheKey)) continue;
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = new Map<string, UUID>();
        buckets.set(bucketKey, bucket);
      }
      if (!bucket.has(cacheKey)) bucket.set(cacheKey, uuid);
    }

    // One GetByIds RPC per as_of bucket. Fire in parallel.
    await Promise.all(
      Array.from(buckets.entries()).map(async ([bucketKey, uuidMap]) => {
        // Recover the LocalTimestampProto for this bucket from the first
        // item whose serialized as_of matches. We could store it alongside
        // but it's cheap to re-find.
        const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (sec) => sec.getSecurity(), bucketKey);
        const fetched = await this.batchFetchSecurities(Array.from(uuidMap.values()), asOf);
        for (const proto of fetched) {
          const uuidProto = proto.getUuid();
          if (!uuidProto) continue;
          const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
          this.securityCache.set(`${uuidStr}@${bucketKey}`, proto);
        }
      }),
    );

    // Mutate each item's embedded security in place.
    for (const item of items) {
      const sec = item.proto.getSecurity();
      if (!sec || !sec.getIsLink()) continue;
      const uuidProto = sec.getUuid();
      if (!uuidProto) continue;
      const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
      const bucketKey = asOfKey(sec.getAsOf());
      const resolved = this.securityCache.get(`${uuidStr}@${bucketKey}`);
      if (resolved) item.proto.setSecurity(resolved);
    }

    return items;
  }

  /**
   * Same shape as resolveSecurities, but for embedded PortfolioProto.
   * Honors per-link `as_of` the same way.
   */
  async resolvePortfolios<T extends ResolvablePortfolio>(items: T[]): Promise<T[]> {
    if (items.length === 0) return items;

    const buckets = new Map<string, Map<string, UUID>>();
    for (const item of items) {
      const port = item.proto.getPortfolio();
      if (!port || !port.getIsLink()) continue;
      const uuidProto = port.getUuid();
      if (!uuidProto) continue;
      const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
      const asOf = port.getAsOf();
      const bucketKey = asOfKey(asOf);
      const cacheKey = `${uuid.toString()}@${bucketKey}`;
      if (this.portfolioCache.get(cacheKey)) continue;
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = new Map<string, UUID>();
        buckets.set(bucketKey, bucket);
      }
      if (!bucket.has(cacheKey)) bucket.set(cacheKey, uuid);
    }

    await Promise.all(
      Array.from(buckets.entries()).map(async ([bucketKey, uuidMap]) => {
        const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (it) => it.getPortfolio(), bucketKey);
        const fetched = await this.batchFetchPortfolios(Array.from(uuidMap.values()), asOf);
        for (const proto of fetched) {
          const uuidProto = proto.getUuid();
          if (!uuidProto) continue;
          const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
          this.portfolioCache.set(`${uuidStr}@${bucketKey}`, proto);
        }
      }),
    );

    for (const item of items) {
      const port = item.proto.getPortfolio();
      if (!port || !port.getIsLink()) continue;
      const uuidProto = port.getUuid();
      if (!uuidProto) continue;
      const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
      const bucketKey = asOfKey(port.getAsOf());
      const resolved = this.portfolioCache.get(`${uuidStr}@${bucketKey}`);
      if (resolved) item.proto.setPortfolio(resolved);
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

  private async fetchSecurityProto(uuid: UUID, asOf?: LocalTimestampProto): Promise<SecurityProto> {
    const key = `${uuid.toString()}@${asOfKey(asOf)}`;

    const cached = this.securityCache.get(key);
    if (cached) return cached;

    const inFlight = this.securityInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchSecurities([uuid], asOf).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Security not found: ${uuid.toString()}@${asOfKey(asOf)}`);
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

  private async fetchPortfolioProto(uuid: UUID, asOf?: LocalTimestampProto): Promise<PortfolioProto> {
    const key = `${uuid.toString()}@${asOfKey(asOf)}`;

    const cached = this.portfolioCache.get(key);
    if (cached) return cached;

    const inFlight = this.portfolioInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchPortfolios([uuid], asOf).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Portfolio not found: ${uuid.toString()}@${asOfKey(asOf)}`);
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

  private async batchFetchSecurities(uuids: UUID[], asOf?: LocalTimestampProto): Promise<SecurityProto[]> {
    if (uuids.length === 0) return [];
    const request = new QuerySecurityRequestProto();
    request.setObjectClass('SecurityRequest');
    request.setVersion('0.0.1');
    const uuidProtos: UUIDProto[] = uuids.map((u) => u.toUUIDProto());
    request.setUuidsList(uuidProtos);
    if (asOf) request.setAsOf(asOf);

    const getByIdsAsync = promisify(this.securityClient.getByIds.bind(this.securityClient));
    const response = (await getByIdsAsync(request)) as QuerySecurityResponseProto;
    return response.getSecurityResponseList();
  }

  private async batchFetchPortfolios(uuids: UUID[], asOf?: LocalTimestampProto): Promise<PortfolioProto[]> {
    if (uuids.length === 0) return [];
    const request = new QueryPortfolioRequestProto();
    request.setObjectClass('PortfolioRequest');
    request.setVersion('0.0.1');
    const uuidProtos: UUIDProto[] = uuids.map((u) => u.toUUIDProto());
    request.setUuidsList(uuidProtos);
    if (asOf) request.setAsOf(asOf);

    const getByIdsAsync = promisify(this.portfolioClient.getByIds.bind(this.portfolioClient));
    const response = (await getByIdsAsync(request)) as QueryPortfolioResponseProto;
    return response.getPortfolioResponseList();
  }
}

/**
 * Walk `items` and return the first sub-message's as_of whose serialized
 * key matches `bucketKey`. Used by the bulk resolvers to recover the
 * canonical LocalTimestampProto instance for a bucket.
 */
function findAsOfForBucket<T extends { proto: any }>(
  items: T[],
  read: (proto: any) => SecurityProto | PortfolioProto | undefined,
  bucketKey: string,
): LocalTimestampProto | undefined {
  for (const item of items) {
    const sub = read(item.proto);
    if (!sub || !sub.getIsLink()) continue;
    const asOf = sub.getAsOf();
    if (asOfKey(asOf) === bucketKey) return asOf;
  }
  return undefined;
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
