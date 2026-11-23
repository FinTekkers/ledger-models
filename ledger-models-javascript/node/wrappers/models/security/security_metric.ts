/**
 * Security metrics (LM-485): the pure rules behind `SecurityMetricService`
 * and `Security.getMetric`. No I/O here: request builders, response mapping,
 * record validation and chunking, checked in every language against
 * test-fixtures/security-metric/cases.json.
 *
 * A metric is a dated series per security (shares outstanding, NAV per share,
 * total net assets). Absent is never 0: a security with no point on or before
 * the date asked for has no result (`undefined`), while a stored 0 is a real 0.
 */
import { Decimal } from 'decimal.js';
import { SecurityMetricPointProto, SecurityMetricSeriesProto } from '../../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { CreateSecurityMetricRequestProto } from '../../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import {
  GetLatestSecurityMetricRequestProto,
  type GetLatestSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import {
  SearchSecurityMetricRequestProto,
  type SearchSecurityMetricResponseProto,
} from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { RequestOperationTypeProto } from '../../../fintekkers/requests/util/operation_pb';
import { stampOwn } from '../../util/object-types';
import { ModelValidationError } from '../errors';
import { LocalDate, daysBetween } from '../utils/date';
import { ZonedDateTime } from '../utils/datetime';
import { decodeDecimal, encodeDecimal, fromDecimalJs, parseDecimalString, toDecimalJs, withField } from '../utils/decimal';
import { UUID } from '../utils/uuid';

/** Most points sent in one CreateOrUpdate request; `record` splits larger inputs. */
export const RECORD_CHUNK_SIZE = 5000;

/** A metric: the generated enum value, or its name such as `'SHARES_OUTSTANDING'`. */
export type SecurityMetricInput = SecurityMetricTypeProto | string;

/** A calendar date: a `LocalDate`, a `Date` (its local date parts) or an ISO `yyyy-mm-dd` string. */
export type DateInput = LocalDate | Date | string;

/** A security id: a `UUID` or its string form. */
export type SecurityIdInput = UUID | string;

/** A value to record: a decimal.js `Decimal`, a decimal string, or a number (read via its string form). */
export type MetricValueInput = Decimal | string | number;

/**
 * Points to record: an object keyed by ISO date, or a list of (date, value)
 * pairs. A list may repeat a date, which is rejected as `duplicate date`.
 */
export type RecordPointsInput =
  | Record<string, MetricValueInput | null | undefined>
  | ReadonlyArray<readonly [DateInput, MetricValueInput | null | undefined]>;

/** One rejected point: its ISO date (null for the whole input) and the reason. */
export interface MetricPointViolation {
  date: string | null;
  reason: string;
}

// ---------------------------------------------------------------- errors

/** Typed input error: the caller asked for something that cannot be sent. */
export class SecurityMetricInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityMetricInputError';
  }
}

/** The security has no UUID, so its metrics cannot be looked up. */
export class MissingSecurityId extends SecurityMetricInputError {
  constructor() {
    super('security has no UUID: cannot fetch its metrics');
    this.name = 'MissingSecurityId';
  }
}

/** The metric is UNKNOWN_SECURITY_METRIC, or not a SecurityMetricTypeProto value or name. */
export class UnknownMetric extends SecurityMetricInputError {
  /** The metric as given, as a string. */
  readonly metric: string;

  constructor(metric: string) {
    super(`unknown security metric: ${metric}`);
    this.name = 'UnknownMetric';
    this.metric = metric;
  }
}

/** Points rejected by `validateRecord`; `violations` lists every bad point in input order. */
export class InvalidMetricPoints extends SecurityMetricInputError {
  readonly metric: string;
  readonly violations: ReadonlyArray<MetricPointViolation>;

  /** @param details per violation, extra text for the message (e.g. the bad value), or '' */
  constructor(metric: string, violations: MetricPointViolation[], details: string[] = []) {
    const parts = violations.map((v, i) => {
      const detail = details[i] ? ` (${details[i]})` : '';
      return v.date === null ? `${v.reason}${detail}` : `${v.date}: ${v.reason}${detail}`;
    });
    super(`invalid ${metric} points: ${parts.join('; ')}`);
    this.name = 'InvalidMetricPoints';
    this.metric = metric;
    this.violations = Object.freeze(violations.map(v => Object.freeze({ ...v })));
  }
}

/** Where a service error came from: the `host:port` called and the gRPC status. */
export interface ServiceErrorDetails {
  /** `host:port` of the service, when known. */
  address?: string;
  /** gRPC status code number, when the error came from a call. */
  code?: number;
  /** gRPC status code name, e.g. `NOT_FOUND`. */
  codeName?: string;
}

/** The SecurityMetric service failed or returned something unusable. */
export class SecurityMetricServiceError extends Error {
  readonly address?: string;
  readonly code?: number;
  readonly codeName?: string;

  constructor(message: string, details: ServiceErrorDetails = {}) {
    super(message);
    this.name = 'SecurityMetricServiceError';
    this.address = details.address;
    this.code = details.code;
    this.codeName = details.codeName;
  }
}

/** The SecurityMetric service could not be reached (gRPC UNAVAILABLE). */
export class ServiceUnavailable extends SecurityMetricServiceError {
  constructor(message: string, details: ServiceErrorDetails = {}) {
    super(message, details);
    this.name = 'ServiceUnavailable';
  }
}

// ---------------------------------------------------------------- dates

/** ISO `yyyy-mm-dd` of `d`. (`LocalDate.toString` does not zero-pad.) */
export function isoDate(d: LocalDate): string {
  const p = d.toProto();
  return `${String(p.getYear()).padStart(4, '0')}-${String(p.getMonth()).padStart(2, '0')}-${String(p.getDay()).padStart(2, '0')}`;
}

/**
 * `d` as a `LocalDate`. A string must be an ISO calendar date `yyyy-mm-dd`;
 * anything else is a SecurityMetricInputError naming it.
 */
export function toLocalDate(d: DateInput): LocalDate {
  if (d instanceof LocalDate) return d;
  if (d instanceof Date) {
    if (isNaN(d.getTime())) throw new SecurityMetricInputError('date is an invalid Date');
    return LocalDate.from(d);
  }
  if (typeof d === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m) {
      const [year, month, day] = [m[1], m[2], m[3]].map(s => parseInt(s, 10));
      const check = new Date(Date.UTC(year, month - 1, day));
      if (check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day) {
        return new LocalDate(new LocalDateProto().setYear(year).setMonth(month).setDay(day));
      }
    }
    throw new SecurityMetricInputError(`not an ISO date (yyyy-mm-dd): '${d}'`);
  }
  throw new SecurityMetricInputError(`not a date: ${String(d)}`);
}

function dateFromProto(proto: LocalDateProto): LocalDate {
  return new LocalDate(new LocalDateProto().setYear(proto.getYear()).setMonth(proto.getMonth()).setDay(proto.getDay()));
}

/** Calendar days from `from` to `to` (negative when `to` is earlier). */
function daysFrom(from: LocalDate, to: LocalDate): number {
  const a = from.toProto();
  const b = to.toProto();
  return daysBetween(new Date(a.getYear(), a.getMonth() - 1, a.getDay()), new Date(b.getYear(), b.getMonth() - 1, b.getDay()));
}

// ---------------------------------------------------------------- results

/** One observation: the date it is for and its value. */
export class MetricPoint {
  readonly date: LocalDate;
  readonly value: Decimal;

  constructor(date: LocalDate, value: Decimal) {
    this.date = date;
    this.value = value;
  }
}

/** The latest point on or before a date: its value, its date, the date asked for and the age in days. */
export class MetricResult {
  readonly value: Decimal;
  /** The observation date of the point. */
  readonly date: LocalDate;
  /** The date asked for. */
  readonly on: LocalDate;
  /** Calendar days from `date` to `on`: a Friday point asked for on Monday is 3. */
  readonly ageDays: number;

  constructor(value: Decimal, date: LocalDate, on: LocalDate) {
    this.value = value;
    this.date = date;
    this.on = on;
    this.ageDays = daysFrom(date, on);
  }
}

/** A metric's history for one security: points in ascending date order, gaps kept. */
export class MetricSeries {
  readonly securityId: UUID;
  readonly metric: SecurityMetricTypeProto;
  /** The as_of the service stamped on the first message, or undefined when unset. */
  readonly asOf: ZonedDateTime | undefined;
  readonly points: ReadonlyArray<MetricPoint>;

  constructor(securityId: UUID, metric: SecurityMetricTypeProto, asOf: ZonedDateTime | undefined, points: MetricPoint[]) {
    this.securityId = securityId;
    this.metric = metric;
    this.asOf = asOf;
    this.points = Object.freeze([...points]);
  }

  /** The last point, or undefined for an empty series. */
  get latest(): MetricPoint | undefined {
    return this.points.length === 0 ? undefined : this.points[this.points.length - 1];
  }

  /** Values keyed by ISO date, in ascending date order. */
  asDict(): Map<string, Decimal> {
    return new Map(this.points.map(p => [isoDate(p.date), p.value] as [string, Decimal]));
  }
}

// ---------------------------------------------------------------- metric

const KNOWN_METRICS: ReadonlyArray<SecurityMetricTypeProto> = [
  SecurityMetricTypeProto.SHARES_OUTSTANDING,
  SecurityMetricTypeProto.NAV_PER_SHARE,
  SecurityMetricTypeProto.TOTAL_NET_ASSETS,
];

/** The enum name of `metric`, e.g. `SHARES_OUTSTANDING`, or its number when it has none. */
export function metricName(metric: SecurityMetricTypeProto): string {
  const name = (Object.keys(SecurityMetricTypeProto) as Array<keyof typeof SecurityMetricTypeProto>)
    .find(k => SecurityMetricTypeProto[k] === metric);
  return name ?? String(metric);
}

/**
 * The metric as an enum value. UNKNOWN_SECURITY_METRIC, a number that is not
 * a metric, or a string that is not a metric's name is an `UnknownMetric`
 * naming it.
 */
export function checkMetric(metric: SecurityMetricInput): SecurityMetricTypeProto {
  if (typeof metric === 'string') {
    const found = KNOWN_METRICS.find(m => metricName(m) === metric);
    if (found === undefined) throw new UnknownMetric(metric);
    return found;
  }
  if (!KNOWN_METRICS.includes(metric)) throw new UnknownMetric(metricName(metric));
  return metric;
}

/** The UUID of `id`; a string that is not a UUID is a SecurityMetricInputError. */
export function toSecurityId(id: SecurityIdInput): UUID {
  if (id instanceof UUID) return id;
  if (typeof id === 'string' && /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/.test(id)) {
    return new UUID(UUID.fromString(id));
  }
  throw new SecurityMetricInputError(`not a security UUID: '${String(id)}'`);
}

function dedupe(uuids: ReadonlyArray<SecurityIdInput>): UUID[] {
  const seen = new Set<string>();
  const out: UUID[] = [];
  for (const id of uuids) {
    const uuid = toSecurityId(id);
    const key = uuid.toString();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(uuid);
    }
  }
  return out;
}

// ---------------------------------------------------------------- latest

/** GetLatest request for `metric` of each security (duplicates dropped, order kept) on `on`. */
export function buildGetLatest(
  metric: SecurityMetricInput,
  uuids: ReadonlyArray<SecurityIdInput>,
  on: DateInput,
): GetLatestSecurityMetricRequestProto {
  const m = checkMetric(metric);
  return stampOwn(new GetLatestSecurityMetricRequestProto())
    .setSecurityIdsList(dedupe(uuids).map(u => u.toUUIDProto()))
    .setMetricsList([m])
    .setDate(toLocalDate(on).toProto());
}

function pointFromProto(p: SecurityMetricPointProto): MetricPoint {
  const date = p.getObservationDate();
  if (!date) throw new SecurityMetricServiceError('SecurityMetric returned a point with no observation_date');
  const value = p.getValue();
  if (!value) {
    throw new SecurityMetricServiceError(`SecurityMetric returned a point with no value on ${isoDate(dateFromProto(date))}`);
  }
  return new MetricPoint(dateFromProto(date), toDecimalJs(withField('value', () => decodeDecimal(value))));
}

/**
 * Maps a GetLatest response to every requested security (key: UUID string):
 * the last point of its series for `metric`, or undefined when the response
 * has no series for it or the series has no points. Series are matched by
 * security_id, never by position; series for another metric or a security
 * that was not asked for are ignored.
 */
export function mapLatest(
  response: GetLatestSecurityMetricResponseProto,
  metric: SecurityMetricInput,
  uuids: ReadonlyArray<SecurityIdInput>,
  on: DateInput,
): Map<string, MetricResult | undefined> {
  const m = checkMetric(metric);
  const onDate = toLocalDate(on);
  const result = new Map<string, MetricResult | undefined>();
  for (const uuid of dedupe(uuids)) result.set(uuid.toString(), undefined);
  for (const series of response.getSeriesList()) {
    if (series.getMetric() !== m) continue;
    const key = UUID.fromUUIDProto(series.getSecurityId())?.toString();
    if (key === undefined || !result.has(key) || result.get(key) !== undefined) continue;
    const points = series.getPointsList();
    if (points.length === 0) continue;
    const last = pointFromProto(points[points.length - 1]);
    result.set(key, new MetricResult(last.value, last.date, onDate));
  }
  return result;
}

// ---------------------------------------------------------------- history

/** Search request for `metric` of one security from `from` to `to`, both inclusive. */
export function buildSearch(
  metric: SecurityMetricInput,
  uuid: SecurityIdInput,
  from: DateInput,
  to: DateInput,
): SearchSecurityMetricRequestProto {
  const m = checkMetric(metric);
  const securityId = toSecurityId(uuid);
  const fromDate = toLocalDate(from);
  const toDate = toLocalDate(to);
  if (isoDate(fromDate) > isoDate(toDate)) {
    throw new SecurityMetricInputError(`from date ${isoDate(fromDate)} is after to date ${isoDate(toDate)}`);
  }
  return stampOwn(new SearchSecurityMetricRequestProto())
    .setSecurityId(securityId.toUUIDProto())
    .setMetricsList([m])
    .setStartDate(fromDate.toProto())
    .setEndDate(toDate.toProto());
}

/**
 * Joins the points of consecutive Search messages. Dates must be strictly
 * ascending across the whole stream, else a SecurityMetricServiceError naming
 * the date. No messages, or messages without points, give an empty series.
 * `asOf` comes from the first message whose series has one.
 */
export function mergeChunks(
  chunks: ReadonlyArray<SearchSecurityMetricResponseProto>,
  securityId: SecurityIdInput,
  metric: SecurityMetricInput,
): MetricSeries {
  const m = checkMetric(metric);
  const points: MetricPoint[] = [];
  let asOf: ZonedDateTime | undefined;
  let previous: string | undefined;
  for (const chunk of chunks) {
    const series = chunk.getSeries();
    if (!series) continue;
    if (asOf === undefined && series.hasAsOf()) asOf = new ZonedDateTime(series.getAsOf()!);
    for (const p of series.getPointsList()) {
      const point = pointFromProto(p);
      const date = isoDate(point.date);
      if (previous !== undefined && date <= previous) {
        throw new SecurityMetricServiceError(
          `Search returned ${date} after ${previous}: dates must be strictly ascending`);
      }
      previous = date;
      points.push(point);
    }
  }
  return new MetricSeries(toSecurityId(securityId), m, asOf, points);
}

// ---------------------------------------------------------------- record

function isDecimal(v: unknown): v is Decimal {
  return v instanceof Decimal || Decimal.isDecimal(v);
}

/** The value as a Decimal, or undefined when it is not a finite decimal. */
function toDecimalValue(v: MetricValueInput): Decimal | undefined {
  if (isDecimal(v)) return v.isFinite() ? v : undefined;
  if (typeof v === 'number') {
    return Number.isFinite(v) ? new Decimal(String(v)) : undefined;
  }
  if (typeof v === 'string') {
    try {
      return toDecimalJs(parseDecimalString(v));
    } catch (e) {
      if (e instanceof ModelValidationError) return undefined;
      throw e;
    }
  }
  return undefined;
}

function pairsOf(points: RecordPointsInput): Array<readonly [DateInput, MetricValueInput | null | undefined]> {
  if (Array.isArray(points)) return points as Array<readonly [DateInput, MetricValueInput | null | undefined]>;
  return Object.keys(points).map(k => [k, (points as Record<string, MetricValueInput | null | undefined>)[k]] as const);
}

/**
 * Checks points before anything is sent. Every bad point is listed, in input
 * order, in one `InvalidMetricPoints`: `no points` (empty input), `missing
 * value`, `not a decimal`, `fractional share count` (SHARES_OUTSTANDING
 * values must be whole; `100.00` is accepted as 100) and `duplicate date`
 * (each repeat of a date). Returns the points sorted by date.
 */
export function validateRecord(metric: SecurityMetricInput, points: RecordPointsInput): MetricPoint[] {
  const m = checkMetric(metric);
  const name = metricName(m);
  const pairs = pairsOf(points);
  const violations: MetricPointViolation[] = [];
  const details: string[] = [];
  const reject = (date: string | null, reason: string, detail = '') => {
    violations.push({ date, reason });
    details.push(detail);
  };
  if (pairs.length === 0) reject(null, 'no points');

  const seen = new Set<string>();
  const valid: MetricPoint[] = [];
  for (const [rawDate, rawValue] of pairs) {
    const date = toLocalDate(rawDate);
    const iso = isoDate(date);
    let value: Decimal | undefined;
    if (rawValue === null || rawValue === undefined) {
      reject(iso, 'missing value');
    } else {
      value = toDecimalValue(rawValue);
      if (value === undefined) {
        reject(iso, 'not a decimal', String(rawValue));
      } else if (m === SecurityMetricTypeProto.SHARES_OUTSTANDING && !value.isInteger()) {
        reject(iso, 'fractional share count', value.toFixed());
        value = undefined;
      }
    }
    if (seen.has(iso)) {
      reject(iso, 'duplicate date');
    } else {
      seen.add(iso);
      if (value !== undefined) valid.push(new MetricPoint(date, value));
    }
  }
  if (violations.length > 0) throw new InvalidMetricPoints(name, violations, details);
  return valid.sort((a, b) => (isoDate(a.date) < isoDate(b.date) ? -1 : 1));
}

/** `points` split into consecutive lists of at most `chunkSize`. */
export function chunkRecord<T>(points: ReadonlyArray<T>, chunkSize: number = RECORD_CHUNK_SIZE): T[][] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new SecurityMetricInputError(`chunk size must be a whole number of at least 1: ${chunkSize}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < points.length; i += chunkSize) chunks.push(points.slice(i, i + chunkSize));
  return chunks;
}

/**
 * The wire form of a point. Values are exact; a whole value (every
 * SHARES_OUTSTANDING value after `validateRecord`) has scale 0.
 */
export function pointToProto(point: MetricPoint): SecurityMetricPointProto {
  return new SecurityMetricPointProto()
    .setObservationDate(point.date.toProto())
    .setValue(encodeDecimal(fromDecimalJs(point.value)));
}

/** CreateOrUpdate request (operation CREATE) carrying one chunk of points for one security. */
export function buildCreate(
  metric: SecurityMetricInput,
  uuid: SecurityIdInput,
  chunk: ReadonlyArray<MetricPoint>,
): CreateSecurityMetricRequestProto {
  const m = checkMetric(metric);
  const series = stampOwn(new SecurityMetricSeriesProto())
    .setSecurityId(toSecurityId(uuid).toUUIDProto())
    .setMetric(m)
    .setPointsList(chunk.map(pointToProto));
  return stampOwn(new CreateSecurityMetricRequestProto())
    .setOperationType(RequestOperationTypeProto.CREATE)
    .setSeries(series);
}
