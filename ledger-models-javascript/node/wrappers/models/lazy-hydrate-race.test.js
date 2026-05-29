"use strict";
// Concurrent-hydrate race test for Portfolio + Transaction wrappers.
// TypeScript has no shared-state threads, but Promise.all + a mock LinkResolver
// covers the same shape: N parallel `await wrapper.hydrate()` calls on
// wrappers that share a UUID. Contract:
//
//   1. Resolver's in-flight dedup collapses N hydrate() calls into one RPC.
//   2. Every awaiter sees the resolved proto.
//   3. The shared LinkCache singleton ends on the resolved entry.
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
const link_resolver_1 = __importDefault(require("../util/link-resolver"));
const LinkCacheModule = __importStar(require("../util/link-cache"));
const portfolio_1 = __importDefault(require("./portfolio/portfolio"));
const transaction_1 = __importDefault(require("./transaction/transaction"));
const uuid_1 = require("./utils/uuid");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
const query_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_response_pb");
function makeAsOf(seconds = 1700000000) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(seconds);
    ts.setNanos(0);
    const lt = new local_timestamp_pb_1.LocalTimestampProto();
    lt.setTimestamp(ts);
    lt.setTimeZone("UTC");
    return lt;
}
function mockPortfolioClient(resolved, log) {
    return {
        getByIds: (_req, cb) => {
            log.count++;
            const r = new query_portfolio_response_pb_1.QueryPortfolioResponseProto();
            r.setPortfolioResponseList([resolved]);
            setImmediate(() => cb(null, r));
        },
    };
}
function mockTransactionClient(resolved, log) {
    return {
        getByIds: (_req, cb) => {
            log.count++;
            const r = new query_transaction_response_pb_1.QueryTransactionResponseProto();
            r.setTransactionResponseList([resolved]);
            setImmediate(() => cb(null, r));
        },
    };
}
// Throw-on-call client for the unused entity types.
function throwingClient(name) {
    return {
        getByIds: () => {
            throw new Error(`${name} client should not be invoked in this test`);
        },
    };
}
describe("lazy hydrate — concurrent hydrate() collapses to one RPC", () => {
    beforeEach(() => {
        LinkCacheModule.SECURITY.clear();
        LinkCacheModule.PORTFOLIO.clear();
        LinkCacheModule.TRANSACTION.clear();
        link_resolver_1.default.setDefault(undefined);
    });
    test("Portfolio: 16 concurrent hydrate() calls → 1 RPC, all observe RESOLVED", () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const asOf = makeAsOf();
        const resolved = new portfolio_pb_1.PortfolioProto();
        resolved.setUuid(uuid.toUUIDProto());
        resolved.setAsOf(asOf);
        resolved.setIsLink(false);
        resolved.setPortfolioName("RESOLVED");
        const log = { count: 0 };
        const resolver = new link_resolver_1.default({
            portfolioClient: mockPortfolioClient(resolved, log),
            securityClient: throwingClient("security"),
            transactionClient: throwingClient("transaction"),
        });
        // Build 16 wrappers from the same link-mode proto.
        const linkProto = new portfolio_pb_1.PortfolioProto();
        linkProto.setUuid(uuid.toUUIDProto());
        linkProto.setAsOf(asOf);
        linkProto.setIsLink(true);
        const wrappers = Array.from({ length: 16 }, () => new portfolio_1.default(linkProto));
        const hydrated = yield Promise.all(wrappers.map((w) => w.hydrate(resolver)));
        expect(log.count).toBe(1);
        for (const w of hydrated) {
            expect(w.getPortfolioName()).toBe("RESOLVED");
        }
    }));
    test("Transaction: 16 concurrent hydrate() calls → 1 RPC, all observe resolved trade name", () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const asOf = makeAsOf();
        const resolved = new transaction_pb_1.TransactionProto();
        resolved.setUuid(uuid.toUUIDProto());
        resolved.setAsOf(asOf);
        resolved.setIsLink(false);
        resolved.setTradeName("RESOLVED-TRADE");
        const log = { count: 0 };
        const resolver = new link_resolver_1.default({
            transactionClient: mockTransactionClient(resolved, log),
            securityClient: throwingClient("security"),
            portfolioClient: throwingClient("portfolio"),
        });
        const linkProto = new transaction_pb_1.TransactionProto();
        linkProto.setUuid(uuid.toUUIDProto());
        linkProto.setAsOf(asOf);
        linkProto.setIsLink(true);
        const wrappers = Array.from({ length: 16 }, () => new transaction_1.default(linkProto));
        const hydrated = yield Promise.all(wrappers.map((w) => w.hydrate(resolver)));
        expect(log.count).toBe(1);
        for (const w of hydrated) {
            expect(w.proto.getTradeName()).toBe("RESOLVED-TRADE");
        }
    }));
});
//# sourceMappingURL=lazy-hydrate-race.test.js.map