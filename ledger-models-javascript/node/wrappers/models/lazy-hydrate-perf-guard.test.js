"use strict";
// Performance-regression guard for the Transaction wrapper's lazy-hydrate
// read path (pre-warmed cache hit). Mirrors LazyHydratePerfGuard.java.
//
// Baseline: ~2.57 µs/op at N=10000 (steady state) on a Mac Mini M-series.
// Default ceiling = baseline + 15% headroom = 2.96 µs/op.
//
// Override via env var LAZY_HYDRATE_PERF_CEILING_US for slower CI hardware.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LinkCacheModule = __importStar(require("../util/link-cache"));
const transaction_1 = __importDefault(require("./transaction/transaction"));
const uuid_1 = require("./utils/uuid");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const datetime_1 = require("./utils/datetime");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const N = 10000;
const DEFAULT_CEILING_US = 2.96; // 2.57 * 1.15
function readCeilingUs() {
    const raw = process.env.LAZY_HYDRATE_PERF_CEILING_US;
    if (!raw)
        return DEFAULT_CEILING_US;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_CEILING_US;
}
function makeAsOf() {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(1700000000);
    ts.setNanos(0);
    const lt = new local_timestamp_pb_1.LocalTimestampProto();
    lt.setTimestamp(ts);
    lt.setTimeZone("UTC");
    return lt;
}
function runOnce() {
    const asOf = makeAsOf();
    const asOfZdt = new datetime_1.ZonedDateTime(asOf);
    const links = [];
    const txnUuids = [];
    const portUuids = [];
    for (let i = 0; i < N; i++) {
        const txnUuid = uuid_1.UUID.random();
        const portUuid = uuid_1.UUID.random();
        txnUuids.push(txnUuid.toString());
        portUuids.push(portUuid.toString());
        const resolvedPort = new portfolio_pb_1.PortfolioProto();
        resolvedPort.setUuid(portUuid.toUUIDProto());
        resolvedPort.setAsOf(asOf);
        resolvedPort.setIsLink(false);
        resolvedPort.setPortfolioName(`P-${portUuid.toString().slice(0, 8)}`);
        const resolved = new transaction_pb_1.TransactionProto();
        resolved.setUuid(txnUuid.toUUIDProto());
        resolved.setAsOf(asOf);
        resolved.setIsLink(false);
        resolved.setTradeName(`T-${txnUuid.toString().slice(0, 8)}`);
        resolved.setPortfolio(resolvedPort);
        LinkCacheModule.TRANSACTION.put(txnUuid.toString(), resolved, asOfZdt);
        LinkCacheModule.PORTFOLIO.put(portUuid.toString(), resolvedPort, asOfZdt);
        const link = new transaction_pb_1.TransactionProto();
        link.setUuid(txnUuid.toUUIDProto());
        link.setAsOf(asOf);
        link.setIsLink(true);
        links.push(link);
    }
    if (global.gc)
        global.gc();
    const t0 = process.hrtime.bigint();
    let sink = 0;
    for (const link of links) {
        const t = new transaction_1.default(link);
        // Trigger ensureHydrated by hitting an accessor that calls it.
        const portfolio = t.getPortfolio();
        if (portfolio)
            sink++;
    }
    const t1 = process.hrtime.bigint();
    expect(sink).toBe(N);
    for (const u of txnUuids)
        LinkCacheModule.TRANSACTION.evict(u);
    for (const u of portUuids)
        LinkCacheModule.PORTFOLIO.evict(u);
    return Number(t1 - t0) / N / 1000;
}
describe("lazy-hydrate perf guard", () => {
    test("per_op_stays_within_15pct_of_baseline_at_n_10000", () => {
        const ceilingUs = readCeilingUs();
        // Warmup
        runOnce();
        const perOpUs = runOnce();
        // eslint-disable-next-line no-console
        console.log(`LazyHydratePerfGuard (ts): N=${N}  per_op=${perOpUs.toFixed(2)} us  ` +
            `ceiling=${ceilingUs.toFixed(2)} us`);
        expect(perOpUs).toBeLessThanOrEqual(ceilingUs);
    }, 60000);
});
//# sourceMappingURL=lazy-hydrate-perf-guard.test.js.map