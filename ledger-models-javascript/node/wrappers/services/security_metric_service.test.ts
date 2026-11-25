/**
 * LM-485: SecurityMetricService and Security.getMetric against an in-memory
 * SecurityMetric gRPC server on 127.0.0.1 (security_metric_fake_server.ts),
 * through the default gRPC fetcher built from an injected environment.
 *
 * Lives directly under services/: jest.config.js skips tests in
 * services/<name>/ folders (they need live services).
 */
import * as grpc from '@grpc/grpc-js';
import * as net from 'net';
import { Decimal } from 'decimal.js';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { SecurityMetricTypeProto } from '../../fintekkers/models/security/security_metric_type_pb';
import type { LocalDateProto } from '../../fintekkers/models/util/local_date_pb';
import type { CreateSecurityMetricResponseProto } from '../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import { GetLatestSecurityMetricResponseProto } from '../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import Security from '../models/security/security';
import {
  InvalidMetricPoints,
  MetricResult,
  MissingSecurityId,
  RECORD_CHUNK_SIZE,
  SecurityMetricServiceError,
  ServiceUnavailable,
  UnknownMetric,
  buildSearch,
  isoDate,
} from '../models/security/security_metric';
import { decodeDecimal } from '../models/utils/decimal';
import { UUID } from '../models/utils/uuid';
import { daysBetween } from '../models/utils/date';
import { Service, resolve } from '../util/serviceaddress';
import {
  GrpcSecurityMetricFetcher,
  SecurityMetricService,
  getSecurityMetricService,
  resetSecurityMetricServiceForTests,
  setSecurityMetricFetcher,
  setSecurityMetricService,
  type SecurityMetricFetcher,
} from './security-metric-service/SecurityMetricService';
import { FakeSecurityMetricServer, SPY_UUID } from './security_metric_fake_server';

const SHARES = SecurityMetricTypeProto.SHARES_OUTSTANDING;
const NAV = SecurityMetricTypeProto.NAV_PER_SHARE;

let fake: FakeSecurityMetricServer;

function env(port: number): Record<string, string> {
  return { PRICE_SERVICE_HOST: '127.0.0.1', PRICE_SERVICE_PORT: String(port) };
}

function securityOf(uuid: string): Security {
  // A link: getMetric must use the UUID only, never hydrate.
  return new Security(Security.linkOfLatest(new UUID(UUID.fromString(uuid))));
}

function iso(d: LocalDateProto | undefined): string {
  return `${d!.getYear()}-${String(d!.getMonth()).padStart(2, '0')}-${String(d!.getDay()).padStart(2, '0')}`;
}

function uuidOf(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

async function rejection(p: Promise<unknown>): Promise<Error> {
  try {
    await p;
  } catch (e) {
    return e as Error;
  }
  throw new Error('expected a rejection');
}

beforeAll(async () => {
  fake = await FakeSecurityMetricServer.start();
});

afterAll(async () => {
  await fake.stop();
});

beforeEach(() => {
  setSecurityMetricService(SecurityMetricService.fromEnv(env(fake.port)));
});

afterEach(() => {
  resetSecurityMetricServiceForTests();
});

describe('SecurityMetricService through the default gRPC fetcher (LM-485)', () => {
  test('getMetric and sharesOutstanding: Monday asks, Friday answers, 3 days old, one call each', async () => {
    const spy = securityOf(SPY_UUID);
    const before = fake.calls.getLatest;
    const viaMetric = await spy.getMetric(SHARES, '2026-11-23');
    expect(fake.calls.getLatest).toBe(before + 1);
    const viaShortcut = await spy.sharesOutstanding('2026-11-23');
    expect(fake.calls.getLatest).toBe(before + 2);

    for (const r of [viaMetric, viaShortcut]) {
      expect(r).toBeInstanceOf(MetricResult);
      expect(r!.value.equals(new Decimal('15210000000'))).toBe(true);
      expect(isoDate(r!.date)).toBe('2026-11-20');
      expect(isoDate(r!.on)).toBe('2026-11-23');
      expect(r!.ageDays).toBe(3);
    }
    expect(viaMetric!.value.equals(viaShortcut!.value)).toBe(true);
    expect(spy.isLink()).toBe(true);
    // The name string works as well as the enum value.
    expect((await spy.getMetric('SHARES_OUTSTANDING', '2026-11-23'))!.value.toFixed()).toBe('15210000000');
  });

  test('generic getMetric returns the EXPENSE_RATIO in force between two changes, by enum and by name (LM-491)', async () => {
    const uuid = uuidOf(8);
    fake.seed(uuid, SecurityMetricTypeProto.EXPENSE_RATIO, [['2018-01-01', '0.0945'], ['2026-07-01', '0.0900']]);
    const fund = securityOf(uuid);

    const byEnum = await fund.getMetric(SecurityMetricTypeProto.EXPENSE_RATIO, '2026-03-31');
    expect(fake.getLatestRequests[fake.getLatestRequests.length - 1].getMetricsList())
      .toEqual([SecurityMetricTypeProto.EXPENSE_RATIO]);
    const byName = await fund.getMetric('EXPENSE_RATIO', '2026-03-31');

    for (const r of [byEnum, byName]) {
      expect(r).toBeInstanceOf(MetricResult);
      expect(r!.value.equals(new Decimal('0.0945'))).toBe(true);
      expect(r!.value.toFixed()).toBe('0.0945');
      expect(isoDate(r!.date)).toBe('2018-01-01');
      expect(isoDate(r!.on)).toBe('2026-03-31');
    }
  });

  test('omitted on: the date sent is the result date, and ageDays counts from it', async () => {
    const uuid = uuidOf(1);
    fake.seed(uuid, NAV, [['2000-01-03', '100.25']]);
    const result = await securityOf(uuid).navPerShare();
    const sent = fake.getLatestRequests[fake.getLatestRequests.length - 1].getDate();
    expect(result).toBeInstanceOf(MetricResult);
    expect(isoDate(result!.on)).toBe(iso(sent));
    const sentDate = new Date(sent!.getYear(), sent!.getMonth() - 1, sent!.getDay());
    expect(result!.ageDays).toBe(daysBetween(new Date(2000, 0, 3), sentDate));
    expect(isoDate(result!.date)).toBe('2000-01-03');
  });

  test('history: 5 points with a gap arrive in 3 messages and merge ascending', async () => {
    const uuid = uuidOf(2);
    const points: Array<[string, string]> = [
      ['2026-11-16', '510.1'], ['2026-11-17', '511.25'], ['2026-11-18', '512.34'],
      ['2026-11-20', '513'], ['2026-11-23', '514.5'],
    ];
    fake.seed(uuid, NAV, [...points].reverse());

    // The fake really sends 2 + 2 + 1.
    const direct = new GrpcSecurityMetricFetcher(resolve(Service.PRICE, env(fake.port)), { deadlineMs: 5000 });
    const chunks = await direct.search(buildSearch(NAV, uuid, '2026-11-16', '2026-11-23'));
    direct.close();
    expect(chunks.map(c => c.getSeries()!.getPointsList().length)).toEqual([2, 2, 1]);

    const before = fake.calls.search;
    const series = await securityOf(uuid).navPerShareHistory('2026-11-16', '2026-11-23');
    expect(fake.calls.search).toBe(before + 1);
    expect(series.securityId.toString()).toBe(uuid);
    expect(series.metric).toBe(NAV);
    expect(series.asOf).toBeDefined();
    expect(series.points.map(p => [isoDate(p.date), p.value.toFixed()])).toEqual(points);
    expect(isoDate(series.latest!.date)).toBe('2026-11-23');
    expect(series.latest!.value.toFixed()).toBe('514.5');
    expect([...series.asDict().entries()].map(([d, v]) => [d, v.toFixed()])).toEqual(points);

    const viaGeneric = await securityOf(uuid).getMetricHistory('NAV_PER_SHARE', '2026-11-17', '2026-11-18');
    expect(viaGeneric.points.map(p => isoDate(p.date))).toEqual(['2026-11-17', '2026-11-18']);
  });

  test('batch get: replies in reverse order, unknown omitted, one call, each value on its own UUID', async () => {
    const other = uuidOf(3);
    const unknown = uuidOf(4);
    fake.seed(other, SHARES, [['2026-11-18', '42']]);
    const before = fake.calls.getLatest;
    const result = await getSecurityMetricService().get(SHARES, [SPY_UUID, other, unknown], '2026-11-23');
    expect(fake.calls.getLatest).toBe(before + 1);
    expect([...result.keys()]).toEqual([SPY_UUID, other, unknown]);
    expect(result.get(SPY_UUID)!.value.toFixed()).toBe('15210000000');
    expect(result.get(other)!.value.toFixed()).toBe('42');
    expect(isoDate(result.get(other)!.date)).toBe('2026-11-18');
    expect(result.has(unknown)).toBe(true);
    expect(result.get(unknown)).toBeUndefined();
  });

  test('get with no UUIDs makes no call', async () => {
    const before = fake.calls.getLatest;
    expect((await getSecurityMetricService().get(SHARES, [], '2026-11-23')).size).toBe(0);
    expect(fake.calls.getLatest).toBe(before);
  });

  test('record: exact scale-0 share count, dates as given, and 5001 points in 2 requests', async () => {
    const uuid = uuidOf(5);
    const service = getSecurityMetricService();
    const before = fake.calls.createOrUpdate;
    const asOf = await service.record(SHARES, uuid, { '2026-11-20': '15204137000' });
    expect(fake.calls.createOrUpdate).toBe(before + 1);
    const one = fake.createRequests[fake.createRequests.length - 1].getSeries()!;
    expect(UUID.fromUUIDProto(one.getSecurityId())!.toString()).toBe(uuid);
    expect(one.getMetric()).toBe(SHARES);
    expect(one.getPointsList()).toHaveLength(1);
    expect(iso(one.getPointsList()[0].getObservationDate())).toBe('2026-11-20');
    expect(decodeDecimal(one.getPointsList()[0].getValue()!)).toEqual({ unscaled: BigInt('15204137000'), scale: 0 });
    expect(asOf.getSeconds()).toBe(Date.UTC(2026, 10, 23, 21) / 1000 + fake.calls.createOrUpdate);

    const many: Array<[string, number]> = [];
    for (let i = RECORD_CHUNK_SIZE; i >= 0; i--) {
      many.push([new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10), 1000 + i]);
    }
    const start = fake.createRequests.length;
    const lastAsOf = await service.record('TOTAL_NET_ASSETS', uuid, many);
    const requests = fake.createRequests.slice(start);
    expect(requests).toHaveLength(2);
    const sentDates: string[] = [];
    for (const r of requests) {
      const s = r.getSeries()!;
      expect(UUID.fromUUIDProto(s.getSecurityId())!.toString()).toBe(uuid);
      expect(s.getMetric()).toBe(SecurityMetricTypeProto.TOTAL_NET_ASSETS);
      sentDates.push(...s.getPointsList().map(p => iso(p.getObservationDate())));
    }
    expect(requests.map(r => r.getSeries()!.getPointsList().length)).toEqual([RECORD_CHUNK_SIZE, 1]);
    expect(sentDates).toEqual(many.map(([d]) => d).sort());
    expect(lastAsOf.getSeconds()).toBe(Date.UTC(2026, 10, 23, 21) / 1000 + fake.calls.createOrUpdate);
    expect(lastAsOf.getSeconds()).toBe(asOf.getSeconds() + 2);
  });

  test('fractional shares and duplicate dates: InvalidMetricPoints, nothing sent', async () => {
    const before = fake.calls.createOrUpdate;
    const service = getSecurityMetricService();
    const fractional = await rejection(service.record(SHARES, SPY_UUID, { '2026-11-20': '1.5' }));
    expect(fractional).toBeInstanceOf(InvalidMetricPoints);
    expect((fractional as InvalidMetricPoints).violations).toEqual([{ date: '2026-11-20', reason: 'fractional share count' }]);
    const duplicate = await rejection(service.record(NAV, SPY_UUID, [['2026-11-20', '1'], ['2026-11-20', '2']]));
    expect(duplicate).toBeInstanceOf(InvalidMetricPoints);
    expect((duplicate as InvalidMetricPoints).violations).toEqual([{ date: '2026-11-20', reason: 'duplicate date' }]);
    expect(fake.calls.createOrUpdate).toBe(before);
  });

  test('unreachable service: getMetric raises ServiceUnavailable naming 127.0.0.1:<port>', async () => {
    const port = await new Promise<number>((done, fail) => {
      const socket = net.createServer();
      socket.once('error', fail);
      socket.listen(0, '127.0.0.1', () => {
        const p = (socket.address() as net.AddressInfo).port;
        socket.close(() => done(p));
      });
    });
    setSecurityMetricService(SecurityMetricService.fromEnv(env(port), { deadlineMs: 5000 }));
    const e = await rejection(securityOf(SPY_UUID).getMetric(SHARES, '2026-11-23'));
    expect(e).toBeInstanceOf(ServiceUnavailable);
    expect(e).toBeInstanceOf(SecurityMetricServiceError);
    expect(e.message).toContain(`127.0.0.1:${port}`);
    expect(e.message).toContain('unreachable');
  }, 15000);

  test('absent through the real stack is undefined, never 0', async () => {
    const uuid = uuidOf(6);
    fake.seed(uuid, SHARES, [['2026-11-20', '5']]);
    const early = securityOf(uuid);
    for (const r of [await early.getMetric(SHARES, '2026-11-19'), await early.sharesOutstanding('2026-11-19')]) {
      expect(r).toBeUndefined();
      expect(r).not.toBe(0);
      expect(r).not.toBeInstanceOf(MetricResult);
    }
    const unknown = securityOf(uuidOf(7));
    expect(await unknown.getMetric(SHARES, '2026-11-23')).toBeUndefined();
    expect(await unknown.totalNetAssets('2026-11-23')).toBeUndefined();
  });

  test('no UUID and unknown metrics raise errors naming the problem, before any call', async () => {
    const before = { ...fake.calls };
    const noId = await rejection(new Security(new SecurityProto()).getMetric(SHARES));
    expect(noId).toBeInstanceOf(MissingSecurityId);
    expect(noId.message).toBe('security has no UUID: cannot fetch its metrics');
    expect(await rejection(new Security(new SecurityProto()).navPerShareHistory('2026-11-01'))).toBeInstanceOf(MissingSecurityId);

    const spy = securityOf(SPY_UUID);
    const unknownEnum = await rejection(spy.getMetric(SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC));
    expect(unknownEnum).toBeInstanceOf(UnknownMetric);
    expect(unknownEnum.message).toBe('unknown security metric: UNKNOWN_SECURITY_METRIC');
    const unknownName = await rejection(spy.getMetric('SHARE_COUNT'));
    expect(unknownName).toBeInstanceOf(UnknownMetric);
    expect(unknownName.message).toBe('unknown security metric: SHARE_COUNT');
    expect(await rejection(spy.getMetricHistory('SHARE_COUNT', '2026-11-01'))).toBeInstanceOf(UnknownMetric);
    expect(await rejection(getSecurityMetricService().record('SHARE_COUNT', SPY_UUID, { '2026-11-20': 1 }))).toBeInstanceOf(UnknownMetric);
    expect(fake.calls).toEqual(before);
  });

  test('a gRPC error other than UNAVAILABLE names the RPC, host:port and status', () => {
    const fetcher = new GrpcSecurityMetricFetcher(resolve(Service.PRICE, env(8083)));
    const e = fetcher.toServiceError('GetLatest', { code: grpc.status.NOT_FOUND, details: 'no such series' });
    fetcher.close();
    expect(e).toBeInstanceOf(SecurityMetricServiceError);
    expect(e).not.toBeInstanceOf(ServiceUnavailable);
    expect(e.message).toBe('SecurityMetric GetLatest failed at 127.0.0.1:8083: NOT_FOUND (no such series)');
  });
});

describe('installed fetcher (LM-485)', () => {
  function fetcher(overrides: Partial<SecurityMetricFetcher>): SecurityMetricFetcher {
    return {
      getLatest: async () => new GetLatestSecurityMetricResponseProto(),
      search: async () => [],
      createOrUpdate: async () => { throw new Error('not expected'); },
      ...overrides,
    };
  }

  test('setSecurityMetricFetcher replaces the gRPC fetcher; null restores it', async () => {
    let calls = 0;
    setSecurityMetricFetcher(fetcher({ getLatest: async () => { calls++; return new GetLatestSecurityMetricResponseProto(); } }));
    expect(await securityOf(SPY_UUID).getMetric(SHARES, '2026-11-23')).toBeUndefined();
    expect(calls).toBe(1);
    setSecurityMetricFetcher(null);
    expect((await securityOf(SPY_UUID).getMetric(SHARES, '2026-11-23'))!.value.toFixed()).toBe('15210000000');
    expect(calls).toBe(1);
  });

  test('a later chunk failing says how many points were already stored', async () => {
    let calls = 0;
    const real = fake;
    setSecurityMetricFetcher(fetcher({
      createOrUpdate: async () => {
        calls++;
        if (calls === 2) {
          throw new ServiceUnavailable(`SecurityMetric service unreachable at ${real.address} (gone)`, { address: real.address });
        }
        return {} as CreateSecurityMetricResponseProto;
      },
    }));
    const points: Array<[string, string]> = [];
    for (let i = 0; i <= RECORD_CHUNK_SIZE; i++) points.push([new Date(Date.UTC(2001, 0, 1 + i)).toISOString().slice(0, 10), '1']);
    const e = await rejection(getSecurityMetricService().record(NAV, SPY_UUID, points));
    expect(e).toBeInstanceOf(ServiceUnavailable);
    expect(e.message).toContain(real.address);
    expect(e.message).toContain(`${RECORD_CHUNK_SIZE} points already stored`);
  });
});
