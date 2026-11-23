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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeSecurityMetricServer = exports.SPY_UUID = void 0;
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
const grpc = __importStar(require("@grpc/grpc-js"));
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_metric_service_grpc_pb_1 = require("../../fintekkers/services/security-metric-service/security_metric_service_grpc_pb");
const security_metric_pb_1 = require("../../fintekkers/models/security/security_metric_pb");
const security_metric_type_pb_1 = require("../../fintekkers/models/security/security_metric_type_pb");
const local_date_pb_1 = require("../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const create_security_metric_request_pb_1 = require("../../fintekkers/requests/security_metric/create_security_metric_request_pb");
const get_latest_security_metric_request_pb_1 = require("../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb");
const search_security_metric_request_pb_1 = require("../../fintekkers/requests/security_metric/search_security_metric_request_pb");
const object_types_1 = require("../util/object-types");
const decimal_1 = require("../models/utils/decimal");
const uuid_1 = require("../models/utils/uuid");
/** The seeded SPY security: SHARES_OUTSTANDING 2026-11-19 → 15204137000, 2026-11-20 → 15210000000. */
exports.SPY_UUID = '5f0c2a1e-7b3d-4c8e-9a10-2b3c4d5e6f70';
const AS_OF_BASE_SECONDS = Date.UTC(2026, 10, 23, 21, 0, 0) / 1000;
function iso(d) {
    if (!d)
        return '';
    return `${String(d.getYear()).padStart(4, '0')}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDay()).padStart(2, '0')}`;
}
function dateProto(isoDate) {
    const [y, m, d] = isoDate.split('-').map(s => parseInt(s, 10));
    return new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d);
}
function uuidKey(p) {
    const u = uuid_1.UUID.fromUUIDProto(p);
    return u ? u.toString() : '';
}
function timestamp(seconds) {
    return new local_timestamp_pb_1.LocalTimestampProto().setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(seconds).setNanos(0)).setTimeZone('UTC');
}
class FakeSecurityMetricServer {
    constructor(server, port) {
        this.calls = { getLatest: 0, search: 0, createOrUpdate: 0 };
        this.getLatestRequests = [];
        this.searchRequests = [];
        this.createRequests = [];
        /** `${uuid}|${metric}` → ISO date → canonical decimal string. */
        this.store = new Map();
        this.server = server;
        this.port = port;
    }
    /** Starts a server on 127.0.0.1 with a free port, seeded with SPY. */
    static start() {
        return __awaiter(this, void 0, void 0, function* () {
            const server = new grpc.Server();
            const port = yield new Promise((resolve, reject) => {
                server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, p) => (err ? reject(err) : resolve(p)));
            });
            const fake = new FakeSecurityMetricServer(server, port);
            server.addService(security_metric_service_grpc_pb_1.SecurityMetricService, {
                getLatest: fake.getLatest.bind(fake),
                search: fake.search.bind(fake),
                createOrUpdate: fake.createOrUpdate.bind(fake),
            });
            // grpc-js 1.8 (this package's lockfile) serves only after start().
            server.start();
            fake.seed(exports.SPY_UUID, security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, [
                ['2026-11-19', '15204137000'],
                ['2026-11-20', '15210000000'],
            ]);
            return fake;
        });
    }
    /** `host:port` of the server. */
    get address() {
        return `127.0.0.1:${this.port}`;
    }
    /** Adds points for (uuid, metric). */
    seed(uuid, metric, points) {
        var _a;
        const key = `${uuid}|${metric}`;
        const series = (_a = this.store.get(key)) !== null && _a !== void 0 ? _a : new Map();
        for (const [date, value] of points)
            series.set(date, value);
        this.store.set(key, series);
    }
    /** Stops the server and drops open calls. */
    stop() {
        return new Promise(resolve => {
            this.server.tryShutdown(() => resolve());
            this.server.forceShutdown();
        });
    }
    knows(uuid) {
        for (const key of this.store.keys())
            if (key.startsWith(`${uuid}|`))
                return true;
        return false;
    }
    sorted(uuid, metric) {
        const series = this.store.get(`${uuid}|${metric}`);
        return series ? [...series.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)) : [];
    }
    series(uuid, metric, points, asOf) {
        return (0, object_types_1.stampOwn)(new security_metric_pb_1.SecurityMetricSeriesProto())
            .setSecurityId(uuid)
            .setMetric(metric)
            .setAsOf(timestamp(asOf))
            .setPointsList(points.map(([d, v]) => new security_metric_pb_1.SecurityMetricPointProto()
            .setObservationDate(dateProto(d))
            .setValue((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(v)))));
    }
    getLatest(call, callback) {
        this.calls.getLatest++;
        const request = call.request;
        this.getLatestRequests.push(request);
        const on = iso(request.getDate());
        const response = (0, object_types_1.stampOwn)(new get_latest_security_metric_request_pb_1.GetLatestSecurityMetricResponseProto());
        for (const id of [...request.getSecurityIdsList()].reverse()) {
            const uuid = uuidKey(id);
            if (!this.knows(uuid))
                continue;
            for (const metric of request.getMetricsList()) {
                const onOrBefore = this.sorted(uuid, metric).filter(([d]) => d <= on);
                response.addSeries(this.series(id, metric, onOrBefore.slice(-1), AS_OF_BASE_SECONDS));
            }
        }
        callback(null, response);
    }
    search(call) {
        this.calls.search++;
        const request = call.request;
        this.searchRequests.push(request);
        const from = iso(request.getStartDate());
        const to = iso(request.getEndDate());
        const uuid = uuidKey(request.getSecurityId());
        const metric = request.getMetricsList()[0];
        const points = this.sorted(uuid, metric).filter(([d]) => d >= from && d <= to);
        const send = (chunk) => call.write((0, object_types_1.stampOwn)(new search_security_metric_request_pb_1.SearchSecurityMetricResponseProto())
            .setSeries(this.series(request.getSecurityId(), metric, chunk, AS_OF_BASE_SECONDS)));
        if (points.length === 0)
            send([]);
        for (let i = 0; i < points.length; i += 2)
            send(points.slice(i, i + 2));
        call.end();
    }
    createOrUpdate(call, callback) {
        this.calls.createOrUpdate++;
        const request = call.request;
        this.createRequests.push(request);
        const series = request.getSeries();
        if (!series) {
            callback({ code: grpc.status.INVALID_ARGUMENT, details: 'series is required' }, null);
            return;
        }
        this.seed(uuidKey(series.getSecurityId()), series.getMetric(), series.getPointsList().map(p => [iso(p.getObservationDate()), (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(p.getValue()))]));
        callback(null, (0, object_types_1.stampOwn)(new create_security_metric_request_pb_1.CreateSecurityMetricResponseProto())
            .setOperationType(request.getOperationType())
            .setSeries(this.series(series.getSecurityId(), series.getMetric(), [], AS_OF_BASE_SECONDS + this.calls.createOrUpdate)));
    }
}
exports.FakeSecurityMetricServer = FakeSecurityMetricServer;
//# sourceMappingURL=security_metric_fake_server.js.map