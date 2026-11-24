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
import { SecurityMetricPointProto } from '../../../fintekkers/models/security/security_metric_pb';
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import { CreateSecurityMetricRequestProto } from '../../../fintekkers/requests/security_metric/create_security_metric_request_pb';
import { GetLatestSecurityMetricRequestProto, type GetLatestSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb';
import { SearchSecurityMetricRequestProto, type SearchSecurityMetricResponseProto } from '../../../fintekkers/requests/security_metric/search_security_metric_request_pb';
import { LocalDate } from '../utils/date';
import { ZonedDateTime } from '../utils/datetime';
import { UUID } from '../utils/uuid';
/** Most points sent in one CreateOrUpdate request; `record` splits larger inputs. */
export declare const RECORD_CHUNK_SIZE = 5000;
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
export type RecordPointsInput = Record<string, MetricValueInput | null | undefined> | ReadonlyArray<readonly [DateInput, MetricValueInput | null | undefined]>;
/** One rejected point: its ISO date (null for the whole input) and the reason. */
export interface MetricPointViolation {
    date: string | null;
    reason: string;
}
/** Typed input error: the caller asked for something that cannot be sent. */
export declare class SecurityMetricInputError extends Error {
    constructor(message: string);
}
/** The security has no UUID, so its metrics cannot be looked up. */
export declare class MissingSecurityId extends SecurityMetricInputError {
    constructor();
}
/** The metric is UNKNOWN_SECURITY_METRIC, or not a SecurityMetricTypeProto value or name. */
export declare class UnknownMetric extends SecurityMetricInputError {
    /** The metric as given, as a string. */
    readonly metric: string;
    constructor(metric: string);
}
/** Points rejected by `validateRecord`; `violations` lists every bad point in input order. */
export declare class InvalidMetricPoints extends SecurityMetricInputError {
    readonly metric: string;
    readonly violations: ReadonlyArray<MetricPointViolation>;
    /** @param details per violation, extra text for the message (e.g. the bad value), or '' */
    constructor(metric: string, violations: MetricPointViolation[], details?: string[]);
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
export declare class SecurityMetricServiceError extends Error {
    readonly address?: string;
    readonly code?: number;
    readonly codeName?: string;
    constructor(message: string, details?: ServiceErrorDetails);
}
/** The SecurityMetric service could not be reached (gRPC UNAVAILABLE). */
export declare class ServiceUnavailable extends SecurityMetricServiceError {
    constructor(message: string, details?: ServiceErrorDetails);
}
/** ISO `yyyy-mm-dd` of `d`. (`LocalDate.toString` does not zero-pad.) */
export declare function isoDate(d: LocalDate): string;
/**
 * `d` as a `LocalDate`. A string must be an ISO calendar date `yyyy-mm-dd`;
 * anything else is a SecurityMetricInputError naming it.
 */
export declare function toLocalDate(d: DateInput): LocalDate;
/** One observation: the date it is for and its value. */
export declare class MetricPoint {
    readonly date: LocalDate;
    readonly value: Decimal;
    constructor(date: LocalDate, value: Decimal);
}
/** The latest point on or before a date: its value, its date, the date asked for and the age in days. */
export declare class MetricResult {
    readonly value: Decimal;
    /** The observation date of the point. */
    readonly date: LocalDate;
    /** The date asked for. */
    readonly on: LocalDate;
    /** Calendar days from `date` to `on`: a Friday point asked for on Monday is 3. */
    readonly ageDays: number;
    constructor(value: Decimal, date: LocalDate, on: LocalDate);
}
/** A metric's history for one security: points in ascending date order, gaps kept. */
export declare class MetricSeries {
    readonly securityId: UUID;
    readonly metric: SecurityMetricTypeProto;
    /** The as_of the service stamped on the first message, or undefined when unset. */
    readonly asOf: ZonedDateTime | undefined;
    readonly points: ReadonlyArray<MetricPoint>;
    constructor(securityId: UUID, metric: SecurityMetricTypeProto, asOf: ZonedDateTime | undefined, points: MetricPoint[]);
    /** The last point, or undefined for an empty series. */
    get latest(): MetricPoint | undefined;
    /** Values keyed by ISO date, in ascending date order. */
    asDict(): Map<string, Decimal>;
}
/** The enum name of `metric`, e.g. `SHARES_OUTSTANDING`, or its number when it has none. */
export declare function metricName(metric: SecurityMetricTypeProto): string;
/**
 * The metric as an enum value. UNKNOWN_SECURITY_METRIC, a number that is not
 * a metric, or a string that is not a metric's name is an `UnknownMetric`
 * naming it.
 */
export declare function checkMetric(metric: SecurityMetricInput): SecurityMetricTypeProto;
/** The UUID of `id`; a string that is not a UUID is a SecurityMetricInputError. */
export declare function toSecurityId(id: SecurityIdInput): UUID;
/** GetLatest request for `metric` of each security (duplicates dropped, order kept) on `on`. */
export declare function buildGetLatest(metric: SecurityMetricInput, uuids: ReadonlyArray<SecurityIdInput>, on: DateInput): GetLatestSecurityMetricRequestProto;
/**
 * Maps a GetLatest response to every requested security (key: UUID string):
 * the last point of its series for `metric`, or undefined when the response
 * has no series for it or the series has no points. Series are matched by
 * security_id, never by position; series for another metric or a security
 * that was not asked for are ignored.
 */
export declare function mapLatest(response: GetLatestSecurityMetricResponseProto, metric: SecurityMetricInput, uuids: ReadonlyArray<SecurityIdInput>, on: DateInput): Map<string, MetricResult | undefined>;
/** Search request for `metric` of one security from `from` to `to`, both inclusive. */
export declare function buildSearch(metric: SecurityMetricInput, uuid: SecurityIdInput, from: DateInput, to: DateInput): SearchSecurityMetricRequestProto;
/**
 * Joins the points of consecutive Search messages. Dates must be strictly
 * ascending across the whole stream, else a SecurityMetricServiceError naming
 * the date. No messages, or messages without points, give an empty series.
 * `asOf` comes from the first message whose series has one.
 */
export declare function mergeChunks(chunks: ReadonlyArray<SearchSecurityMetricResponseProto>, securityId: SecurityIdInput, metric: SecurityMetricInput): MetricSeries;
/**
 * Checks points before anything is sent. Every bad point is listed, in input
 * order, in one `InvalidMetricPoints`: `no points` (empty input), `missing
 * value`, `not a decimal`, `fractional share count` (SHARES_OUTSTANDING
 * values must be whole; `100.00` is accepted as 100) and `duplicate date`
 * (each repeat of a date). Returns the points sorted by date.
 */
export declare function validateRecord(metric: SecurityMetricInput, points: RecordPointsInput): MetricPoint[];
/** `points` split into consecutive lists of at most `chunkSize`. */
export declare function chunkRecord<T>(points: ReadonlyArray<T>, chunkSize?: number): T[][];
/**
 * The wire form of a point. Values are exact; a whole value (every
 * SHARES_OUTSTANDING value after `validateRecord`) has scale 0.
 */
export declare function pointToProto(point: MetricPoint): SecurityMetricPointProto;
/** CreateOrUpdate request (operation CREATE) carrying one chunk of points for one security. */
export declare function buildCreate(metric: SecurityMetricInput, uuid: SecurityIdInput, chunk: ReadonlyArray<MetricPoint>): CreateSecurityMetricRequestProto;
