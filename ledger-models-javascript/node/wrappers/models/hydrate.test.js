"use strict";
// Tests for the W1 async `hydrate()` method on Security/Portfolio wrappers
// and the LinkResolver default singleton.
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
const uuid_1 = require("./utils/uuid");
const datetime_1 = require("./utils/datetime");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
const security_1 = __importDefault(require("./security/security"));
const portfolio_1 = __importDefault(require("./portfolio/portfolio"));
const link_resolver_1 = __importDefault(require("../util/link-resolver"));
const LinkCacheModule = __importStar(require("../util/link-cache"));
function makeAsOf(seconds = 1700000000) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(seconds);
    ts.setNanos(0);
    const proto = new local_timestamp_pb_1.LocalTimestampProto();
    proto.setTimestamp(ts);
    proto.setTimeZone('UTC');
    return proto;
}
function fullSecurityProto(uuid, asOf, issuer) {
    const p = new security_pb_1.SecurityProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf);
    p.setIssuerName(issuer);
    return p;
}
function fullPortfolioProto(uuid, asOf, name) {
    const p = new portfolio_pb_1.PortfolioProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf);
    p.setPortfolioName(name);
    return p;
}
// Stub clients that return canned protos for GetByIds. The
// `LinkResolverOptions.{security,portfolio}Client` slots expect the full
// generated client class; we only implement the one method LinkResolver
// uses and assert the shape to the public client type at the injection
// site — keeps the test typed end-to-end without re-stubbing dozens of
// grpc.Client methods.
function stubSecurityClient(canned) {
    const stub = {
        getByIds(_req, cb) {
            const resp = new query_security_response_pb_1.QuerySecurityResponseProto();
            resp.setSecurityResponseList([canned]);
            cb(null, resp);
        },
    };
    return stub;
}
function stubPortfolioClient(canned) {
    const stub = {
        getByIds(_req, cb) {
            const resp = new query_portfolio_response_pb_1.QueryPortfolioResponseProto();
            resp.setPortfolioResponseList([canned]);
            cb(null, resp);
        },
    };
    return stub;
}
/** Stand-in for the "other" client slot in `LinkResolverOptions` when a
 * test only exercises one entity type — never invoked, but the option is
 * required by the constructor. */
function unusedSecurityClient() {
    return {
        getByIds() {
            throw new Error('unused stub: security client should not be called');
        },
    };
}
function unusedPortfolioClient() {
    return {
        getByIds() {
            throw new Error('unused stub: portfolio client should not be called');
        },
    };
}
beforeEach(() => {
    LinkCacheModule.SECURITY.clear();
    LinkCacheModule.PORTFOLIO.clear();
    link_resolver_1.default.setDefault(undefined);
});
afterEach(() => {
    link_resolver_1.default.setDefault(undefined);
});
// ---- LinkResolver default singleton ----
test('LinkResolver.getDefault returns a stable singleton until cleared', () => {
    const a = link_resolver_1.default.getDefault();
    const b = link_resolver_1.default.getDefault();
    expect(a).toBe(b);
    link_resolver_1.default.setDefault(undefined);
    const c = link_resolver_1.default.getDefault();
    expect(c).not.toBe(a);
});
test('LinkResolver.setDefault overrides the singleton', () => {
    const custom = new link_resolver_1.default();
    link_resolver_1.default.setDefault(custom);
    expect(link_resolver_1.default.getDefault()).toBe(custom);
});
// ---- Security.hydrate ----
test('Security.hydrate() on a non-link wrapper is a no-op', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(1);
    const sec = new security_1.default(fullSecurityProto(uuid, asOf, 'NOT-LINKED'));
    // No resolver registered — would throw if hydrate tried to fetch.
    yield sec.hydrate();
    expect(sec.getIssuerName()).toBe('NOT-LINKED');
}));
test('Security.hydrate() fetches via the default resolver and swaps the proto', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(2);
    const resolved = fullSecurityProto(uuid, asOf, 'FROM-RESOLVER');
    const customResolver = new link_resolver_1.default({
        securityClient: stubSecurityClient(resolved),
        portfolioClient: unusedPortfolioClient(),
    });
    link_resolver_1.default.setDefault(customResolver);
    const sec = new security_1.default(security_1.default.linkOf(uuid, new datetime_1.ZonedDateTime(asOf)));
    expect(sec.isLink()).toBe(true);
    yield sec.hydrate();
    expect(sec.getIssuerName()).toBe('FROM-RESOLVER');
    // After hydrate, accessor reads are sync — the proto has been swapped.
    expect(sec.proto.getIsLink()).toBe(false);
}));
test('Security.hydrate() accepts an explicit resolver instead of the default', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(3);
    const resolved = fullSecurityProto(uuid, asOf, 'EXPLICIT');
    const explicit = new link_resolver_1.default({
        securityClient: stubSecurityClient(resolved),
        portfolioClient: unusedPortfolioClient(),
    });
    const sec = new security_1.default(security_1.default.linkOf(uuid, new datetime_1.ZonedDateTime(asOf)));
    yield sec.hydrate(explicit);
    expect(sec.getIssuerName()).toBe('EXPLICIT');
}));
// ---- Portfolio.hydrate ----
test('Portfolio.hydrate() fetches via the default resolver and swaps the proto', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(4);
    const resolved = fullPortfolioProto(uuid, asOf, 'Strategy Z');
    const customResolver = new link_resolver_1.default({
        securityClient: unusedSecurityClient(),
        portfolioClient: stubPortfolioClient(resolved),
    });
    link_resolver_1.default.setDefault(customResolver);
    // Build a link Portfolio (no static helper on Portfolio; construct manually).
    const linkProto = new portfolio_pb_1.PortfolioProto();
    linkProto.setUuid(uuid.toUUIDProto());
    linkProto.setAsOf(asOf);
    linkProto.setIsLink(true);
    const p = new portfolio_1.default(linkProto);
    expect(p.isLink()).toBe(true);
    yield p.hydrate();
    expect(p.getPortfolioName()).toBe('Strategy Z');
}));
test('Portfolio.hydrate() on a non-link wrapper is a no-op', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(5);
    const p = new portfolio_1.default(fullPortfolioProto(uuid, asOf, 'Already Full'));
    yield p.hydrate();
    expect(p.getPortfolioName()).toBe('Already Full');
}));
//# sourceMappingURL=hydrate.test.js.map