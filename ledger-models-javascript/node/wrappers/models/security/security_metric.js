"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreate = exports.pointToProto = exports.chunkRecord = exports.validateRecord = exports.mergeChunks = exports.buildSearch = exports.mapLatest = exports.buildGetLatest = exports.toSecurityId = exports.checkMetric = exports.metricName = exports.MetricSeries = exports.MetricResult = exports.MetricPoint = exports.toLocalDate = exports.isoDate = exports.ServiceUnavailable = exports.SecurityMetricServiceError = exports.InvalidMetricPoints = exports.UnknownMetric = exports.MissingSecurityId = exports.SecurityMetricInputError = exports.RECORD_CHUNK_SIZE = void 0;
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
const decimal_js_1 = require("decimal.js");
const security_metric_pb_1 = require("../../../fintekkers/models/security/security_metric_pb");
const security_metric_type_pb_1 = require("../../../fintekkers/models/security/security_metric_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const create_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/create_security_metric_request_pb");
const get_latest_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const search_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/search_security_metric_request_pb");
const operation_pb_1 = require("../../../fintekkers/requests/util/operation_pb");
const object_types_1 = require("../../util/object-types");
const errors_1 = require("../errors");
const date_1 = require("../utils/date");
const datetime_1 = require("../utils/datetime");
const decimal_1 = require("../utils/decimal");
const uuid_1 = require("../utils/uuid");
/** Most points sent in one CreateOrUpdate request; `record` splits larger inputs. */
exports.RECORD_CHUNK_SIZE = 5000;
// ---------------------------------------------------------------- errors
/** Typed input error: the caller asked for something that cannot be sent. */
class SecurityMetricInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityMetricInputError';
    }
}
exports.SecurityMetricInputError = SecurityMetricInputError;
/** The security has no UUID, so its metrics cannot be looked up. */
class MissingSecurityId extends SecurityMetricInputError {
    constructor() {
        super('security has no UUID: cannot fetch its metrics');
        this.name = 'MissingSecurityId';
    }
}
exports.MissingSecurityId = MissingSecurityId;
/** The metric is UNKNOWN_SECURITY_METRIC, or not a SecurityMetricTypeProto value or name. */
class UnknownMetric extends SecurityMetricInputError {
    constructor(metric) {
        super(`unknown security metric: ${metric}`);
        this.name = 'UnknownMetric';
        this.metric = metric;
    }
}
exports.UnknownMetric = UnknownMetric;
/** Points rejected by `validateRecord`; `violations` lists every bad point in input order. */
class InvalidMetricPoints extends SecurityMetricInputError {
    /** @param details per violation, extra text for the message (e.g. the bad value), or '' */
    constructor(metric, violations, details = []) {
        const parts = violations.map((v, i) => {
            const detail = details[i] ? ` (${details[i]})` : '';
            return v.date === null ? `${v.reason}${detail}` : `${v.date}: ${v.reason}${detail}`;
        });
        super(`invalid ${metric} points: ${parts.join('; ')}`);
        this.name = 'InvalidMetricPoints';
        this.metric = metric;
        this.violations = Object.freeze(violations.map(v => Object.freeze(Object.assign({}, v))));
    }
}
exports.InvalidMetricPoints = InvalidMetricPoints;
/** The SecurityMetric service failed or returned something unusable. */
class SecurityMetricServiceError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'SecurityMetricServiceError';
        this.address = details.address;
        this.code = details.code;
        this.codeName = details.codeName;
    }
}
exports.SecurityMetricServiceError = SecurityMetricServiceError;
/** The SecurityMetric service could not be reached (gRPC UNAVAILABLE). */
class ServiceUnavailable extends SecurityMetricServiceError {
    constructor(message, details = {}) {
        super(message, details);
        this.name = 'ServiceUnavailable';
    }
}
exports.ServiceUnavailable = ServiceUnavailable;
// ---------------------------------------------------------------- dates
/** ISO `yyyy-mm-dd` of `d`. (`LocalDate.toString` does not zero-pad.) */
function isoDate(d) {
    const p = d.toProto();
    return `${String(p.getYear()).padStart(4, '0')}-${String(p.getMonth()).padStart(2, '0')}-${String(p.getDay()).padStart(2, '0')}`;
}
exports.isoDate = isoDate;
/**
 * `d` as a `LocalDate`. A string must be an ISO calendar date `yyyy-mm-dd`;
 * anything else is a SecurityMetricInputError naming it.
 */
function toLocalDate(d) {
    if (d instanceof date_1.LocalDate)
        return d;
    if (d instanceof Date) {
        if (isNaN(d.getTime()))
            throw new SecurityMetricInputError('date is an invalid Date');
        return date_1.LocalDate.from(d);
    }
    if (typeof d === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
        if (m) {
            const [year, month, day] = [m[1], m[2], m[3]].map(s => parseInt(s, 10));
            const check = new Date(Date.UTC(year, month - 1, day));
            if (check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day) {
                return new date_1.LocalDate(new local_date_pb_1.LocalDateProto().setYear(year).setMonth(month).setDay(day));
            }
        }
        throw new SecurityMetricInputError(`not an ISO date (yyyy-mm-dd): '${d}'`);
    }
    throw new SecurityMetricInputError(`not a date: ${String(d)}`);
}
exports.toLocalDate = toLocalDate;
function dateFromProto(proto) {
    return new date_1.LocalDate(new local_date_pb_1.LocalDateProto().setYear(proto.getYear()).setMonth(proto.getMonth()).setDay(proto.getDay()));
}
/** Calendar days from `from` to `to` (negative when `to` is earlier). */
function daysFrom(from, to) {
    const a = from.toProto();
    const b = to.toProto();
    return (0, date_1.daysBetween)(new Date(a.getYear(), a.getMonth() - 1, a.getDay()), new Date(b.getYear(), b.getMonth() - 1, b.getDay()));
}
// ---------------------------------------------------------------- results
/** One observation: the date it is for and its value. */
class MetricPoint {
    constructor(date, value) {
        this.date = date;
        this.value = value;
    }
}
exports.MetricPoint = MetricPoint;
/** The latest point on or before a date: its value, its date, the date asked for and the age in days. */
class MetricResult {
    constructor(value, date, on) {
        this.value = value;
        this.date = date;
        this.on = on;
        this.ageDays = daysFrom(date, on);
    }
}
exports.MetricResult = MetricResult;
/** A metric's history for one security: points in ascending date order, gaps kept. */
class MetricSeries {
    constructor(securityId, metric, asOf, points) {
        this.securityId = securityId;
        this.metric = metric;
        this.asOf = asOf;
        this.points = Object.freeze([...points]);
    }
    /** The last point, or undefined for an empty series. */
    get latest() {
        return this.points.length === 0 ? undefined : this.points[this.points.length - 1];
    }
    /** Values keyed by ISO date, in ascending date order. */
    asDict() {
        return new Map(this.points.map(p => [isoDate(p.date), p.value]));
    }
}
exports.MetricSeries = MetricSeries;
// ---------------------------------------------------------------- metric
const KNOWN_METRICS = [
    security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING,
    security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE,
    security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS,
];
/** The enum name of `metric`, e.g. `SHARES_OUTSTANDING`, or its number when it has none. */
function metricName(metric) {
    const name = Object.keys(security_metric_type_pb_1.SecurityMetricTypeProto)
        .find(k => security_metric_type_pb_1.SecurityMetricTypeProto[k] === metric);
    return name !== null && name !== void 0 ? name : String(metric);
}
exports.metricName = metricName;
/**
 * The metric as an enum value. UNKNOWN_SECURITY_METRIC, a number that is not
 * a metric, or a string that is not a metric's name is an `UnknownMetric`
 * naming it.
 */
function checkMetric(metric) {
    if (typeof metric === 'string') {
        const found = KNOWN_METRICS.find(m => metricName(m) === metric);
        if (found === undefined)
            throw new UnknownMetric(metric);
        return found;
    }
    if (!KNOWN_METRICS.includes(metric))
        throw new UnknownMetric(metricName(metric));
    return metric;
}
exports.checkMetric = checkMetric;
/** The UUID of `id`; a string that is not a UUID is a SecurityMetricInputError. */
function toSecurityId(id) {
    if (id instanceof uuid_1.UUID)
        return id;
    if (typeof id === 'string' && /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/.test(id)) {
        return new uuid_1.UUID(uuid_1.UUID.fromString(id));
    }
    throw new SecurityMetricInputError(`not a security UUID: '${String(id)}'`);
}
exports.toSecurityId = toSecurityId;
function dedupe(uuids) {
    const seen = new Set();
    const out = [];
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
function buildGetLatest(metric, uuids, on) {
    const m = checkMetric(metric);
    return (0, object_types_1.stampOwn)(new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricRequestProto())
        .setSecurityIdsList(dedupe(uuids).map(u => u.toUUIDProto()))
        .setMetricsList([m])
        .setDate(toLocalDate(on).toProto());
}
exports.buildGetLatest = buildGetLatest;
function pointFromProto(p) {
    const date = p.getObservationDate();
    if (!date)
        throw new SecurityMetricServiceError('SecurityMetric returned a point with no observation_date');
    const value = p.getValue();
    if (!value) {
        throw new SecurityMetricServiceError(`SecurityMetric returned a point with no value on ${isoDate(dateFromProto(date))}`);
    }
    return new MetricPoint(dateFromProto(date), (0, decimal_1.toDecimalJs)((0, decimal_1.withField)('value', () => (0, decimal_1.decodeDecimal)(value))));
}
/**
 * Maps a GetLatest response to every requested security (key: UUID string):
 * the last point of its series for `metric`, or undefined when the response
 * has no series for it or the series has no points. Series are matched by
 * security_id, never by position; series for another metric or a security
 * that was not asked for are ignored.
 */
function mapLatest(response, metric, uuids, on) {
    var _a;
    const m = checkMetric(metric);
    const onDate = toLocalDate(on);
    const result = new Map();
    for (const uuid of dedupe(uuids))
        result.set(uuid.toString(), undefined);
    for (const series of response.getSeriesList()) {
        if (series.getMetric() !== m)
            continue;
        const key = (_a = uuid_1.UUID.fromUUIDProto(series.getSecurityId())) === null || _a === void 0 ? void 0 : _a.toString();
        if (key === undefined || !result.has(key) || result.get(key) !== undefined)
            continue;
        const points = series.getPointsList();
        if (points.length === 0)
            continue;
        const last = pointFromProto(points[points.length - 1]);
        result.set(key, new MetricResult(last.value, last.date, onDate));
    }
    return result;
}
exports.mapLatest = mapLatest;
// ---------------------------------------------------------------- history
/** Search request for `metric` of one security from `from` to `to`, both inclusive. */
function buildSearch(metric, uuid, from, to) {
    const m = checkMetric(metric);
    const securityId = toSecurityId(uuid);
    const fromDate = toLocalDate(from);
    const toDate = toLocalDate(to);
    if (isoDate(fromDate) > isoDate(toDate)) {
        throw new SecurityMetricInputError(`from date ${isoDate(fromDate)} is after to date ${isoDate(toDate)}`);
    }
    return (0, object_types_1.stampOwn)(new search_security_metric_request_pb_1.SearchSecurityMetricRequestProto())
        .setSecurityId(securityId.toUUIDProto())
        .setMetricsList([m])
        .setStartDate(fromDate.toProto())
        .setEndDate(toDate.toProto());
}
exports.buildSearch = buildSearch;
/**
 * Joins the points of consecutive Search messages. Dates must be strictly
 * ascending across the whole stream, else a SecurityMetricServiceError naming
 * the date. No messages, or messages without points, give an empty series.
 * `asOf` comes from the first message whose series has one.
 */
function mergeChunks(chunks, securityId, metric) {
    const m = checkMetric(metric);
    const points = [];
    let asOf;
    let previous;
    for (const chunk of chunks) {
        const series = chunk.getSeries();
        if (!series)
            continue;
        if (asOf === undefined && series.hasAsOf())
            asOf = new datetime_1.ZonedDateTime(series.getAsOf());
        for (const p of series.getPointsList()) {
            const point = pointFromProto(p);
            const date = isoDate(point.date);
            if (previous !== undefined && date <= previous) {
                throw new SecurityMetricServiceError(`Search returned ${date} after ${previous}: dates must be strictly ascending`);
            }
            previous = date;
            points.push(point);
        }
    }
    return new MetricSeries(toSecurityId(securityId), m, asOf, points);
}
exports.mergeChunks = mergeChunks;
// ---------------------------------------------------------------- record
function isDecimal(v) {
    return v instanceof decimal_js_1.Decimal || decimal_js_1.Decimal.isDecimal(v);
}
/** The value as a Decimal, or undefined when it is not a finite decimal. */
function toDecimalValue(v) {
    if (isDecimal(v))
        return v.isFinite() ? v : undefined;
    if (typeof v === 'number') {
        return Number.isFinite(v) ? new decimal_js_1.Decimal(String(v)) : undefined;
    }
    if (typeof v === 'string') {
        try {
            return (0, decimal_1.toDecimalJs)((0, decimal_1.parseDecimalString)(v));
        }
        catch (e) {
            if (e instanceof errors_1.ModelValidationError)
                return undefined;
            throw e;
        }
    }
    return undefined;
}
function pairsOf(points) {
    if (Array.isArray(points))
        return points;
    return Object.keys(points).map(k => [k, points[k]]);
}
/**
 * Checks points before anything is sent. Every bad point is listed, in input
 * order, in one `InvalidMetricPoints`: `no points` (empty input), `missing
 * value`, `not a decimal`, `fractional share count` (SHARES_OUTSTANDING
 * values must be whole; `100.00` is accepted as 100) and `duplicate date`
 * (each repeat of a date). Returns the points sorted by date.
 */
function validateRecord(metric, points) {
    const m = checkMetric(metric);
    const name = metricName(m);
    const pairs = pairsOf(points);
    const violations = [];
    const details = [];
    const reject = (date, reason, detail = '') => {
        violations.push({ date, reason });
        details.push(detail);
    };
    if (pairs.length === 0)
        reject(null, 'no points');
    const seen = new Set();
    const valid = [];
    for (const [rawDate, rawValue] of pairs) {
        const date = toLocalDate(rawDate);
        const iso = isoDate(date);
        let value;
        if (rawValue === null || rawValue === undefined) {
            reject(iso, 'missing value');
        }
        else {
            value = toDecimalValue(rawValue);
            if (value === undefined) {
                reject(iso, 'not a decimal', String(rawValue));
            }
            else if (m === security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING && !value.isInteger()) {
                reject(iso, 'fractional share count', value.toFixed());
                value = undefined;
            }
        }
        if (seen.has(iso)) {
            reject(iso, 'duplicate date');
        }
        else {
            seen.add(iso);
            if (value !== undefined)
                valid.push(new MetricPoint(date, value));
        }
    }
    if (violations.length > 0)
        throw new InvalidMetricPoints(name, violations, details);
    return valid.sort((a, b) => (isoDate(a.date) < isoDate(b.date) ? -1 : 1));
}
exports.validateRecord = validateRecord;
/** `points` split into consecutive lists of at most `chunkSize`. */
function chunkRecord(points, chunkSize = exports.RECORD_CHUNK_SIZE) {
    if (!Number.isInteger(chunkSize) || chunkSize < 1) {
        throw new SecurityMetricInputError(`chunk size must be a whole number of at least 1: ${chunkSize}`);
    }
    const chunks = [];
    for (let i = 0; i < points.length; i += chunkSize)
        chunks.push(points.slice(i, i + chunkSize));
    return chunks;
}
exports.chunkRecord = chunkRecord;
/**
 * The wire form of a point. Values are exact; a whole value (every
 * SHARES_OUTSTANDING value after `validateRecord`) has scale 0.
 */
function pointToProto(point) {
    return new security_metric_pb_1.SecurityMetricPointProto()
        .setObservationDate(point.date.toProto())
        .setValue((0, decimal_1.encodeDecimal)((0, decimal_1.fromDecimalJs)(point.value)));
}
exports.pointToProto = pointToProto;
/** CreateOrUpdate request (operation CREATE) carrying one chunk of points for one security. */
function buildCreate(metric, uuid, chunk) {
    const m = checkMetric(metric);
    const series = (0, object_types_1.stampOwn)(new security_metric_pb_1.SecurityMetricSeriesProto())
        .setSecurityId(toSecurityId(uuid).toUUIDProto())
        .setMetric(m)
        .setPointsList(chunk.map(pointToProto));
    return (0, object_types_1.stampOwn)(new create_security_metric_request_pb_1.CreateSecurityMetricRequestProto())
        .setOperationType(operation_pb_1.RequestOperationTypeProto.CREATE)
        .setSeries(series);
}
exports.buildCreate = buildCreate;
//# sourceMappingURL=security_metric.js.map