// LM-485: the pure SecurityMetric rules. The same fixture
// (test-fixtures/security-metric/cases.json) runs in Java, Python and Rust.
import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';
import { SecurityMetricPointProto, SecurityMetricSeriesProto } from '../../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { ObjectTypeProto } from '../../../fintekkers/models/util/object_type_pb';
import { GetLatestSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import { SearchSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { RequestOperationTypeProto } from '../../../fintekkers/requests/util/operation_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';
import { UUID } from '../utils/uuid';
import {
  InvalidMetricPoints,
  MetricResult,
  RECORD_CHUNK_SIZE,
  SecurityMetricInputError,
  SecurityMetricServiceError,
  UnknownMetric,
  buildCreate,
  buildGetLatest,
  buildSearch,
  checkMetric,
  chunkRecord,
  isoDate,
  mapLatest,
  mergeChunks,
  toLocalDate,
  validateRecord,
} from './security_metric';

const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/security-metric/cases.json');
const cases = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

type Pt = [string, string];
const SPY = '11111111-2222-3333-4444-555555555555';
const OTHER = '99999999-8888-7777-6666-555555555555';

function dateProto(iso: string): LocalDateProto {
  return toLocalDate(iso).toProto();
}

function series(uuid: string, metric: SecurityMetricTypeProto, points: Pt[], asOfSeconds?: number): SecurityMetricSeriesProto {
  const s = new SecurityMetricSeriesProto()
    .setSecurityId(new UUID(UUID.fromString(uuid)).toUUIDProto())
    .setMetric(metric)
    .setPointsList(points.map(([d, v]) => new SecurityMetricPointProto()
      .setObservationDate(dateProto(d))
      .setValue(encodeDecimal(parseDecimalString(v)))));
  if (asOfSeconds !== undefined) {
    s.setAsOf(new LocalTimestampProto().setTimestamp(new Timestamp().setSeconds(asOfSeconds)).setTimeZone('UTC'));
  }
  return s;
}

function chunk(points: Pt[], asOfSeconds?: number): SearchSecurityMetricResponseProto {
  return new SearchSecurityMetricResponseProto()
    .setSeries(series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, points, asOfSeconds));
}

function caught(fn: () => unknown): Error {
  try {
    fn();
  } catch (e) {
    return e as Error;
  }
  throw new Error('expected an error');
}

describe('security metric fixture (LM-485)', () => {
  const ran = { latest: 0, merge: 0, record: 0 };

  test.each(cases.latest as any[])('latest: $name', (c: any) => {
    const metric = SecurityMetricTypeProto.SHARES_OUTSTANDING;
    const response = new GetLatestSecurityMetricResponseProto();
    if (c.series !== null) response.addSeries(series(SPY, metric, c.series));
    const result = mapLatest(response, metric, [SPY], c.on);
    expect([...result.keys()]).toEqual([SPY]);
    const r = result.get(SPY);
    if (c.expected === null) {
      expect(r).toBeUndefined();
    } else {
      expect(r).toBeInstanceOf(MetricResult);
      expect(r!.value.equals(new Decimal(c.expected.value))).toBe(true);
      expect(r!.value.toFixed()).toBe(new Decimal(c.expected.value).toFixed());
      expect(isoDate(r!.date)).toBe(c.expected.date);
      expect(isoDate(r!.on)).toBe(c.on);
      expect(r!.ageDays).toBe(c.expected.ageDays);
    }
    ran.latest++;
  });

  test.each(cases.merge as any[])('merge: $name', (c: any) => {
    const chunks = c.chunks.map((points: Pt[]) => chunk(points));
    if (c.error !== undefined) {
      const e = caught(() => mergeChunks(chunks, SPY, SecurityMetricTypeProto.NAV_PER_SHARE));
      expect(e).toBeInstanceOf(SecurityMetricServiceError);
      expect(e.message).toContain(c.error);
    } else {
      const s = mergeChunks(chunks, SPY, SecurityMetricTypeProto.NAV_PER_SHARE);
      expect(s.points.map(p => [isoDate(p.date), p.value.toFixed()])).toEqual(
        c.expected.map(([d, v]: Pt) => [d, new Decimal(v).toFixed()]));
      expect(s.securityId.toString()).toBe(SPY);
      expect(s.metric).toBe(SecurityMetricTypeProto.NAV_PER_SHARE);
    }
    ran.merge++;
  });

  test.each(cases.record as any[])('record: $name', (c: any) => {
    const metric = checkMetric(c.metric);
    if (c.violations !== undefined) {
      const e = caught(() => validateRecord(metric, c.points));
      expect(e).toBeInstanceOf(InvalidMetricPoints);
      expect(e).toBeInstanceOf(SecurityMetricInputError);
      expect((e as InvalidMetricPoints).violations).toEqual(c.violations);
    } else {
      const chunks = chunkRecord(validateRecord(metric, c.points), c.chunkSize);
      expect(chunks.map(ch => ch.map(p => isoDate(p.date)))).toEqual(c.expectedChunks);
      const wire = chunks.flatMap(ch => buildCreate(metric, SPY, ch).getSeries()!.getPointsList());
      const decoded = wire.map(p => decodeDecimal(p.getValue()!));
      expect(decoded.map(toCanonicalString)).toEqual(c.expectedValues);
      if (metric === SecurityMetricTypeProto.SHARES_OUTSTANDING) {
        expect(decoded.every(d => d.scale === 0)).toBe(true);
      }
    }
    ran.record++;
  });

  // Declared last, so it runs after every case above: an empty section fails.
  test('ran at least one case in each section', () => {
    expect(ran.latest).toBeGreaterThanOrEqual(1);
    expect(ran.merge).toBeGreaterThanOrEqual(1);
    expect(ran.record).toBeGreaterThanOrEqual(1);
  });
});

describe('security metric core (LM-485)', () => {
  test('RECORD_CHUNK_SIZE is 5000', () => {
    expect(RECORD_CHUNK_SIZE).toBe(5000);
  });

  test('checkMetric accepts enum values and names, and names what it rejects', () => {
    expect(checkMetric(SecurityMetricTypeProto.NAV_PER_SHARE)).toBe(SecurityMetricTypeProto.NAV_PER_SHARE);
    expect(checkMetric('TOTAL_NET_ASSETS')).toBe(SecurityMetricTypeProto.TOTAL_NET_ASSETS);
    const unknown = caught(() => checkMetric(SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC));
    expect(unknown).toBeInstanceOf(UnknownMetric);
    expect(unknown.message).toBe('unknown security metric: UNKNOWN_SECURITY_METRIC');
    expect(caught(() => checkMetric('SHARE_COUNT')).message).toBe('unknown security metric: SHARE_COUNT');
    expect(caught(() => checkMetric('UNKNOWN_SECURITY_METRIC'))).toBeInstanceOf(UnknownMetric);
    expect(caught(() => checkMetric(42 as SecurityMetricTypeProto)).message).toBe('unknown security metric: 42');
  });

  test('buildGetLatest dedupes, keeps order and is stamped', () => {
    const req = buildGetLatest('SHARES_OUTSTANDING', [OTHER, SPY, OTHER.toUpperCase()], '2026-11-23');
    expect(req.getSecurityIdsList().map(u => UUID.fromUUIDProto(u)!.toString())).toEqual([OTHER, SPY]);
    expect(req.getMetricsList()).toEqual([SecurityMetricTypeProto.SHARES_OUTSTANDING]);
    expect(isoDate(toLocalDate('2026-11-23'))).toBe('2026-11-23');
    expect(req.getDate()!.toObject()).toEqual(dateProto('2026-11-23').toObject());
    expect(req.getObjectType()).toBe(ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST);
    expect(req.hasVersion()).toBe(true);
  });

  test('mapLatest matches by security_id and ignores other metrics and securities', () => {
    const response = new GetLatestSecurityMetricResponseProto().setSeriesList([
      series('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', SecurityMetricTypeProto.SHARES_OUTSTANDING, [['2026-11-20', '7']]),
      series(SPY, SecurityMetricTypeProto.NAV_PER_SHARE, [['2026-11-20', '512.34']]),
      series(OTHER, SecurityMetricTypeProto.SHARES_OUTSTANDING, [['2026-11-19', '1'], ['2026-11-20', '2']]),
    ]);
    const result = mapLatest(response, SecurityMetricTypeProto.SHARES_OUTSTANDING, [SPY, OTHER], '2026-11-23');
    expect([...result.keys()]).toEqual([SPY, OTHER]);
    expect(result.get(SPY)).toBeUndefined();
    expect(result.get(OTHER)!.value.toFixed()).toBe('2');
    expect(isoDate(result.get(OTHER)!.date)).toBe('2026-11-20');
  });

  test('buildSearch sets the range and rejects from after to', () => {
    const req = buildSearch(SecurityMetricTypeProto.NAV_PER_SHARE, SPY, '2026-11-01', '2026-11-20');
    expect(UUID.fromUUIDProto(req.getSecurityId())!.toString()).toBe(SPY);
    expect(req.getMetricsList()).toEqual([SecurityMetricTypeProto.NAV_PER_SHARE]);
    expect(req.getStartDate()!.toObject()).toEqual(dateProto('2026-11-01').toObject());
    expect(req.getEndDate()!.toObject()).toEqual(dateProto('2026-11-20').toObject());
    expect(req.getObjectType()).toBe(ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST);
    const e = caught(() => buildSearch(SecurityMetricTypeProto.NAV_PER_SHARE, SPY, '2026-11-20', '2026-11-19'));
    expect(e).toBeInstanceOf(SecurityMetricInputError);
    expect(e.message).toBe('from date 2026-11-20 is after to date 2026-11-19');
  });

  test('mergeChunks takes as_of from the first chunk that has one; latest and asDict', () => {
    const s = mergeChunks([chunk([['2026-11-16', '1']]), chunk([['2026-11-18', '2']], 1795392000), chunk([], 1)], SPY, 'NAV_PER_SHARE');
    expect(s.asOf!.getSeconds()).toBe(1795392000);
    expect(isoDate(s.latest!.date)).toBe('2026-11-18');
    expect([...s.asDict().entries()].map(([d, v]) => [d, v.toFixed()])).toEqual([['2026-11-16', '1'], ['2026-11-18', '2']]);
    const empty = mergeChunks([], SPY, 'NAV_PER_SHARE');
    expect(empty.asOf).toBeUndefined();
    expect(empty.latest).toBeUndefined();
    expect(empty.asDict().size).toBe(0);
  });

  test('validateRecord takes an object, numbers and Decimals; message names each bad point', () => {
    const points = validateRecord('NAV_PER_SHARE', { '2026-11-20': 512.34, '2026-11-19': new Decimal('511.25') });
    expect(points.map(p => [isoDate(p.date), p.value.toFixed()])).toEqual([['2026-11-19', '511.25'], ['2026-11-20', '512.34']]);
    const e = caught(() => validateRecord('SHARES_OUTSTANDING', [['2026-11-18', '1.5'], ['2026-11-19', 1], ['2026-11-19', 2]]));
    expect(e.message).toBe('invalid SHARES_OUTSTANDING points: 2026-11-18: fractional share count (1.5); 2026-11-19: duplicate date');
    const bad = caught(() => validateRecord('NAV_PER_SHARE', [['2026-11-18', 'abc']])) as InvalidMetricPoints;
    expect(bad.violations).toEqual([{ date: '2026-11-18', reason: 'not a decimal' }]);
    expect(caught(() => validateRecord('NAV_PER_SHARE', [['2026-13-01', '1']])).message).toContain("'2026-13-01'");
  });

  test('buildCreate is a stamped CREATE carrying a stamped series', () => {
    const req = buildCreate('SHARES_OUTSTANDING', SPY, validateRecord('SHARES_OUTSTANDING', [['2026-11-20', '15204137000']]));
    expect(req.getOperationType()).toBe(RequestOperationTypeProto.CREATE);
    expect(req.getObjectType()).toBe(ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_REQUEST);
    const s = req.getSeries()!;
    expect(s.getObjectType()).toBe(ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES);
    expect(UUID.fromUUIDProto(s.getSecurityId())!.toString()).toBe(SPY);
    expect(s.getMetric()).toBe(SecurityMetricTypeProto.SHARES_OUTSTANDING);
    expect(decodeDecimal(s.getPointsList()[0].getValue()!)).toEqual({ unscaled: BigInt('15204137000'), scale: 0 });
  });
});
