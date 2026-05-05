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
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
// Minimal mock for the security gRPC client. The LinkResolver only calls
// `getByIds`; we node-style invoke the callback with a fake response built
// from a pre-canned UUID → SecurityProto map.
function mockSecurityClient(store, callLog) {
    return {
        getByIds: (request, callback) => {
            const uuidProtos = request.getUuidsList();
            const requestedUuids = uuidProtos.map((u) => uuid_1.UUID.fromU8Array(u.getRawUuid_asU8()).toString());
            callLog.count += 1;
            callLog.uuids.push(requestedUuids);
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
            const uuidProtos = request.getUuidsList();
            const requestedUuids = uuidProtos.map((u) => uuid_1.UUID.fromU8Array(u.getRawUuid_asU8()).toString());
            callLog.count += 1;
            callLog.uuids.push(requestedUuids);
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
function fullSecurity(uuid, issuerName) {
    const proto = new security_pb_1.SecurityProto();
    proto.setObjectClass('Security');
    proto.setVersion('0.0.1');
    proto.setUuid(uuid.toUUIDProto());
    proto.setIsLink(false);
    proto.setIssuerName(issuerName);
    const ident = new identifier_pb_1.IdentifierProto();
    ident.setIdentifierValue(`TICKER-${issuerName}`);
    proto.setIdentifier(ident);
    return proto;
}
function linkPrice(securityUuid, priceValue) {
    const linkSec = new security_pb_1.SecurityProto();
    linkSec.setUuid(securityUuid.toUUIDProto());
    linkSec.setIsLink(true);
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            cacheSize: 0,
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
        });
        yield resolver.getSecurity(uuid);
        yield resolver.getSecurity(uuid);
        expect(callLog.count).toBe(2);
    }));
    test('non-link items pass through unchanged (resolveSecurities is a no-op for them)', () => __awaiter(void 0, void 0, void 0, function* () {
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(new Map(), callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(new Map(), callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
        const callLog = { count: 0, uuids: [] };
        const resolver = new link_resolver_1.default({
            securityClient: mockSecurityClient(store, callLog),
            portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
        });
        // First call: 2 unique UUIDs → 1 RPC fetching both.
        yield resolver.resolveSecurities([linkPrice(uuidA, '1'), linkPrice(uuidB, '2')]);
        expect(callLog.count).toBe(1);
        expect(callLog.uuids[0].length).toBe(2);
        // Second call: both UUIDs already cached → 0 additional RPCs.
        yield resolver.resolveSecurities([linkPrice(uuidA, '3'), linkPrice(uuidB, '4')]);
        expect(callLog.count).toBe(1);
    }));
});
//# sourceMappingURL=link-resolver.test.js.map