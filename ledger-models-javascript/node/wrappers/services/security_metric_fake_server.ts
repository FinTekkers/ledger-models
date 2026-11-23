/**
 * Test helper, not part of the library API (LM-485): an in-memory
 * SecurityMetric gRPC server on 127.0.0.1 for the SecurityMetricService
 * tests. It counts calls per RPC and keeps every request.
 *
 * - GetLatest: walks the requested securities in reverse order; omits a
 *   security with no data for any metric; else returns its latest point on
 *   or before `date` (a zero-point series when there is none).
 * - Search: streams the range in messages of 2 points; one zero-point
 *   message when there are none.
 * - CreateOrUpdate: stores the points and returns the series header with a
 *   distinct as_of per call (2026-11-23T21:00:00Z plus the call count in seconds).
 */
import * as grpc from '@grpc/grpc-js';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import { SecurityMetricService as SecurityMetricServiceDefinition } from '../../fintekkers/services/security-metric-service/security_metric_service_grpc_pb';
import { SecurityMetricPointProto, SecurityMetricSeriesProto } from '../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../fintekkers/models/security/security_metric_type_pb';
import { LocalDateProto } from '../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import type { UUIDProto } from '../../fintekkers/models/util/uuid_pb';
import {
  type CreateSecurityMetricRequestProto,
  CreateSecurityMetricResponseProto,
} from '../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import {
  type GetLatestSecurityMetricRequestProto,
  GetLatestSecurityMetricResponseProto,
} from '../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import {
  type SearchSecurityMetricRequestProto,
  SearchSecurityMetricResponseProto,
} from '../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { stampOwn } from '../util/object-types';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../models/utils/decimal';
import { UUID } from '../models/utils/uuid';

/** The seeded SPY security: SHARES_OUTSTANDING 2026-11-19 → 15204137000, 2026-11-20 → 15210000000. */
export const SPY_UUID = '5f0c2a1e-7b3d-4c8e-9a10-2b3c4d5e6f70';

const AS_OF_BASE_SECONDS = Date.UTC(2026, 10, 23, 21, 0, 0) / 1000;

function iso(d: LocalDateProto | undefined): string {
  if (!d) return '';
  return `${String(d.getYear()).padStart(4, '0')}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDay()).padStart(2, '0')}`;
}

function dateProto(isoDate: string): LocalDateProto {
  const [y, m, d] = isoDate.split('-').map(s => parseInt(s, 10));
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

function uuidKey(p: UUIDProto | undefined): string {
  const u = UUID.fromUUIDProto(p);
  return u ? u.toString() : '';
}

function timestamp(seconds: number): LocalTimestampProto {
  return new LocalTimestampProto().setTimestamp(new Timestamp().setSeconds(seconds).setNanos(0)).setTimeZone('UTC');
}

export class FakeSecurityMetricServer {
  readonly port: number;
  readonly calls = { getLatest: 0, search: 0, createOrUpdate: 0 };
  readonly getLatestRequests: GetLatestSecurityMetricRequestProto[] = [];
  readonly searchRequests: SearchSecurityMetricRequestProto[] = [];
  readonly createRequests: CreateSecurityMetricRequestProto[] = [];
  /** `${uuid}|${metric}` → ISO date → canonical decimal string. */
  private readonly store = new Map<string, Map<string, string>>();
  private readonly server: grpc.Server;

  private constructor(server: grpc.Server, port: number) {
    this.server = server;
    this.port = port;
  }

  /** Starts a server on 127.0.0.1 with a free port, seeded with SPY. */
  static async start(): Promise<FakeSecurityMetricServer> {
    const server = new grpc.Server();
    const port = await new Promise<number>((resolve, reject) => {
      server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, p) => (err ? reject(err) : resolve(p)));
    });
    const fake = new FakeSecurityMetricServer(server, port);
    server.addService(SecurityMetricServiceDefinition, {
      getLatest: fake.getLatest.bind(fake),
      search: fake.search.bind(fake),
      createOrUpdate: fake.createOrUpdate.bind(fake),
    });
    // grpc-js 1.8 (this package's lockfile) serves only after start().
    server.start();
    fake.seed(SPY_UUID, SecurityMetricTypeProto.SHARES_OUTSTANDING, [
      ['2026-11-19', '15204137000'],
      ['2026-11-20', '15210000000'],
    ]);
    return fake;
  }

  /** `host:port` of the server. */
  get address(): string {
    return `127.0.0.1:${this.port}`;
  }

  /** Adds points for (uuid, metric). */
  seed(uuid: string, metric: SecurityMetricTypeProto, points: Array<[string, string]>): void {
    const key = `${uuid}|${metric}`;
    const series = this.store.get(key) ?? new Map<string, string>();
    for (const [date, value] of points) series.set(date, value);
    this.store.set(key, series);
  }

  /** Stops the server and drops open calls. */
  stop(): Promise<void> {
    return new Promise(resolve => {
      this.server.tryShutdown(() => resolve());
      this.server.forceShutdown();
    });
  }

  private knows(uuid: string): boolean {
    for (const key of this.store.keys()) if (key.startsWith(`${uuid}|`)) return true;
    return false;
  }

  private sorted(uuid: string, metric: SecurityMetricTypeProto): Array<[string, string]> {
    const series = this.store.get(`${uuid}|${metric}`);
    return series ? [...series.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)) : [];
  }

  private series(uuid: UUIDProto | undefined, metric: SecurityMetricTypeProto, points: Array<[string, string]>, asOf: number): SecurityMetricSeriesProto {
    return stampOwn(new SecurityMetricSeriesProto())
      .setSecurityId(uuid)
      .setMetric(metric)
      .setAsOf(timestamp(asOf))
      .setPointsList(points.map(([d, v]) => new SecurityMetricPointProto()
        .setObservationDate(dateProto(d))
        .setValue(encodeDecimal(parseDecimalString(v)))));
  }

  private getLatest(
    call: grpc.ServerUnaryCall<GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto>,
    callback: grpc.sendUnaryData<GetLatestSecurityMetricResponseProto>,
  ): void {
    this.calls.getLatest++;
    const request = call.request;
    this.getLatestRequests.push(request);
    const on = iso(request.getDate());
    const response = stampOwn(new GetLatestSecurityMetricResponseProto());
    for (const id of [...request.getSecurityIdsList()].reverse()) {
      const uuid = uuidKey(id);
      if (!this.knows(uuid)) continue;
      for (const metric of request.getMetricsList()) {
        const onOrBefore = this.sorted(uuid, metric).filter(([d]) => d <= on);
        response.addSeries(this.series(id, metric, onOrBefore.slice(-1), AS_OF_BASE_SECONDS));
      }
    }
    callback(null, response);
  }

  private search(call: grpc.ServerWritableStream<SearchSecurityMetricRequestProto, SearchSecurityMetricResponseProto>): void {
    this.calls.search++;
    const request = call.request;
    this.searchRequests.push(request);
    const from = iso(request.getStartDate());
    const to = iso(request.getEndDate());
    const uuid = uuidKey(request.getSecurityId());
    const metric = request.getMetricsList()[0];
    const points = this.sorted(uuid, metric).filter(([d]) => d >= from && d <= to);
    const send = (chunk: Array<[string, string]>) => call.write(stampOwn(new SearchSecurityMetricResponseProto())
      .setSeries(this.series(request.getSecurityId(), metric, chunk, AS_OF_BASE_SECONDS)));
    if (points.length === 0) send([]);
    for (let i = 0; i < points.length; i += 2) send(points.slice(i, i + 2));
    call.end();
  }

  private createOrUpdate(
    call: grpc.ServerUnaryCall<CreateSecurityMetricRequestProto, CreateSecurityMetricResponseProto>,
    callback: grpc.sendUnaryData<CreateSecurityMetricResponseProto>,
  ): void {
    this.calls.createOrUpdate++;
    const request = call.request;
    this.createRequests.push(request);
    const series = request.getSeries();
    if (!series) {
      callback({ code: grpc.status.INVALID_ARGUMENT, details: 'series is required' }, null);
      return;
    }
    this.seed(uuidKey(series.getSecurityId()), series.getMetric(), series.getPointsList().map(p =>
      [iso(p.getObservationDate()), toCanonicalString(decodeDecimal(p.getValue()!))] as [string, string]));
    callback(null, stampOwn(new CreateSecurityMetricResponseProto())
      .setOperationType(request.getOperationType())
      .setSeries(this.series(series.getSecurityId(), series.getMetric(), [], AS_OF_BASE_SECONDS + this.calls.createOrUpdate)));
  }
}
