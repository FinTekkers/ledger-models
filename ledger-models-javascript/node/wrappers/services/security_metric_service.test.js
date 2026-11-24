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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-485: SecurityMetricService and Security.getMetric against an in-memory
 * SecurityMetric gRPC server on 127.0.0.1 (security_metric_fake_server.ts),
 * through the default gRPC fetcher built from an injected environment.
 *
 * Lives directly under services/: jest.config.js skips tests in
 * services/<name>/ folders (they need live services).
 */
const grpc = __importStar(require("@grpc/grpc-js"));
const net = __importStar(require("net"));
const decimal_js_1 = require("decimal.js");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const security_metric_type_pb_1 = require("../../fintekkers/models/security/security_metric_type_pb");
const get_latest_security_metric_request_pb_1 = require("../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const security_1 = __importDefault(require("../models/security/security"));
const security_metric_1 = require("../models/security/security_metric");
const decimal_1 = require("../models/utils/decimal");
const uuid_1 = require("../models/utils/uuid");
const date_1 = require("../models/utils/date");
const serviceaddress_1 = require("../util/serviceaddress");
const SecurityMetricService_1 = require("./security-metric-service/SecurityMetricService");
const security_metric_fake_server_1 = require("./security_metric_fake_server");
const SHARES = security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING;
const NAV = security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE;
let fake;
function env(port) {
    return { PRICE_SERVICE_HOST: '127.0.0.1', PRICE_SERVICE_PORT: String(port) };
}
function securityOf(uuid) {
    // A link: getMetric must use the UUID only, never hydrate.
    return new security_1.default(security_1.default.linkOfLatest(new uuid_1.UUID(uuid_1.UUID.fromString(uuid))));
}
function iso(d) {
    return `${d.getYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDay()).padStart(2, '0')}`;
}
function uuidOf(n) {
    return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}
function rejection(p) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield p;
        }
        catch (e) {
            return e;
        }
        throw new Error('expected a rejection');
    });
}
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    fake = yield security_metric_fake_server_1.FakeSecurityMetricServer.start();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield fake.stop();
}));
beforeEach(() => {
    (0, SecurityMetricService_1.setSecurityMetricService)(SecurityMetricService_1.SecurityMetricService.fromEnv(env(fake.port)));
});
afterEach(() => {
    (0, SecurityMetricService_1.resetSecurityMetricServiceForTests)();
});
describe('SecurityMetricService through the default gRPC fetcher (LM-485)', () => {
    test('getMetric and sharesOutstanding: Monday asks, Friday answers, 3 days old, one call each', () => __awaiter(void 0, void 0, void 0, function* () {
        const spy = securityOf(security_metric_fake_server_1.SPY_UUID);
        const before = fake.calls.getLatest;
        const viaMetric = yield spy.getMetric(SHARES, '2026-11-23');
        expect(fake.calls.getLatest).toBe(before + 1);
        const viaShortcut = yield spy.sharesOutstanding('2026-11-23');
        expect(fake.calls.getLatest).toBe(before + 2);
        for (const r of [viaMetric, viaShortcut]) {
            expect(r).toBeInstanceOf(security_metric_1.MetricResult);
            expect(r.value.equals(new decimal_js_1.Decimal('15210000000'))).toBe(true);
            expect((0, security_metric_1.isoDate)(r.date)).toBe('2026-11-20');
            expect((0, security_metric_1.isoDate)(r.on)).toBe('2026-11-23');
            expect(r.ageDays).toBe(3);
        }
        expect(viaMetric.value.equals(viaShortcut.value)).toBe(true);
        expect(spy.isLink()).toBe(true);
        // The name string works as well as the enum value.
        expect((yield spy.getMetric('SHARES_OUTSTANDING', '2026-11-23')).value.toFixed()).toBe('15210000000');
    }));
    test('omitted on: the date sent is the result date, and ageDays counts from it', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuidOf(1);
        fake.seed(uuid, NAV, [['2000-01-03', '100.25']]);
        const result = yield securityOf(uuid).navPerShare();
        const sent = fake.getLatestRequests[fake.getLatestRequests.length - 1].getDate();
        expect(result).toBeInstanceOf(security_metric_1.MetricResult);
        expect((0, security_metric_1.isoDate)(result.on)).toBe(iso(sent));
        const sentDate = new Date(sent.getYear(), sent.getMonth() - 1, sent.getDay());
        expect(result.ageDays).toBe((0, date_1.daysBetween)(new Date(2000, 0, 3), sentDate));
        expect((0, security_metric_1.isoDate)(result.date)).toBe('2000-01-03');
    }));
    test('history: 5 points with a gap arrive in 3 messages and merge ascending', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuidOf(2);
        const points = [
            ['2026-11-16', '510.1'], ['2026-11-17', '511.25'], ['2026-11-18', '512.34'],
            ['2026-11-20', '513'], ['2026-11-23', '514.5'],
        ];
        fake.seed(uuid, NAV, [...points].reverse());
        // The fake really sends 2 + 2 + 1.
        const direct = new SecurityMetricService_1.GrpcSecurityMetricFetcher((0, serviceaddress_1.resolve)(serviceaddress_1.Service.PRICE, env(fake.port)), { deadlineMs: 5000 });
        const chunks = yield direct.search((0, security_metric_1.buildSearch)(NAV, uuid, '2026-11-16', '2026-11-23'));
        direct.close();
        expect(chunks.map(c => c.getSeries().getPointsList().length)).toEqual([2, 2, 1]);
        const before = fake.calls.search;
        const series = yield securityOf(uuid).navPerShareHistory('2026-11-16', '2026-11-23');
        expect(fake.calls.search).toBe(before + 1);
        expect(series.securityId.toString()).toBe(uuid);
        expect(series.metric).toBe(NAV);
        expect(series.asOf).toBeDefined();
        expect(series.points.map(p => [(0, security_metric_1.isoDate)(p.date), p.value.toFixed()])).toEqual(points);
        expect((0, security_metric_1.isoDate)(series.latest.date)).toBe('2026-11-23');
        expect(series.latest.value.toFixed()).toBe('514.5');
        expect([...series.asDict().entries()].map(([d, v]) => [d, v.toFixed()])).toEqual(points);
        const viaGeneric = yield securityOf(uuid).getMetricHistory('NAV_PER_SHARE', '2026-11-17', '2026-11-18');
        expect(viaGeneric.points.map(p => (0, security_metric_1.isoDate)(p.date))).toEqual(['2026-11-17', '2026-11-18']);
    }));
    test('batch get: replies in reverse order, unknown omitted, one call, each value on its own UUID', () => __awaiter(void 0, void 0, void 0, function* () {
        const other = uuidOf(3);
        const unknown = uuidOf(4);
        fake.seed(other, SHARES, [['2026-11-18', '42']]);
        const before = fake.calls.getLatest;
        const result = yield (0, SecurityMetricService_1.getSecurityMetricService)().get(SHARES, [security_metric_fake_server_1.SPY_UUID, other, unknown], '2026-11-23');
        expect(fake.calls.getLatest).toBe(before + 1);
        expect([...result.keys()]).toEqual([security_metric_fake_server_1.SPY_UUID, other, unknown]);
        expect(result.get(security_metric_fake_server_1.SPY_UUID).value.toFixed()).toBe('15210000000');
        expect(result.get(other).value.toFixed()).toBe('42');
        expect((0, security_metric_1.isoDate)(result.get(other).date)).toBe('2026-11-18');
        expect(result.has(unknown)).toBe(true);
        expect(result.get(unknown)).toBeUndefined();
    }));
    test('get with no UUIDs makes no call', () => __awaiter(void 0, void 0, void 0, function* () {
        const before = fake.calls.getLatest;
        expect((yield (0, SecurityMetricService_1.getSecurityMetricService)().get(SHARES, [], '2026-11-23')).size).toBe(0);
        expect(fake.calls.getLatest).toBe(before);
    }));
    test('record: exact scale-0 share count, dates as given, and 5001 points in 2 requests', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuidOf(5);
        const service = (0, SecurityMetricService_1.getSecurityMetricService)();
        const before = fake.calls.createOrUpdate;
        const asOf = yield service.record(SHARES, uuid, { '2026-11-20': '15204137000' });
        expect(fake.calls.createOrUpdate).toBe(before + 1);
        const one = fake.createRequests[fake.createRequests.length - 1].getSeries();
        expect(uuid_1.UUID.fromUUIDProto(one.getSecurityId()).toString()).toBe(uuid);
        expect(one.getMetric()).toBe(SHARES);
        expect(one.getPointsList()).toHaveLength(1);
        expect(iso(one.getPointsList()[0].getObservationDate())).toBe('2026-11-20');
        expect((0, decimal_1.decodeDecimal)(one.getPointsList()[0].getValue())).toEqual({ unscaled: BigInt('15204137000'), scale: 0 });
        expect(asOf.getSeconds()).toBe(Date.UTC(2026, 10, 23, 21) / 1000 + fake.calls.createOrUpdate);
        const many = [];
        for (let i = security_metric_1.RECORD_CHUNK_SIZE; i >= 0; i--) {
            many.push([new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10), 1000 + i]);
        }
        const start = fake.createRequests.length;
        const lastAsOf = yield service.record('TOTAL_NET_ASSETS', uuid, many);
        const requests = fake.createRequests.slice(start);
        expect(requests).toHaveLength(2);
        const sentDates = [];
        for (const r of requests) {
            const s = r.getSeries();
            expect(uuid_1.UUID.fromUUIDProto(s.getSecurityId()).toString()).toBe(uuid);
            expect(s.getMetric()).toBe(security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS);
            sentDates.push(...s.getPointsList().map(p => iso(p.getObservationDate())));
        }
        expect(requests.map(r => r.getSeries().getPointsList().length)).toEqual([security_metric_1.RECORD_CHUNK_SIZE, 1]);
        expect(sentDates).toEqual(many.map(([d]) => d).sort());
        expect(lastAsOf.getSeconds()).toBe(Date.UTC(2026, 10, 23, 21) / 1000 + fake.calls.createOrUpdate);
        expect(lastAsOf.getSeconds()).toBe(asOf.getSeconds() + 2);
    }));
    test('fractional shares and duplicate dates: InvalidMetricPoints, nothing sent', () => __awaiter(void 0, void 0, void 0, function* () {
        const before = fake.calls.createOrUpdate;
        const service = (0, SecurityMetricService_1.getSecurityMetricService)();
        const fractional = yield rejection(service.record(SHARES, security_metric_fake_server_1.SPY_UUID, { '2026-11-20': '1.5' }));
        expect(fractional).toBeInstanceOf(security_metric_1.InvalidMetricPoints);
        expect(fractional.violations).toEqual([{ date: '2026-11-20', reason: 'fractional share count' }]);
        const duplicate = yield rejection(service.record(NAV, security_metric_fake_server_1.SPY_UUID, [['2026-11-20', '1'], ['2026-11-20', '2']]));
        expect(duplicate).toBeInstanceOf(security_metric_1.InvalidMetricPoints);
        expect(duplicate.violations).toEqual([{ date: '2026-11-20', reason: 'duplicate date' }]);
        expect(fake.calls.createOrUpdate).toBe(before);
    }));
    test('unreachable service: getMetric raises ServiceUnavailable naming 127.0.0.1:<port>', () => __awaiter(void 0, void 0, void 0, function* () {
        const port = yield new Promise((done, fail) => {
            const socket = net.createServer();
            socket.once('error', fail);
            socket.listen(0, '127.0.0.1', () => {
                const p = socket.address().port;
                socket.close(() => done(p));
            });
        });
        (0, SecurityMetricService_1.setSecurityMetricService)(SecurityMetricService_1.SecurityMetricService.fromEnv(env(port), { deadlineMs: 5000 }));
        const e = yield rejection(securityOf(security_metric_fake_server_1.SPY_UUID).getMetric(SHARES, '2026-11-23'));
        expect(e).toBeInstanceOf(security_metric_1.ServiceUnavailable);
        expect(e).toBeInstanceOf(security_metric_1.SecurityMetricServiceError);
        expect(e.message).toContain(`127.0.0.1:${port}`);
        expect(e.message).toContain('unreachable');
    }), 15000);
    test('absent through the real stack is undefined, never 0', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuidOf(6);
        fake.seed(uuid, SHARES, [['2026-11-20', '5']]);
        const early = securityOf(uuid);
        for (const r of [yield early.getMetric(SHARES, '2026-11-19'), yield early.sharesOutstanding('2026-11-19')]) {
            expect(r).toBeUndefined();
            expect(r).not.toBe(0);
            expect(r).not.toBeInstanceOf(security_metric_1.MetricResult);
        }
        const unknown = securityOf(uuidOf(7));
        expect(yield unknown.getMetric(SHARES, '2026-11-23')).toBeUndefined();
        expect(yield unknown.totalNetAssets('2026-11-23')).toBeUndefined();
    }));
    test('no UUID and unknown metrics raise errors naming the problem, before any call', () => __awaiter(void 0, void 0, void 0, function* () {
        const before = Object.assign({}, fake.calls);
        const noId = yield rejection(new security_1.default(new security_pb_1.SecurityProto()).getMetric(SHARES));
        expect(noId).toBeInstanceOf(security_metric_1.MissingSecurityId);
        expect(noId.message).toBe('security has no UUID: cannot fetch its metrics');
        expect(yield rejection(new security_1.default(new security_pb_1.SecurityProto()).navPerShareHistory('2026-11-01'))).toBeInstanceOf(security_metric_1.MissingSecurityId);
        const spy = securityOf(security_metric_fake_server_1.SPY_UUID);
        const unknownEnum = yield rejection(spy.getMetric(security_metric_type_pb_1.SecurityMetricTypeProto.UNKNOWN_SECURITY_METRIC));
        expect(unknownEnum).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(unknownEnum.message).toBe('unknown security metric: UNKNOWN_SECURITY_METRIC');
        const unknownName = yield rejection(spy.getMetric('SHARE_COUNT'));
        expect(unknownName).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(unknownName.message).toBe('unknown security metric: SHARE_COUNT');
        expect(yield rejection(spy.getMetricHistory('SHARE_COUNT', '2026-11-01'))).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(yield rejection((0, SecurityMetricService_1.getSecurityMetricService)().record('SHARE_COUNT', security_metric_fake_server_1.SPY_UUID, { '2026-11-20': 1 }))).toBeInstanceOf(security_metric_1.UnknownMetric);
        expect(fake.calls).toEqual(before);
    }));
    test('a gRPC error other than UNAVAILABLE names the RPC, host:port and status', () => {
        const fetcher = new SecurityMetricService_1.GrpcSecurityMetricFetcher((0, serviceaddress_1.resolve)(serviceaddress_1.Service.PRICE, env(8083)));
        const e = fetcher.toServiceError('GetLatest', { code: grpc.status.NOT_FOUND, details: 'no such series' });
        fetcher.close();
        expect(e).toBeInstanceOf(security_metric_1.SecurityMetricServiceError);
        expect(e).not.toBeInstanceOf(security_metric_1.ServiceUnavailable);
        expect(e.message).toBe('SecurityMetric GetLatest failed at 127.0.0.1:8083: NOT_FOUND (no such series)');
    });
});
describe('installed fetcher (LM-485)', () => {
    function fetcher(overrides) {
        return Object.assign({ getLatest: () => __awaiter(this, void 0, void 0, function* () { return new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto(); }), search: () => __awaiter(this, void 0, void 0, function* () { return []; }), createOrUpdate: () => __awaiter(this, void 0, void 0, function* () { throw new Error('not expected'); }) }, overrides);
    }
    test('setSecurityMetricFetcher replaces the gRPC fetcher; null restores it', () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        (0, SecurityMetricService_1.setSecurityMetricFetcher)(fetcher({ getLatest: () => __awaiter(void 0, void 0, void 0, function* () { calls++; return new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto(); }) }));
        expect(yield securityOf(security_metric_fake_server_1.SPY_UUID).getMetric(SHARES, '2026-11-23')).toBeUndefined();
        expect(calls).toBe(1);
        (0, SecurityMetricService_1.setSecurityMetricFetcher)(null);
        expect((yield securityOf(security_metric_fake_server_1.SPY_UUID).getMetric(SHARES, '2026-11-23')).value.toFixed()).toBe('15210000000');
        expect(calls).toBe(1);
    }));
    test('a later chunk failing says how many points were already stored', () => __awaiter(void 0, void 0, void 0, function* () {
        let calls = 0;
        const real = fake;
        (0, SecurityMetricService_1.setSecurityMetricFetcher)(fetcher({
            createOrUpdate: () => __awaiter(void 0, void 0, void 0, function* () {
                calls++;
                if (calls === 2) {
                    throw new security_metric_1.ServiceUnavailable(`SecurityMetric service unreachable at ${real.address} (gone)`, { address: real.address });
                }
                return {};
            }),
        }));
        const points = [];
        for (let i = 0; i <= security_metric_1.RECORD_CHUNK_SIZE; i++)
            points.push([new Date(Date.UTC(2001, 0, 1 + i)).toISOString().slice(0, 10), '1']);
        const e = yield rejection((0, SecurityMetricService_1.getSecurityMetricService)().record(NAV, security_metric_fake_server_1.SPY_UUID, points));
        expect(e).toBeInstanceOf(security_metric_1.ServiceUnavailable);
        expect(e.message).toContain(real.address);
        expect(e.message).toContain(`${security_metric_1.RECORD_CHUNK_SIZE} points already stored`);
    }));
});
//# sourceMappingURL=security_metric_service.test.js.map