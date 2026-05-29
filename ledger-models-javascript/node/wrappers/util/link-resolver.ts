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
import { ZonedDateTime } from '../models/utils/datetime';
import * as LinkCacheModule from './link-cache';

/**
 * LinkResolver — bulk hydration of `is_link=true` entity references into
 * full entities. Implements the consumer side of the `is_link` pattern
 * documented in `docs/adr/is_link_pattern.md`.
 *
 * W4: the resolver no longer owns its own LRU. Cache reads/writes route
 * through the process-wide `LinkCache.SECURITY` / `LinkCache.PORTFOLIO`
 * singletons. The resolver still does concurrent-call dedup (single
 * in-flight RPC per (uuid, as_of)) and bulk per-bucket batching; storage
 * and eviction live in LinkCache.
 *
 * Two surface methods:
 *   - getSecurity(uuid) / getPortfolio(uuid): single-UUID resolution. Cached
 *     and concurrent-deduped.
 *   - resolveSecurities(items) / resolvePortfolios(items): bulk in-place
 *     mutation across a heterogeneous list of items that each have a
 *     proto-style getter+setter for the embedded entity. Collects unique
 *     link UUIDs, fires one batched GetByIds RPC per as_of bucket, mutates
 *     each item's proto to swap the link sub-message for the resolved
 *     full entity.
 *
 * RPC choice: uses `GetByIds` (unary, UUID-keyed bulk) per the ADR.
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
  /**
   * Test injection: clients to use instead of constructing real ones.
   * Production callers should not set these.
   */
  securityClient?: SecurityClient;
  portfolioClient?: PortfolioClient;
}

/**
 * Stable serialization of a LocalTimestampProto for use in in-flight dedup
 * keys and as_of-bucket grouping. Uses the proto's binary form (Uint8Array
 * → base64). Returns the literal "latest" when as_of is undefined so
 * unset and explicit-undefined collapse to the same bucket.
 */
function asOfKey(asOf: LocalTimestampProto | undefined): string {
  if (!asOf) return 'latest';
  const bytes = asOf.serializeBinary();
  return Buffer.from(bytes).toString('base64');
}

function asOfToZdt(asOf: LocalTimestampProto | undefined): ZonedDateTime | null {
  return asOf ? new ZonedDateTime(asOf) : null;
}

// Process-wide default singleton — lazily constructed on first
// `LinkResolver.getDefault()` call. Used by the wrapper `hydrate()`
// methods so callers don't have to thread a resolver instance through
// their code. Override the default by calling `LinkResolver.setDefault(...)`
// at process start (tests with mocked clients, alternate endpoints, etc.).
let defaultLinkResolver: LinkResolver | undefined;

class LinkResolver {
  private securityClient: SecurityClient;
  private portfolioClient: PortfolioClient;

  // Concurrent-call dedupe: a UUID currently being fetched maps to the
  // promise the *first* caller is awaiting. Subsequent callers for the
  // same UUID receive that same promise.
  private securityInFlight = new Map<string, Promise<SecurityProto>>();
  private portfolioInFlight = new Map<string, Promise<PortfolioProto>>();

  /**
   * Process-wide singleton — lazily constructed with default options
   * (env-derived endpoint via `EnvConfig`). The wrapper `hydrate()`
   * methods reach for this when no resolver is passed explicitly, so
   * users get auto-resolve on link-mode wrappers without threading a
   * resolver through every call site.
   */
  static getDefault(): LinkResolver {
    if (!defaultLinkResolver) {
      defaultLinkResolver = new LinkResolver();
    }
    return defaultLinkResolver;
  }

  /**
   * Replace the process-wide default. Call once at process start for
   * tests with mocked clients or to point at a non-default endpoint.
   * Pass `undefined` to clear (next `getDefault()` call rebuilds).
   */
  static setDefault(resolver: LinkResolver | undefined): void {
    defaultLinkResolver = resolver;
  }

  constructor(opts: LinkResolverOptions = {}) {
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
   * `T` is structural: anything with a `proto` field that exposes
   * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
   */
  async resolveSecurities<T extends ResolvableSecurity>(items: T[]): Promise<T[]> {
    if (items.length === 0) return items;

    // Group: as_of bucket → (uuid string → UUID) for items not yet cached.
    const buckets = new Map<string, Map<string, UUID>>();
    for (const item of items) {
      const sec = item.proto.getSecurity();
      if (!sec || !sec.getIsLink()) continue;
      const uuidProto = sec.getUuid();
      if (!uuidProto) continue;
      const uuid = UUID.fromU8Array(uuidProto.getRawUuid_asU8());
      const asOf = sec.getAsOf();
      const uuidStr = uuid.toString();
      if (LinkCacheModule.SECURITY.get(uuidStr, asOfToZdt(asOf))) continue;
      const bucketKey = asOfKey(asOf);
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = new Map<string, UUID>();
        buckets.set(bucketKey, bucket);
      }
      if (!bucket.has(uuidStr)) bucket.set(uuidStr, uuid);
    }

    // One GetByIds RPC per as_of bucket. Fire in parallel.
    await Promise.all(
      Array.from(buckets.entries()).map(async ([bucketKey, uuidMap]) => {
        const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (proto) => proto.getSecurity(), bucketKey);
        const asOfZdt = asOfToZdt(asOf);
        const fetched = await this.batchFetchSecurities(Array.from(uuidMap.values()), asOf);
        for (const proto of fetched) {
          const uuidProto = proto.getUuid();
          if (!uuidProto) continue;
          const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
          LinkCacheModule.SECURITY.put(uuidStr, proto, asOfZdt);
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
      const resolved = LinkCacheModule.SECURITY.get(uuidStr, asOfToZdt(sec.getAsOf()));
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
      const uuidStr = uuid.toString();
      if (LinkCacheModule.PORTFOLIO.get(uuidStr, asOfToZdt(asOf))) continue;
      const bucketKey = asOfKey(asOf);
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = new Map<string, UUID>();
        buckets.set(bucketKey, bucket);
      }
      if (!bucket.has(uuidStr)) bucket.set(uuidStr, uuid);
    }

    await Promise.all(
      Array.from(buckets.entries()).map(async ([bucketKey, uuidMap]) => {
        const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (proto) => proto.getPortfolio(), bucketKey);
        const asOfZdt = asOfToZdt(asOf);
        const fetched = await this.batchFetchPortfolios(Array.from(uuidMap.values()), asOf);
        for (const proto of fetched) {
          const uuidProto = proto.getUuid();
          if (!uuidProto) continue;
          const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
          LinkCacheModule.PORTFOLIO.put(uuidStr, proto, asOfZdt);
        }
      }),
    );

    for (const item of items) {
      const port = item.proto.getPortfolio();
      if (!port || !port.getIsLink()) continue;
      const uuidProto = port.getUuid();
      if (!uuidProto) continue;
      const uuidStr = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
      const resolved = LinkCacheModule.PORTFOLIO.get(uuidStr, asOfToZdt(port.getAsOf()));
      if (resolved) item.proto.setPortfolio(resolved);
    }

    return items;
  }

  /** Test/debug helper. Clears in-flight maps; the process-wide LinkCache
   * is left alone (tests that need to drop a specific cached entry call
   * `LinkCache.SECURITY.evict(uuid)` directly). */
  clearCache(): void {
    this.securityInFlight.clear();
    this.portfolioInFlight.clear();
  }

  // ---------- internals ----------

  private async fetchSecurityProto(uuid: UUID, asOf?: LocalTimestampProto): Promise<SecurityProto> {
    const uuidStr = uuid.toString();
    const asOfZdt = asOfToZdt(asOf);
    const cached = LinkCacheModule.SECURITY.get(uuidStr, asOfZdt);
    if (cached) return cached;

    const key = `${uuidStr}@${asOfKey(asOf)}`;
    const inFlight = this.securityInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchSecurities([uuid], asOf).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Security not found: ${key}`);
      }
      const proto = protos[0];
      LinkCacheModule.SECURITY.put(uuidStr, proto, asOfZdt);
      return proto;
    }).finally(() => {
      this.securityInFlight.delete(key);
    });

    this.securityInFlight.set(key, promise);
    return promise;
  }

  private async fetchPortfolioProto(uuid: UUID, asOf?: LocalTimestampProto): Promise<PortfolioProto> {
    const uuidStr = uuid.toString();
    const asOfZdt = asOfToZdt(asOf);
    const cached = LinkCacheModule.PORTFOLIO.get(uuidStr, asOfZdt);
    if (cached) return cached;

    const key = `${uuidStr}@${asOfKey(asOf)}`;
    const inFlight = this.portfolioInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = this.batchFetchPortfolios([uuid], asOf).then((protos) => {
      if (protos.length === 0) {
        throw new Error(`Portfolio not found: ${key}`);
      }
      const proto = protos[0];
      LinkCacheModule.PORTFOLIO.put(uuidStr, proto, asOfZdt);
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
