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
declare class LinkResolver {
    private securityClient;
    private portfolioClient;
    private securityInFlight;
    private portfolioInFlight;
    /**
     * Process-wide singleton — lazily constructed with default options
     * (env-derived endpoint via `EnvConfig`). The wrapper `hydrate()`
     * methods reach for this when no resolver is passed explicitly, so
     * users get auto-resolve on link-mode wrappers without threading a
     * resolver through every call site.
     */
    static getDefault(): LinkResolver;
    /**
     * Replace the process-wide default. Call once at process start for
     * tests with mocked clients or to point at a non-default endpoint.
     * Pass `undefined` to clear (next `getDefault()` call rebuilds).
     */
    static setDefault(resolver: LinkResolver | undefined): void;
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
     * `T` is structural: anything with a `proto` field that exposes
     * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
     */
    resolveSecurities<T extends ResolvableSecurity>(items: T[]): Promise<T[]>;
    /**
     * Same shape as resolveSecurities, but for embedded PortfolioProto.
     * Honors per-link `as_of` the same way.
     */
    resolvePortfolios<T extends ResolvablePortfolio>(items: T[]): Promise<T[]>;
    /** Test/debug helper. Clears in-flight maps; the process-wide LinkCache
     * is left alone (tests that need to drop a specific cached entry call
     * `LinkCache.SECURITY.evict(uuid)` directly). */
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
