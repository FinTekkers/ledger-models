"use strict";
// End-to-end perf bench for Transaction wrapper lazy hydration.
// Run: `npx jest node/wrappers/models/lazy-hydrate.bench.ts` (jest runs
// .ts files via ts-jest; stdout shows the bench output).
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
const SIZES = [10, 100, 1000, 10000];
function makeAsOf() {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(1700000000);
    ts.setNanos(0);
    const lt = new local_timestamp_pb_1.LocalTimestampProto();
    lt.setTimestamp(ts);
    lt.setTimeZone("UTC");
    return lt;
}
function runBench(n) {
    const asOf = makeAsOf();
    const asOfZdt = new datetime_1.ZonedDateTime(asOf);
    const links = [];
    const txnUuids = [];
    const portUuids = [];
    for (let i = 0; i < n; i++) {
        const txnUuid = uuid_1.UUID.random();
        const portUuid = uuid_1.UUID.random();
        txnUuids.push(txnUuid.toString());
        portUuids.push(portUuid.toString());
        const resolvedPortfolio = new portfolio_pb_1.PortfolioProto();
        resolvedPortfolio.setUuid(portUuid.toUUIDProto());
        resolvedPortfolio.setAsOf(asOf);
        resolvedPortfolio.setIsLink(false);
        resolvedPortfolio.setPortfolioName(`P-${portUuid.toString().slice(0, 8)}`);
        const resolved = new transaction_pb_1.TransactionProto();
        resolved.setUuid(txnUuid.toUUIDProto());
        resolved.setAsOf(asOf);
        resolved.setIsLink(false);
        resolved.setTradeName(`T-${txnUuid.toString().slice(0, 8)}`);
        resolved.setPortfolio(resolvedPortfolio);
        LinkCacheModule.TRANSACTION.put(txnUuid.toString(), resolved, asOfZdt);
        LinkCacheModule.PORTFOLIO.put(portUuid.toString(), resolvedPortfolio, asOfZdt);
        const link = new transaction_pb_1.TransactionProto();
        link.setUuid(txnUuid.toUUIDProto());
        link.setAsOf(asOf);
        link.setIsLink(true);
        links.push(link);
    }
    if (global.gc)
        global.gc();
    const heapBefore = process.memoryUsage().heapUsed;
    const t0 = process.hrtime.bigint();
    let sink = 0;
    for (const link of links) {
        const t = new transaction_1.default(link);
        // Trigger lazy hydrate via getter that calls ensureHydrated.
        const name = t.proto.getIsLink() ? "" : t.proto.getTradeName();
        // Workaround: TS wrappers' ensureHydrated is private and accessors
        // on Transaction are reads through proto. Hit a typed accessor:
        const portfolio = t.getPortfolio();
        if (portfolio)
            sink++;
        if (name === "" && portfolio)
            sink++;
    }
    const t1 = process.hrtime.bigint();
    const heapAfter = process.memoryUsage().heapUsed;
    const elapsedNs = Number(t1 - t0);
    const elapsedMs = elapsedNs / 1e6;
    const perOpUs = elapsedNs / n / 1000;
    const heapDeltaKb = (heapAfter - heapBefore) / 1024;
    // eslint-disable-next-line no-console
    console.log(`N=${n.toString().padStart(6)}  elapsed=${elapsedMs.toFixed(2).padStart(9)} ms  ` +
        `per_op=${perOpUs.toFixed(2).padStart(8)} us  ` +
        `heap_delta=${heapDeltaKb.toFixed(2).padStart(8)} KiB  reads=${sink}`);
    for (const u of txnUuids)
        LinkCacheModule.TRANSACTION.evict(u);
    for (const u of portUuids)
        LinkCacheModule.PORTFOLIO.evict(u);
}
// Wrap in describe so jest treats it as a suite; the test body is the bench.
describe("lazy-hydrate bench", () => {
    test("Transaction across 10/100/1000/10000 sizes", () => {
        // eslint-disable-next-line no-console
        console.log("# ts bench: lazy-hydrate Transaction via pre-warmed LinkCache");
        for (const n of SIZES)
            runBench(n);
    }, 60000);
});
//# sourceMappingURL=lazy-hydrate.bench.test.js.map