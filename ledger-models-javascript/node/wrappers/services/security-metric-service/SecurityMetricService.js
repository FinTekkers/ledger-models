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
exports.resetSecurityMetricServiceForTests = exports.setSecurityMetricService = exports.getSecurityMetricService = exports.setSecurityMetricFetcher = exports.SecurityMetricService = exports.GrpcSecurityMetricFetcher = exports.DEFAULT_DEADLINE_MS = void 0;
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
const grpc = __importStar(require("@grpc/grpc-js"));
const security_metric_service_grpc_pb_1 = require("../../../fintekkers/services/security-metric-service/security_metric_service_grpc_pb");
const date_1 = require("../../models/utils/date");
const datetime_1 = require("../../models/utils/datetime");
const security_metric_1 = require("../../models/security/security_metric");
const serviceaddress_1 = require("../../util/serviceaddress");
/** Default per-call deadline of the gRPC fetcher. */
exports.DEFAULT_DEADLINE_MS = 30000;
/**
 * The default fetcher: a gRPC client for one endpoint. Errors become
 * `ServiceUnavailable` (gRPC UNAVAILABLE) or `SecurityMetricServiceError`,
 * both naming `host:port` and the status.
 */
class GrpcSecurityMetricFetcher {
    constructor(endpoint, options = {}) {
        var _a;
        this.address = (0, serviceaddress_1.target)(endpoint);
        this.deadlineMs = (_a = options.deadlineMs) !== null && _a !== void 0 ? _a : exports.DEFAULT_DEADLINE_MS;
        const credentials = endpoint.plaintext ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
        this.client = new security_metric_service_grpc_pb_1.SecurityMetricClient(this.address, credentials);
    }
    close() {
        this.client.close();
    }
    callOptions() {
        return { deadline: new Date(Date.now() + this.deadlineMs) };
    }
    /** The service error for a failed call to `rpc`. */
    toServiceError(rpc, err) {
        var _a;
        const e = err;
        const code = typeof (e === null || e === void 0 ? void 0 : e.code) === 'number' ? e.code : undefined;
        const codeName = code === undefined ? 'UNKNOWN' : ((_a = grpc.status[code]) !== null && _a !== void 0 ? _a : String(code));
        const details = (e === null || e === void 0 ? void 0 : e.details) || (err instanceof Error ? err.message : String(err));
        if (code === grpc.status.UNAVAILABLE) {
            return new security_metric_1.ServiceUnavailable(`SecurityMetric service unreachable at ${this.address} (${details})`, { address: this.address, code, codeName });
        }
        return new security_metric_1.SecurityMetricServiceError(`SecurityMetric ${rpc} failed at ${this.address}: ${codeName} (${details})`, { address: this.address, code, codeName });
    }
    getLatest(request) {
        return new Promise((resolvePromise, reject) => {
            this.client.getLatest(request, new grpc.Metadata(), this.callOptions(), (err, response) => {
                if (err)
                    reject(this.toServiceError('GetLatest', err));
                else
                    resolvePromise(response);
            });
        });
    }
    search(request) {
        return new Promise((resolvePromise, reject) => {
            const chunks = [];
            const stream = this.client.search(request, this.callOptions());
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolvePromise(chunks));
            stream.on('error', (err) => reject(this.toServiceError('Search', err)));
        });
    }
    createOrUpdate(request) {
        return new Promise((resolvePromise, reject) => {
            this.client.createOrUpdate(request, new grpc.Metadata(), this.callOptions(), (err, response) => {
                if (err)
                    reject(this.toServiceError('CreateOrUpdate', err));
                else
                    resolvePromise(response);
            });
        });
    }
}
exports.GrpcSecurityMetricFetcher = GrpcSecurityMetricFetcher;
let installedFetcher = null;
let defaultService = null;
class SecurityMetricService {
    constructor(options = {}) {
        this.ownFetcher = options.fetcher;
        this.env = options.env;
        this.deadlineMs = options.deadlineMs;
    }
    /**
     * A service whose default gRPC fetcher resolves the PRICE address from
     * `env` instead of `process.env`.
     */
    static fromEnv(env, options = {}) {
        return new SecurityMetricService({ env, deadlineMs: options.deadlineMs });
    }
    /** This instance's fetcher, else the installed one, else the default gRPC fetcher (built on first use). */
    fetcher() {
        var _a;
        if (this.ownFetcher)
            return this.ownFetcher;
        if (installedFetcher)
            return installedFetcher;
        if (!this.grpcFetcher) {
            this.grpcFetcher = new GrpcSecurityMetricFetcher((0, serviceaddress_1.resolve)(serviceaddress_1.Service.PRICE, (_a = this.env) !== null && _a !== void 0 ? _a : process.env), { deadlineMs: this.deadlineMs });
        }
        return this.grpcFetcher;
    }
    /** Closes the default gRPC client, if one was built. */
    close() {
        var _a;
        (_a = this.grpcFetcher) === null || _a === void 0 ? void 0 : _a.close();
        this.grpcFetcher = undefined;
    }
    /**
     * The latest value of `metric` on or before `on` (default today) for each
     * security, in one GetLatest call. Every requested UUID string is a key;
     * its value is undefined when the security has no point on or before `on`.
     * No call for an empty list.
     */
    get(metric, uuids, on) {
        return __awaiter(this, void 0, void 0, function* () {
            const m = (0, security_metric_1.checkMetric)(metric);
            const onDate = on === undefined ? date_1.LocalDate.today() : (0, security_metric_1.toLocalDate)(on);
            const ids = uuids.map(security_metric_1.toSecurityId);
            if (ids.length === 0)
                return new Map();
            const response = yield this.fetcher().getLatest((0, security_metric_1.buildGetLatest)(m, ids, onDate));
            return (0, security_metric_1.mapLatest)(response, m, ids, onDate);
        });
    }
    /** Every point of `metric` for one security from `from` to `to` (default today), both inclusive. */
    getHistory(metric, uuid, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const m = (0, security_metric_1.checkMetric)(metric);
            const securityId = (0, security_metric_1.toSecurityId)(uuid);
            const request = (0, security_metric_1.buildSearch)(m, securityId, from, to === undefined ? date_1.LocalDate.today() : to);
            const chunks = yield this.fetcher().search(request);
            return (0, security_metric_1.mergeChunks)(chunks, securityId, m);
        });
    }
    /**
     * Stores points of `metric` for one security. Points are checked first
     * (`InvalidMetricPoints`, nothing sent), then sent in chunks of
     * `RECORD_CHUNK_SIZE`, one CreateOrUpdate each. Returns the as_of the
     * service stamped on the last chunk. If a later chunk fails, the error
     * says how many points were already stored.
     */
    record(metric, uuid, points) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const m = (0, security_metric_1.checkMetric)(metric);
            const securityId = (0, security_metric_1.toSecurityId)(uuid);
            const chunks = (0, security_metric_1.chunkRecord)((0, security_metric_1.validateRecord)(m, points), security_metric_1.RECORD_CHUNK_SIZE);
            const fetcher = this.fetcher();
            let stored = 0;
            let response;
            for (const chunk of chunks) {
                try {
                    response = yield fetcher.createOrUpdate((0, security_metric_1.buildCreate)(m, securityId, chunk));
                }
                catch (e) {
                    if (stored === 0)
                        throw e;
                    throw alreadyStored(e, stored);
                }
                stored += chunk.length;
            }
            const asOf = (_a = response === null || response === void 0 ? void 0 : response.getSeries()) === null || _a === void 0 ? void 0 : _a.getAsOf();
            if (!asOf)
                throw new security_metric_1.SecurityMetricServiceError('SecurityMetric CreateOrUpdate response has no series.as_of');
            return new datetime_1.ZonedDateTime(asOf);
        });
    }
}
exports.SecurityMetricService = SecurityMetricService;
/** `e` with "N points already stored" added, keeping its class. */
function alreadyStored(e, stored) {
    const suffix = `; ${stored} points already stored`;
    if (e instanceof security_metric_1.SecurityMetricServiceError) {
        const details = { address: e.address, code: e.code, codeName: e.codeName };
        return e instanceof security_metric_1.ServiceUnavailable
            ? new security_metric_1.ServiceUnavailable(e.message + suffix, details)
            : new security_metric_1.SecurityMetricServiceError(e.message + suffix, details);
    }
    const message = e instanceof Error ? e.message : String(e);
    return new security_metric_1.SecurityMetricServiceError(`SecurityMetric CreateOrUpdate failed: ${message}${suffix}`);
}
/**
 * Installs `fetcher` for every SecurityMetricService in the process (except
 * instances built with their own fetcher). `null` restores the default.
 */
function setSecurityMetricFetcher(fetcher) {
    installedFetcher = fetcher;
}
exports.setSecurityMetricFetcher = setSecurityMetricFetcher;
/** The process-wide service that `Security.getMetric` and friends use, built on first use. */
function getSecurityMetricService() {
    if (!defaultService)
        defaultService = new SecurityMetricService();
    return defaultService;
}
exports.getSecurityMetricService = getSecurityMetricService;
/**
 * Replaces the process-wide service, e.g. with `SecurityMetricService.fromEnv(env)`
 * in a test. `null` clears it (the next `getSecurityMetricService()` builds a new one).
 */
function setSecurityMetricService(service) {
    defaultService = service;
}
exports.setSecurityMetricService = setSecurityMetricService;
/** Test teardown: removes the installed fetcher and closes and clears the process-wide service. */
function resetSecurityMetricServiceForTests() {
    installedFetcher = null;
    defaultService === null || defaultService === void 0 ? void 0 : defaultService.close();
    defaultService = null;
}
exports.resetSecurityMetricServiceForTests = resetSecurityMetricServiceForTests;
//# sourceMappingURL=SecurityMetricService.js.map