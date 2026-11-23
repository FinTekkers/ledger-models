/**
 * SecurityMetricService (LM-485): read and record security metrics (shares
 * outstanding, NAV per share, total net assets) through the SecurityMetric
 * gRPC service, which is served at the PRICE service address.
 *
 *   const service = getSecurityMetricService();
 *   const latest = await service.get('SHARES_OUTSTANDING', [spyUuid]);
 *
 * Every call goes through a `SecurityMetricFetcher`. The default one is a
 * gRPC client for `resolve(Service.PRICE)` (BROKER_HOST first, then
 * PRICE_SERVICE_HOST/_PORT, ...; plaintext for loopback, TLS otherwise) with
 * a per-call deadline. `setSecurityMetricFetcher` installs another fetcher
 * for every service instance in the process (tests, alternate transports).
 */
import * as grpc from '@grpc/grpc-js';

import { SecurityMetricClient } from '../../../fintekkers/services/security-metric-service/security_metric_service_grpc_pb';
import type {
  CreateSecurityMetricRequestProto,
  CreateSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import type {
  GetLatestSecurityMetricRequestProto,
  GetLatestSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import type {
  SearchSecurityMetricRequestProto,
  SearchSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';

import { LocalDate } from '../../models/utils/date';
import { ZonedDateTime } from '../../models/utils/datetime';
import {
  RECORD_CHUNK_SIZE,
  SecurityMetricServiceError,
  ServiceUnavailable,
  buildCreate,
  buildGetLatest,
  buildSearch,
  checkMetric,
  chunkRecord,
  mapLatest,
  mergeChunks,
  toLocalDate,
  toSecurityId,
  validateRecord,
  type DateInput,
  type MetricResult,
  type MetricSeries,
  type RecordPointsInput,
  type SecurityIdInput,
  type SecurityMetricInput,
} from '../../models/security/security_metric';
import { Service, resolve, target, type Endpoint, type Env } from '../../util/serviceaddress';

/** Default per-call deadline of the gRPC fetcher. */
export const DEFAULT_DEADLINE_MS = 30_000;

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
export class GrpcSecurityMetricFetcher implements SecurityMetricFetcher {
  readonly address: string;
  readonly deadlineMs: number;
  private readonly client: SecurityMetricClient;

  constructor(endpoint: Endpoint, options: GrpcFetcherOptions = {}) {
    this.address = target(endpoint);
    this.deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS;
    const credentials = endpoint.plaintext ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
    this.client = new SecurityMetricClient(this.address, credentials);
  }

  close(): void {
    this.client.close();
  }

  private callOptions(): Partial<grpc.CallOptions> {
    return { deadline: new Date(Date.now() + this.deadlineMs) };
  }

  /** The service error for a failed call to `rpc`. */
  toServiceError(rpc: string, err: unknown): SecurityMetricServiceError {
    const e = err as Partial<grpc.ServiceError>;
    const code = typeof e?.code === 'number' ? e.code : undefined;
    const codeName = code === undefined ? 'UNKNOWN' : (grpc.status[code] ?? String(code));
    const details = e?.details || (err instanceof Error ? err.message : String(err));
    if (code === grpc.status.UNAVAILABLE) {
      return new ServiceUnavailable(`SecurityMetric service unreachable at ${this.address} (${details})`,
        { address: this.address, code, codeName });
    }
    return new SecurityMetricServiceError(`SecurityMetric ${rpc} failed at ${this.address}: ${codeName} (${details})`,
      { address: this.address, code, codeName });
  }

  getLatest(request: GetLatestSecurityMetricRequestProto): Promise<GetLatestSecurityMetricResponseProto> {
    return new Promise((resolvePromise, reject) => {
      this.client.getLatest(request, new grpc.Metadata(), this.callOptions(), (err, response) => {
        if (err) reject(this.toServiceError('GetLatest', err));
        else resolvePromise(response);
      });
    });
  }

  search(request: SearchSecurityMetricRequestProto): Promise<SearchSecurityMetricResponseProto[]> {
    return new Promise((resolvePromise, reject) => {
      const chunks: SearchSecurityMetricResponseProto[] = [];
      const stream = this.client.search(request, this.callOptions());
      stream.on('data', (chunk: SearchSecurityMetricResponseProto) => chunks.push(chunk));
      stream.on('end', () => resolvePromise(chunks));
      stream.on('error', (err: unknown) => reject(this.toServiceError('Search', err)));
    });
  }

  createOrUpdate(request: CreateSecurityMetricRequestProto): Promise<CreateSecurityMetricResponseProto> {
    return new Promise((resolvePromise, reject) => {
      this.client.createOrUpdate(request, new grpc.Metadata(), this.callOptions(), (err, response) => {
        if (err) reject(this.toServiceError('CreateOrUpdate', err));
        else resolvePromise(response);
      });
    });
  }
}

export interface SecurityMetricServiceOptions {
  /** Fetcher for this instance only. Default: gRPC to `resolve(Service.PRICE, env)`. */
  fetcher?: SecurityMetricFetcher;
  /** Environment the default address is resolved from (default `process.env`). */
  env?: Env;
  /** Per-call deadline of the default gRPC fetcher in milliseconds (default 30000). */
  deadlineMs?: number;
}

let installedFetcher: SecurityMetricFetcher | null = null;
let defaultService: SecurityMetricService | null = null;

class SecurityMetricService {
  private readonly ownFetcher?: SecurityMetricFetcher;
  private readonly env?: Env;
  private readonly deadlineMs?: number;
  private grpcFetcher?: GrpcSecurityMetricFetcher;

  constructor(options: SecurityMetricServiceOptions = {}) {
    this.ownFetcher = options.fetcher;
    this.env = options.env;
    this.deadlineMs = options.deadlineMs;
  }

  /**
   * A service whose default gRPC fetcher resolves the PRICE address from
   * `env` instead of `process.env`.
   */
  static fromEnv(env: Env, options: { deadlineMs?: number } = {}): SecurityMetricService {
    return new SecurityMetricService({ env, deadlineMs: options.deadlineMs });
  }

  /** This instance's fetcher, else the installed one, else the default gRPC fetcher (built on first use). */
  private fetcher(): SecurityMetricFetcher {
    if (this.ownFetcher) return this.ownFetcher;
    if (installedFetcher) return installedFetcher;
    if (!this.grpcFetcher) {
      this.grpcFetcher = new GrpcSecurityMetricFetcher(
        resolve(Service.PRICE, this.env ?? process.env), { deadlineMs: this.deadlineMs });
    }
    return this.grpcFetcher;
  }

  /** Closes the default gRPC client, if one was built. */
  close(): void {
    this.grpcFetcher?.close();
    this.grpcFetcher = undefined;
  }

  /**
   * The latest value of `metric` on or before `on` (default today) for each
   * security, in one GetLatest call. Every requested UUID string is a key;
   * its value is undefined when the security has no point on or before `on`.
   * No call for an empty list.
   */
  async get(
    metric: SecurityMetricInput,
    uuids: ReadonlyArray<SecurityIdInput>,
    on?: DateInput,
  ): Promise<Map<string, MetricResult | undefined>> {
    const m = checkMetric(metric);
    const onDate = on === undefined ? LocalDate.today() : toLocalDate(on);
    const ids = uuids.map(toSecurityId);
    if (ids.length === 0) return new Map();
    const response = await this.fetcher().getLatest(buildGetLatest(m, ids, onDate));
    return mapLatest(response, m, ids, onDate);
  }

  /** Every point of `metric` for one security from `from` to `to` (default today), both inclusive. */
  async getHistory(
    metric: SecurityMetricInput,
    uuid: SecurityIdInput,
    from: DateInput,
    to?: DateInput,
  ): Promise<MetricSeries> {
    const m = checkMetric(metric);
    const securityId = toSecurityId(uuid);
    const request = buildSearch(m, securityId, from, to === undefined ? LocalDate.today() : to);
    const chunks = await this.fetcher().search(request);
    return mergeChunks(chunks, securityId, m);
  }

  /**
   * Stores points of `metric` for one security. Points are checked first
   * (`InvalidMetricPoints`, nothing sent), then sent in chunks of
   * `RECORD_CHUNK_SIZE`, one CreateOrUpdate each. Returns the as_of the
   * service stamped on the last chunk. If a later chunk fails, the error
   * says how many points were already stored.
   */
  async record(metric: SecurityMetricInput, uuid: SecurityIdInput, points: RecordPointsInput): Promise<ZonedDateTime> {
    const m = checkMetric(metric);
    const securityId = toSecurityId(uuid);
    const chunks = chunkRecord(validateRecord(m, points), RECORD_CHUNK_SIZE);
    const fetcher = this.fetcher();
    let stored = 0;
    let response: CreateSecurityMetricResponseProto | undefined;
    for (const chunk of chunks) {
      try {
        response = await fetcher.createOrUpdate(buildCreate(m, securityId, chunk));
      } catch (e) {
        if (stored === 0) throw e;
        throw alreadyStored(e, stored);
      }
      stored += chunk.length;
    }
    const asOf = response?.getSeries()?.getAsOf();
    if (!asOf) throw new SecurityMetricServiceError('SecurityMetric CreateOrUpdate response has no series.as_of');
    return new ZonedDateTime(asOf);
  }
}

/** `e` with "N points already stored" added, keeping its class. */
function alreadyStored(e: unknown, stored: number): Error {
  const suffix = `; ${stored} points already stored`;
  if (e instanceof SecurityMetricServiceError) {
    const details = { address: e.address, code: e.code, codeName: e.codeName };
    return e instanceof ServiceUnavailable
      ? new ServiceUnavailable(e.message + suffix, details)
      : new SecurityMetricServiceError(e.message + suffix, details);
  }
  const message = e instanceof Error ? e.message : String(e);
  return new SecurityMetricServiceError(`SecurityMetric CreateOrUpdate failed: ${message}${suffix}`);
}

/**
 * Installs `fetcher` for every SecurityMetricService in the process (except
 * instances built with their own fetcher). `null` restores the default.
 */
function setSecurityMetricFetcher(fetcher: SecurityMetricFetcher | null): void {
  installedFetcher = fetcher;
}

/** The process-wide service that `Security.getMetric` and friends use, built on first use. */
function getSecurityMetricService(): SecurityMetricService {
  if (!defaultService) defaultService = new SecurityMetricService();
  return defaultService;
}

/**
 * Replaces the process-wide service, e.g. with `SecurityMetricService.fromEnv(env)`
 * in a test. `null` clears it (the next `getSecurityMetricService()` builds a new one).
 */
function setSecurityMetricService(service: SecurityMetricService | null): void {
  defaultService = service;
}

/** Test teardown: removes the installed fetcher and closes and clears the process-wide service. */
function resetSecurityMetricServiceForTests(): void {
  installedFetcher = null;
  defaultService?.close();
  defaultService = null;
}

export {
  SecurityMetricService,
  setSecurityMetricFetcher,
  getSecurityMetricService,
  setSecurityMetricService,
  resetSecurityMetricServiceForTests,
};
