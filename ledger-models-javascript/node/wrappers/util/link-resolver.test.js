"use strict";
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
const link_resolver_1 = __importDefault(require("./link-resolver"));
const Price_1 = __importDefault(require("../models/price/Price"));
const uuid_1 = require("../models/utils/uuid");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const decimal_value_pb_1 = require("../../fintekkers/models/util/decimal_value_pb");
const identifier_pb_1 = require("../../fintekkers/models/security/identifier/identifier_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
function newCallLog() {
    return { count: 0, uuids: [], asOfSeconds: [] };
}
// Minimal mock for the security gRPC client. The LinkResolver only calls
// `getByIds`; we node-style invoke the callback with a fake response built
// from a pre-canned UUID → SecurityProto map. The mock also records each
// call's as_of (in seconds since epoch, or null if unset) so tests can
// assert per-bucket RPC behavior.
function mockSecurityClient(store, callLog) {
    return {
        getByIds: (request, callback) => {
            var _a, _b;
            const uuidProtos = request.getUuidsList();
            const requestedUuids = uuidProtos.map((u) => uuid_1.UUID.fromU8Array(u.getRawUuid_asU8()).toString());
            callLog.count += 1;
            callLog.uuids.push(requestedUuids);
            const asOf = request.getAsOf();
            callLog.asOfSeconds.push((_b = (_a = asOf === null || asOf === void 0 ? void 0 : asOf.getTimestamp()) === null || _a === void 0 ? void 0 : _a.getSeconds()) !== null && _b !== void 0 ? _b : null);
            const response = new query_security_response_pb_1.QuerySecurityResponseProto();
            const found = [];
            for (const u of requestedUuids) {
                const proto = store.get(u);
                if (proto)
                    found.push(proto);
            }
            response.setSecurityResponseList(found);
            // Schedule async like a real gRPC client would.
            setImmediate(() => callback(null, response));
        },
    };
}
function mockPortfolioClient(store, callLog) {
    return {
        getByIds: (request, callback) => {
            var _a, _b;
            const uuidProtos = request.getUuidsList();
            const requestedUuids = uuidProtos.map((u) => uuid_1.UUID.fromU8Array(u.getRawUuid_asU8()).toString());
            callLog.count += 1;
            callLog.uuids.push(requestedUuids);
            const asOf = request.getAsOf();
            callLog.asOfSeconds.push((_b = (_a = asOf === null || asOf === void 0 ? void 0 : asOf.getTimestamp()) === null || _a === void 0 ? void 0 : _a.getSeconds()) !== null && _b !== void 0 ? _b : null);
            const response = new query_portfolio_response_pb_1.QueryPortfolioResponseProto();
            const found = [];
            for (const u of requestedUuids) {
                const proto = store.get(u);
                if (proto)
                    found.push(proto);
            }
            response.setPortfolioResponseList(found);
            setImmediate(() => callback(null, response));
        },
    };
}
function makeAsOf(epochSeconds) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(epochSeconds);
    ts.setNanos(0);
    const lt = new local_timestamp_pb_1.LocalTimestampProto();
    lt.setTimestamp(ts);
    lt.setTimeZone('UTC');
    return lt;
}
function fullSecurity(uuid, issuerName) {
    const proto = new security_pb_1.SecurityProto();
    proto.setObjectClass('Security');
    proto.setVersion('0.0.1');
    proto.setUuid(uuid.toUUIDProto());
    proto.setIsLink(false);
    proto.setIssuerName(issuerName);
    const ident = new identifier_pb_1.IdentifierProto();
    ident.setIdentifierValue(`TICKER-${issuerName}`);
    proto.setIdentifiersList([ident]);
    return proto;
}
function linkPrice(securityUuid, priceValue, asOf) {
    const linkSec = new security_pb_1.SecurityProto();
    linkSec.setUuid(securityUuid.toUUIDProto());
    linkSec.setIsLink(true);
    if (asOf)
        linkSec.setAsOf(asOf);
    const priceProto = new price_pb_1.PriceProto();
    priceProto.setObjectClass('Price');
    priceProto.setVersion('0.0.1');
    priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    priceProto.setSecurity(linkSec);
    const dv = new decimal_value_pb_1.DecimalValueProto();
    dv.setArbitraryPrecisionValue(priceValue);
    priceProto.setPrice(dv);
    return new Price_1.default(priceProto);
}
describe('LinkResolver', () => {
    test('bulk resolveSecurities dedupes UUIDs (5 prices, 3 unique → 1 RPC, 3 UUIDs)', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuidA = uuid_1.UUID.random();
        const uuidB = uuid_1.UUID.random();
        const uuidC = uuid_1.UUID.random();
        const store = new Map([
            [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
            [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
            [uuidC.toString(), fullSecurity(uuidC, 'GOOG')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const prices = [
            linkPrice(uuidA, '100'),
            linkPrice(uuidA, '101'),
            linkPrice(uuidB, '200'),
            linkPrice(uuidA, '102'),
            linkPrice(uuidC, '300'),
        ];
        yield resolver.resolveSecurities(prices);
        expect(callLog.count).toBe(1);
        expect(callLog.uuids[0].length).toBe(3);
        expect(new Set(callLog.uuids[0])).toEqual(new Set([uuidA.toString(), uuidB.toString(), uuidC.toString()]));
        // Each price's embedded security is now hydrated.
        for (const p of prices) {
            expect(p.proto.getSecurity().getIsLink()).toBe(false);
            expect(p.proto.getSecurity().getIssuerName().length).toBeGreaterThan(0);
        }
    }));
    test('cache hit: second getSecurity call for the same UUID does not re-RPC', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const sec1 = yield resolver.getSecurity(uuid);
        const sec2 = yield resolver.getSecurity(uuid);
        expect(callLog.count).toBe(1);
        expect(sec1.getIssuerName()).toBe('AAPL');
        expect(sec2.getIssuerName()).toBe('AAPL');
    }));
    test('concurrent same-UUID requests collapse to one RPC', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        // Fire N parallel calls for the same UUID before any resolves.
        const results = yield Promise.all([
            resolver.getSecurity(uuid),
            resolver.getSecurity(uuid),
            resolver.getSecurity(uuid),
            resolver.getSecurity(uuid),
        ]);
        expect(callLog.count).toBe(1);
        for (const r of results)
            expect(r.getIssuerName()).toBe('AAPL');
    }));
    test('caching disabled (cacheSize=0) re-RPCs every call', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            cacheSize: 0,
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        yield resolver.getSecurity(uuid);
        yield resolver.getSecurity(uuid);
        expect(callLog.count).toBe(2);
    }));
    test('non-link items pass through unchanged (resolveSecurities is a no-op for them)', () => __awaiter(void 0, void 0, void 0, function* () {
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(new Map(), callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        // Build a Price whose embedded Security is NOT a link (full entity).
        const fullSec = fullSecurity(uuid_1.UUID.random(), 'AAPL');
        const priceProto = new price_pb_1.PriceProto();
        priceProto.setObjectClass('Price');
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        priceProto.setSecurity(fullSec);
        const dv = new decimal_value_pb_1.DecimalValueProto();
        dv.setArbitraryPrecisionValue('100');
        priceProto.setPrice(dv);
        const price = new Price_1.default(priceProto);
        yield resolver.resolveSecurities([price]);
        expect(callLog.count).toBe(0);
        expect(price.proto.getSecurity().getIssuerName()).toBe('AAPL');
    }));
    test('resolveSecurities skips items missing security', () => __awaiter(void 0, void 0, void 0, function* () {
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(new Map(), callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const priceProto = new price_pb_1.PriceProto();
        priceProto.setObjectClass('Price');
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        // No security set on this price.
        const dv = new decimal_value_pb_1.DecimalValueProto();
        dv.setArbitraryPrecisionValue('100');
        priceProto.setPrice(dv);
        const price = new Price_1.default(priceProto);
        yield resolver.resolveSecurities([price]);
        expect(callLog.count).toBe(0);
    }));
    test('cache cross-call: a second resolveSecurities call reuses the cache from the first', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuidA = uuid_1.UUID.random();
        const uuidB = uuid_1.UUID.random();
        const store = new Map([
            [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
            [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        // First call: 2 unique UUIDs → 1 RPC fetching both.
        yield resolver.resolveSecurities([linkPrice(uuidA, '1'), linkPrice(uuidB, '2')]);
        expect(callLog.count).toBe(1);
        expect(callLog.uuids[0].length).toBe(2);
        // Second call: both UUIDs already cached → 0 additional RPCs.
        yield resolver.resolveSecurities([linkPrice(uuidA, '3'), linkPrice(uuidB, '4')]);
        expect(callLog.count).toBe(1);
    }));
    // ---------- as_of-aware behavior (per is_link_pattern.md addendum) ----------
    test('link without as_of → request omits as_of (server returns latest)', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        yield resolver.resolveSecurities([linkPrice(uuid, '1')]);
        expect(callLog.count).toBe(1);
        expect(callLog.asOfSeconds[0]).toBeNull();
    }));
    test('link with as_of → request carries that as_of', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const t1 = makeAsOf(1700000000);
        yield resolver.resolveSecurities([linkPrice(uuid, '1', t1)]);
        expect(callLog.count).toBe(1);
        expect(callLog.asOfSeconds[0]).toBe(1700000000);
    }));
    test('two as_of buckets for the same UUID → 2 separate RPCs (one per bucket)', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const t1 = makeAsOf(1700000000);
        const t2 = makeAsOf(1800000000);
        yield resolver.resolveSecurities([
            linkPrice(uuid, '1', t1),
            linkPrice(uuid, '2', t2),
        ]);
        expect(callLog.count).toBe(2);
        expect(new Set(callLog.asOfSeconds)).toEqual(new Set([1700000000, 1800000000]));
    }));
    test('same as_of for the same UUID → still 1 RPC (proper bucket dedupe)', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const t1a = makeAsOf(1700000000);
        const t1b = makeAsOf(1700000000); // same moment, different proto instance
        yield resolver.resolveSecurities([
            linkPrice(uuid, '1', t1a),
            linkPrice(uuid, '2', t1b),
        ]);
        expect(callLog.count).toBe(1);
        expect(callLog.uuids[0]).toEqual([uuid.toString()]);
    }));
    test('cache key includes as_of: latest cached does NOT serve a t1 lookup, and vice versa', () => __awaiter(void 0, void 0, void 0, function* () {
        const uuid = uuid_1.UUID.random();
        const store = new Map([
            [uuid.toString(), fullSecurity(uuid, 'AAPL')],
        ]);
        const callLog = newCallLog();
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
        });
        const t1 = makeAsOf(1700000000);
        // First: latest. RPC fired.
        yield resolver.getSecurity(uuid);
        expect(callLog.count).toBe(1);
        expect(callLog.asOfSeconds[0]).toBeNull();
        // Second: as_of=t1. Should NOT be served by the "latest" cache → another RPC.
        yield resolver.getSecurity(uuid, t1);
        expect(callLog.count).toBe(2);
        expect(callLog.asOfSeconds[1]).toBe(1700000000);
        // Third: same (uuid, t1) → cache hit, no new RPC.
        yield resolver.getSecurity(uuid, makeAsOf(1700000000));
        expect(callLog.count).toBe(2);
    }));
});
//# sourceMappingURL=link-resolver.test.js.map