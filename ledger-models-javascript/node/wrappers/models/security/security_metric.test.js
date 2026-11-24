"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-485: the pure SecurityMetric rules. The same fixture
// (test-fixtures/security-metric/cases.json) runs in Java, Python and Rust.
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const decimal_js_1 = require("decimal.js");
const security_metric_pb_1 = require("../../../fintekkers/models/security/security_metric_pb");
const security_metric_type_pb_1 = require("../../../fintekkers/models/security/security_metric_type_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const get_latest_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const search_security_metric_request_pb_1 = require("../../../fintekkers/requests/security_metric/search_security_metric_request_pb");
const operation_pb_1 = require("../../../fintekkers/requests/util/operation_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const decimal_1 = require("../utils/decimal");
const uuid_1 = require("../utils/uuid");
const security_metric_1 = require("./security_metric");
const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/security-metric/cases.json');
const cases = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const SPY = '11111111-2222-3333-4444-555555555555';
const OTHER = '99999999-8888-7777-6666-555555555555';
function dateProto(iso) {
    return (0, security_metric_1.toLocalDate)(iso).toProto();
}
function series(uuid, metric, points, asOfSeconds) {
    const s = new security_metric_pb_1.SecurityMetricSeriesProto()
        .setSecurityId(new uuid_1.UUID(uuid_1.UUID.fromString(uuid)).toUUIDProto())
        .setMetric(metric)
        .setPointsList(points.map(([d, v]) => new security_metric_pb_1.SecurityMetricPointProto()
        .setObservationDate(dateProto(d))
        .setValue((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(v)))));
    if (asOfSeconds !== undefined) {
        s.setAsOf(new local_timestamp_pb_1.LocalTimestampProto().setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(asOfSeconds)).setTimeZone('UTC'));
    }
    return s;
}
function chunk(points, asOfSeconds) {
    return new search_security_metric_request_pb_1.SearchSecurityMetricResponseProto()
        .setSeries(series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, points, asOfSeconds));
}
function caught(fn) {
    try {
        fn();
    }
    catch (e) {
        return e;
    }
    throw new Error('expected an error');
}
describe('security metric fixture (LM-485)', () => {
    const ran = { latest: 0, merge: 0, record: 0 };
    test.each(cases.latest)('latest: $name', (c) => {
        const metric = security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING;
        const response = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto();
        if (c.series !== null)
            response.addSeries(series(SPY, metric, c.series));
        const result = (0, security_metric_1.mapLatest)(response, metric, [SPY], c.on);
        expect([...result.keys()]).toEqual([SPY]);
        const r = result.get(SPY);
        if (c.expected === null) {
            expect(r).toBeUndefined();
        }
        else {
            expect(r).toBeInstanceOf(security_metric_1.MetricResult);
            expect(r.value.equals(new decimal_js_1.Decimal(c.expected.value))).toBe(true);
            expect(r.value.toFixed()).toBe(new decimal_js_1.Decimal(c.expected.value).toFixed());
            expect((0, security_metric_1.isoDate)(r.date)).toBe(c.expected.date);
            expect((0, security_metric_1.isoDate)(r.on)).toBe(c.on);
            expect(r.ageDays).toBe(c.expected.ageDays);
        }
        ran.latest++;
    });
    test.each(cases.merge)('merge: $name', (c) => {
        const chunks = c.chunks.map((points) => chunk(points));
        if (c.error !== undefined) {
            const e = caught(() => (0, security_metric_1.mergeChunks)(chunks, SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE));
            expect(e).toBeInstanceOf(security_metric_1.SecurityMetricServiceError);
            expect(e.message).toContain(c.error);
        }
        else {
            const s = (0, security_metric_1.mergeChunks)(chunks, SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE);
            expect(s.points.map(p => [(0, security_metric_1.isoDate)(p.date), p.value.toFixed()])).toEqual(c.expected.map(([d, v]) => [d, new decimal_js_1.Decimal(v).toFixed()]));
            expect(s.securityId.toString()).toBe(SPY);
            expect(s.metric).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE);
        }
        ran.merge++;
    });
    test.each(cases.record)('record: $name', (c) => {
        const metric = (0, security_metric_1.checkMetric)(c.metric);
        if (c.violations !== undefined) {
            const e = caught(() => (0, security_metric_1.validateRecord)(metric, c.points));
            expect(e).toBeInstanceOf(security_metric_1.InvalidMetricPoints);
            expect(e).toBeInstanceOf(security_metric_1.SecurityMetricInputError);
            expect(e.violations).toEqual(c.violations);
        }
        else {
            const chunks = (0, security_metric_1.chunkRecord)((0, security_metric_1.validateRecord)(metric, c.points), c.chunkSize);
            expect(chunks.map(ch => ch.map(p => (0, security_metric_1.isoDate)(p.date)))).toEqual(c.expectedChunks);
            const wire = chunks.flatMap(ch => (0, security_metric_1.buildCreate)(metric, SPY, ch).getSeries().getPointsList());
            const decoded = wire.map(p => (0, decimal_1.decodeDecimal)(p.getValue()));
            expect(decoded.map(decimal_1.toCanonicalString)).toEqual(c.expectedValues);
            if (metric === security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING) {
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
        expect(security_metric_1.RECORD_CHUNK_SIZE).toBe(5000);
    });
    test('checkMetric accepts enum values and names, and names what it rejects', () => {
        expect((0, security_metric_1.checkMetric)(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE)).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE);
        expect((0, security_metric_1.checkMetric)('TOTAL_NET_ASSETS')).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS);
        const unknown = caught(() => (0, security_metric_1.checkMetric)(security_metric_type_pb_1.SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC));
        expect(unknown).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(unknown.message).toBe('unknown security metric: UNKNOWN_SECURITY_METRIC');
        expect(caught(() => (0, security_metric_1.checkMetric)('SHARE_COUNT')).message).toBe('unknown security metric: SHARE_COUNT');
        expect(caught(() => (0, security_metric_1.checkMetric)('UNKNOWN_SECURITY_METRIC'))).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(caught(() => (0, security_metric_1.checkMetric)(42)).message).toBe('unknown security metric: 42');
    });
    test('buildGetLatest dedupes, keeps order and is stamped', () => {
        const req = (0, security_metric_1.buildGetLatest)('SHARES_OUTSTANDING', [OTHER, SPY, OTHER.toUpperCase()], '2026-11-23');
        expect(req.getSecurityIdsList().map(u => uuid_1.UUID.fromUUIDProto(u).toString())).toEqual([OTHER, SPY]);
        expect(req.getMetricsList()).toEqual([security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING]);
        expect((0, security_metric_1.isoDate)((0, security_metric_1.toLocalDate)('2026-11-23'))).toBe('2026-11-23');
        expect(req.getDate().toObject()).toEqual(dateProto('2026-11-23').toObject());
        expect(req.getObjectType()).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_GET_LATEST_SECURITY_METRIC_REQUEST);
        expect(req.hasVersion()).toBe(true);
    });
    test('mapLatest matches by security_id and ignores other metrics and securities', () => {
        const response = new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto().setSeriesList([
            series('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, [['2026-11-20', '7']]),
            series(SPY, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, [['2026-11-20', '512.34']]),
            series(OTHER, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, [['2026-11-19', '1'], ['2026-11-20', '2']]),
        ]);
        const result = (0, security_metric_1.mapLatest)(response, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, [SPY, OTHER], '2026-11-23');
        expect([...result.keys()]).toEqual([SPY, OTHER]);
        expect(result.get(SPY)).toBeUndefined();
        expect(result.get(OTHER).value.toFixed()).toBe('2');
        expect((0, security_metric_1.isoDate)(result.get(OTHER).date)).toBe('2026-11-20');
    });
    test('buildSearch sets the range and rejects from after to', () => {
        const req = (0, security_metric_1.buildSearch)(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, SPY, '2026-11-01', '2026-11-20');
        expect(uuid_1.UUID.fromUUIDProto(req.getSecurityId()).toString()).toBe(SPY);
        expect(req.getMetricsList()).toEqual([security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE]);
        expect(req.getStartDate().toObject()).toEqual(dateProto('2026-11-01').toObject());
        expect(req.getEndDate().toObject()).toEqual(dateProto('2026-11-20').toObject());
        expect(req.getObjectType()).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SEARCH_SECURITY_METRIC_REQUEST);
        const e = caught(() => (0, security_metric_1.buildSearch)(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, SPY, '2026-11-20', '2026-11-19'));
        expect(e).toBeInstanceOf(security_metric_1.SecurityMetricInputError);
        expect(e.message).toBe('from date 2026-11-20 is after to date 2026-11-19');
    });
    test('mergeChunks takes as_of from the first chunk that has one; latest and asDict', () => {
        const s = (0, security_metric_1.mergeChunks)([chunk([['2026-11-16', '1']]), chunk([['2026-11-18', '2']], 1795392000), chunk([], 1)], SPY, 'NAV_PER_SHARE');
        expect(s.asOf.getSeconds()).toBe(1795392000);
        expect((0, security_metric_1.isoDate)(s.latest.date)).toBe('2026-11-18');
        expect([...s.asDict().entries()].map(([d, v]) => [d, v.toFixed()])).toEqual([['2026-11-16', '1'], ['2026-11-18', '2']]);
        const empty = (0, security_metric_1.mergeChunks)([], SPY, 'NAV_PER_SHARE');
        expect(empty.asOf).toBeUndefined();
        expect(empty.latest).toBeUndefined();
        expect(empty.asDict().size).toBe(0);
    });
    test('validateRecord takes an object, numbers and Decimals; message names each bad point', () => {
        const points = (0, security_metric_1.validateRecord)('NAV_PER_SHARE', { '2026-11-20': 512.34, '2026-11-19': new decimal_js_1.Decimal('511.25') });
        expect(points.map(p => [(0, security_metric_1.isoDate)(p.date), p.value.toFixed()])).toEqual([['2026-11-19', '511.25'], ['2026-11-20', '512.34']]);
        const e = caught(() => (0, security_metric_1.validateRecord)('SHARES_OUTSTANDING', [['2026-11-18', '1.5'], ['2026-11-19', 1], ['2026-11-19', 2]]));
        expect(e.message).toBe('invalid SHARES_OUTSTANDING points: 2026-11-18: fractional share count (1.5); 2026-11-19: duplicate date');
        const bad = caught(() => (0, security_metric_1.validateRecord)('NAV_PER_SHARE', [['2026-11-18', 'abc']]));
        expect(bad.violations).toEqual([{ date: '2026-11-18', reason: 'not a decimal' }]);
        expect(caught(() => (0, security_metric_1.validateRecord)('NAV_PER_SHARE', [['2026-13-01', '1']])).message).toContain("'2026-13-01'");
    });
    test('buildCreate is a stamped CREATE carrying a stamped series', () => {
        const req = (0, security_metric_1.buildCreate)('SHARES_OUTSTANDING', SPY, (0, security_metric_1.validateRecord)('SHARES_OUTSTANDING', [['2026-11-20', '15204137000']]));
        expect(req.getOperationType()).toBe(operation_pb_1.RequestOperationTypeProto.CREATE);
        expect(req.getObjectType()).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_METRIC_REQUEST);
        const s = req.getSeries();
        expect(s.getObjectType()).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY_METRIC_SERIES);
        expect(uuid_1.UUID.fromUUIDProto(s.getSecurityId()).toString()).toBe(SPY);
        expect(s.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING);
        expect((0, decimal_1.decodeDecimal)(s.getPointsList()[0].getValue())).toEqual({ unscaled: BigInt('15204137000'), scale: 0 });
    });
});
//# sourceMappingURL=security_metric.test.js.map