import type { CreateSecurityMetricRequestProto, CreateSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import type { GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import type { SearchSecurityMetricRequestProto, SearchSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { ZonedDateTime } from '../../models/utils/datetime';
import { SecurityMetricServiceError, type DateInput, type MetricResult, type MetricSeries, type RecordPointsInput, type SecurityIdInput, type SecurityMetricInput } from '../../models/security/security_metric';
import { type Endpoint, type Env } from '../../util/serviceaddress';
/** Default per-call deadline of the gRPC fetcher. */
export declare const DEFAULT_DEADLINE_MS = 30000;
/** The three SecurityMetric RPCs. `search` returns every streamed message, in order. */
export interface SecurityMetricFetcher {
    getLatest(request: GetLatestSecurityMetricRequestProto): Promise<GetLatestSecurityMetricResponseProto>;
    search(request: SearchSecurityMetricRequestProto): Promise<SearchSecurityMetricResponseProto[]>;
    createOrUpdate(request: CreateSecurityMetricRequestProto): Promise<CreateSecurityMetricResponseProto>;
}
export interface GrpcFetcherOptions {
    /** Per-call deadline in milliseconds (default 30000). */
    deadlineMs?: number;
}
/**
 * The default fetcher: a gRPC client for one endpoint. Errors become
 * `ServiceUnavailable` (gRPC UNAVAILABLE) or `SecurityMetricServiceError`,
 * both naming `host:port` and the status.
 */
export declare class GrpcSecurityMetricFetcher implements SecurityMetricFetcher {
    readonly address: string;
    readonly deadlineMs: number;
    private readonly client;
    constructor(endpoint: Endpoint, options?: GrpcFetcherOptions);
    close(): void;
    private callOptions;
    /** The service error for a failed call to `rpc`. */
    toServiceError(rpc: string, err: unknown): SecurityMetricServiceError;
    getLatest(request: GetLatestSecurityMetricRequestProto): Promise<GetLatestSecurityMetricResponseProto>;
    search(request: SearchSecurityMetricRequestProto): Promise<SearchSecurityMetricResponseProto[]>;
    createOrUpdate(request: CreateSecurityMetricRequestProto): Promise<CreateSecurityMetricResponseProto>;
}
export interface SecurityMetricServiceOptions {
    /** Fetcher for this instance only. Default: gRPC to `resolve(Service.PRICE, env)`. */
    fetcher?: SecurityMetricFetcher;
    /** Environment the default address is resolved from (default `process.env`). */
    env?: Env;
    /** Per-call deadline of the default gRPC fetcher in milliseconds (default 30000). */
    deadlineMs?: number;
}
declare class SecurityMetricService {
    private readonly ownFetcher?;
    private readonly env?;
    private readonly deadlineMs?;
    private grpcFetcher?;
    constructor(options?: SecurityMetricServiceOptions);
    /**
     * A service whose default gRPC fetcher resolves the PRICE address from
     * `env` instead of `process.env`.
     */
    static fromEnv(env: Env, options?: {
        deadlineMs?: number;
    }): SecurityMetricService;
    /** This instance's fetcher, else the installed one, else the default gRPC fetcher (built on first use). */
    private fetcher;
    /** Closes the default gRPC client, if one was built. */
    close(): void;
    /**
     * The latest value of `metric` on or before `on` (default today) for each
     * security, in one GetLatest call. Every requested UUID string is a key;
     * its value is undefined when the security has no point on or before `on`.
     * No call for an empty list.
     */
    get(metric: SecurityMetricInput, uuids: ReadonlyArray<SecurityIdInput>, on?: DateInput): Promise<Map<string, MetricResult | undefined>>;
    /** Every point of `metric` for one security from `from` to `to` (default today), both inclusive. */
    getHistory(metric: SecurityMetricInput, uuid: SecurityIdInput, from: DateInput, to?: DateInput): Promise<MetricSeries>;
    /**
     * Stores points of `metric` for one security. Points are checked first
     * (`InvalidMetricPoints`, nothing sent), then sent in chunks of
     * `RECORD_CHUNK_SIZE`, one CreateOrUpdate each. Returns the as_of the
     * service stamped on the last chunk. If a later chunk fails, the error
     * says how many points were already stored.
     */
    record(metric: SecurityMetricInput, uuid: SecurityIdInput, points: RecordPointsInput): Promise<ZonedDateTime>;
}
/**
 * Installs `fetcher` for every SecurityMetricService in the process (except
 * instances built with their own fetcher). `null` restores the default.
 */
declare function setSecurityMetricFetcher(fetcher: SecurityMetricFetcher | null): void;
/** The process-wide service that `Security.getMetric` and friends use, built on first use. */
declare function getSecurityMetricService(): SecurityMetricService;
/**
 * Replaces the process-wide service, e.g. with `SecurityMetricService.fromEnv(env)`
 * in a test. `null` clears it (the next `getSecurityMetricService()` builds a new one).
 */
declare function setSecurityMetricService(service: SecurityMetricService | null): void;
/** Test teardown: removes the installed fetcher and closes and clears the process-wide service. */
declare function resetSecurityMetricServiceForTests(): void;
export { SecurityMetricService, setSecurityMetricFetcher, getSecurityMetricService, setSecurityMetricService, resetSecurityMetricServiceForTests, };
