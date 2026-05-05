import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { SecurityClient } from '../../fintekkers/services/security-service/security_service_grpc_pb';
import { PortfolioClient } from '../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import Security from '../models/security/security';
import Portfolio from '../models/portfolio/portfolio';
import { UUID } from '../models/utils/uuid';
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
declare class LinkResolver {
    private securityClient;
    private portfolioClient;
    private securityCache;
    private portfolioCache;
    private securityInFlight;
    private portfolioInFlight;
    constructor(opts?: LinkResolverOptions);
    /**
     * Resolve a single SecurityProto by UUID. If `asOf` is supplied, fetch
     * the version of the entity as of that timestamp; otherwise fetch the
     * latest. Cached + concurrent-deduped on the (uuid, asOf) pair.
     * Throws if the server doesn't return the UUID (no silent null).
     */
    getSecurity(uuid: UUID, asOf?: LocalTimestampProto): Promise<Security>;
    /**
     * Resolve a single PortfolioProto by UUID, optionally as of `asOf`.
     * Cached + concurrent-deduped on (uuid, asOf).
     */
    getPortfolio(uuid: UUID, asOf?: LocalTimestampProto): Promise<Portfolio>;
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
    resolveSecurities<T extends ResolvableSecurity>(items: T[]): Promise<T[]>;
    /**
     * Same shape as resolveSecurities, but for embedded PortfolioProto.
     * Honors per-link `as_of` the same way.
     */
    resolvePortfolios<T extends ResolvablePortfolio>(items: T[]): Promise<T[]>;
    /** Test/debug helper. Not part of the stable API. */
    clearCache(): void;
    private fetchSecurityProto;
    private fetchPortfolioProto;
    private batchFetchSecurities;
    private batchFetchPortfolios;
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
