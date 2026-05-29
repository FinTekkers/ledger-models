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
const util_1 = require("util");
const security_service_grpc_pb_1 = require("../../fintekkers/services/security-service/security_service_grpc_pb");
const portfolio_service_grpc_pb_1 = require("../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb");
const query_security_request_pb_1 = require("../../fintekkers/requests/security/query_security_request_pb");
const query_portfolio_request_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_request_pb");
const security_1 = __importDefault(require("../models/security/security"));
const portfolio_1 = __importDefault(require("../models/portfolio/portfolio"));
const uuid_1 = require("../models/utils/uuid");
const requestcontext_1 = __importDefault(require("../models/utils/requestcontext"));
const datetime_1 = require("../models/utils/datetime");
const LinkCacheModule = __importStar(require("./link-cache"));
/**
 * Stable serialization of a LocalTimestampProto for use in in-flight dedup
 * keys and as_of-bucket grouping. Uses the proto's binary form (Uint8Array
 * → base64). Returns the literal "latest" when as_of is undefined so
 * unset and explicit-undefined collapse to the same bucket.
 */
function asOfKey(asOf) {
    if (!asOf)
        return 'latest';
    const bytes = asOf.serializeBinary();
    return Buffer.from(bytes).toString('base64');
}
function asOfToZdt(asOf) {
    return asOf ? new datetime_1.ZonedDateTime(asOf) : null;
}
// Process-wide default singleton — lazily constructed on first
// `LinkResolver.getDefault()` call. Used by the wrapper `hydrate()`
// methods so callers don't have to thread a resolver instance through
// their code. Override the default by calling `LinkResolver.setDefault(...)`
// at process start (tests with mocked clients, alternate endpoints, etc.).
let defaultLinkResolver;
class LinkResolver {
    /**
     * Process-wide singleton — lazily constructed with default options
     * (env-derived endpoint via `EnvConfig`). The wrapper `hydrate()`
     * methods reach for this when no resolver is passed explicitly, so
     * users get auto-resolve on link-mode wrappers without threading a
     * resolver through every call site.
     */
    static getDefault() {
        if (!defaultLinkResolver) {
            defaultLinkResolver = new LinkResolver();
        }
        return defaultLinkResolver;
    }
    /**
     * Replace the process-wide default. Call once at process start for
     * tests with mocked clients or to point at a non-default endpoint.
     * Pass `undefined` to clear (next `getDefault()` call rebuilds).
     */
    static setDefault(resolver) {
        defaultLinkResolver = resolver;
    }
    constructor(opts = {}) {
        // Concurrent-call dedupe: a UUID currently being fetched maps to the
        // promise the *first* caller is awaiting. Subsequent callers for the
        // same UUID receive that same promise.
        this.securityInFlight = new Map();
        this.portfolioInFlight = new Map();
        if (opts.securityClient) {
            this.securityClient = opts.securityClient;
        }
        else if (opts.apiKey) {
            const { credentials, interceptors } = requestcontext_1.default.getAuthenticatedClientOptions(opts.apiKey);
            this.securityClient = new security_service_grpc_pb_1.SecurityClient(requestcontext_1.default.apiURL, credentials, { interceptors });
        }
        else {
            this.securityClient = new security_service_grpc_pb_1.SecurityClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
        }
        if (opts.portfolioClient) {
            this.portfolioClient = opts.portfolioClient;
        }
        else if (opts.apiKey) {
            const { credentials, interceptors } = requestcontext_1.default.getAuthenticatedClientOptions(opts.apiKey);
            this.portfolioClient = new portfolio_service_grpc_pb_1.PortfolioClient(requestcontext_1.default.apiURL, credentials, { interceptors });
        }
        else {
            this.portfolioClient = new portfolio_service_grpc_pb_1.PortfolioClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
        }
    }
    /**
     * Resolve a single SecurityProto by UUID. If `asOf` is supplied, fetch
     * the version of the entity as of that timestamp; otherwise fetch the
     * latest. Cached + concurrent-deduped on the (uuid, asOf) pair.
     * Throws if the server doesn't return the UUID (no silent null).
     */
    getSecurity(uuid, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const proto = yield this.fetchSecurityProto(uuid, asOf);
            return security_1.default.create(proto);
        });
    }
    /**
     * Resolve a single PortfolioProto by UUID, optionally as of `asOf`.
     * Cached + concurrent-deduped on (uuid, asOf).
     */
    getPortfolio(uuid, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const proto = yield this.fetchPortfolioProto(uuid, asOf);
            return new portfolio_1.default(proto);
        });
    }
    /**
     * Walk `items`, find the ones whose embedded security is `is_link=true`,
     * batch-fetch the unique (uuid, as_of) pairs (grouped by as_of so each
     * GetByIds RPC carries one timestamp), and mutate each item's proto in
     * place so subsequent `item.getSecurity()` calls return the full entity.
     * Returns the same array for chaining.
     *
     * `T` is structural: anything with a `proto` field that exposes
     * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
     */
    resolveSecurities(items) {
        return __awaiter(this, void 0, void 0, function* () {
            if (items.length === 0)
                return items;
            // Group: as_of bucket → (uuid string → UUID) for items not yet cached.
            const buckets = new Map();
            for (const item of items) {
                const sec = item.proto.getSecurity();
                if (!sec || !sec.getIsLink())
                    continue;
                const uuidProto = sec.getUuid();
                if (!uuidProto)
                    continue;
                const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
                const asOf = sec.getAsOf();
                const uuidStr = uuid.toString();
                if (LinkCacheModule.SECURITY.get(uuidStr, asOfToZdt(asOf)))
                    continue;
                const bucketKey = asOfKey(asOf);
                let bucket = buckets.get(bucketKey);
                if (!bucket) {
                    bucket = new Map();
                    buckets.set(bucketKey, bucket);
                }
                if (!bucket.has(uuidStr))
                    bucket.set(uuidStr, uuid);
            }
            // One GetByIds RPC per as_of bucket. Fire in parallel.
            yield Promise.all(Array.from(buckets.entries()).map(([bucketKey, uuidMap]) => __awaiter(this, void 0, void 0, function* () {
                const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (proto) => proto.getSecurity(), bucketKey);
                const asOfZdt = asOfToZdt(asOf);
                const fetched = yield this.batchFetchSecurities(Array.from(uuidMap.values()), asOf);
                for (const proto of fetched) {
                    const uuidProto = proto.getUuid();
                    if (!uuidProto)
                        continue;
                    const uuidStr = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    LinkCacheModule.SECURITY.put(uuidStr, proto, asOfZdt);
                }
            })));
            // Mutate each item's embedded security in place.
            for (const item of items) {
                const sec = item.proto.getSecurity();
                if (!sec || !sec.getIsLink())
                    continue;
                const uuidProto = sec.getUuid();
                if (!uuidProto)
                    continue;
                const uuidStr = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                const resolved = LinkCacheModule.SECURITY.get(uuidStr, asOfToZdt(sec.getAsOf()));
                if (resolved)
                    item.proto.setSecurity(resolved);
            }
            return items;
        });
    }
    /**
     * Same shape as resolveSecurities, but for embedded PortfolioProto.
     * Honors per-link `as_of` the same way.
     */
    resolvePortfolios(items) {
        return __awaiter(this, void 0, void 0, function* () {
            if (items.length === 0)
                return items;
            const buckets = new Map();
            for (const item of items) {
                const port = item.proto.getPortfolio();
                if (!port || !port.getIsLink())
                    continue;
                const uuidProto = port.getUuid();
                if (!uuidProto)
                    continue;
                const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
                const asOf = port.getAsOf();
                const uuidStr = uuid.toString();
                if (LinkCacheModule.PORTFOLIO.get(uuidStr, asOfToZdt(asOf)))
                    continue;
                const bucketKey = asOfKey(asOf);
                let bucket = buckets.get(bucketKey);
                if (!bucket) {
                    bucket = new Map();
                    buckets.set(bucketKey, bucket);
                }
                if (!bucket.has(uuidStr))
                    bucket.set(uuidStr, uuid);
            }
            yield Promise.all(Array.from(buckets.entries()).map(([bucketKey, uuidMap]) => __awaiter(this, void 0, void 0, function* () {
                const asOf = bucketKey === 'latest' ? undefined : findAsOfForBucket(items, (proto) => proto.getPortfolio(), bucketKey);
                const asOfZdt = asOfToZdt(asOf);
                const fetched = yield this.batchFetchPortfolios(Array.from(uuidMap.values()), asOf);
                for (const proto of fetched) {
                    const uuidProto = proto.getUuid();
                    if (!uuidProto)
                        continue;
                    const uuidStr = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    LinkCacheModule.PORTFOLIO.put(uuidStr, proto, asOfZdt);
                }
            })));
            for (const item of items) {
                const port = item.proto.getPortfolio();
                if (!port || !port.getIsLink())
                    continue;
                const uuidProto = port.getUuid();
                if (!uuidProto)
                    continue;
                const uuidStr = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                const resolved = LinkCacheModule.PORTFOLIO.get(uuidStr, asOfToZdt(port.getAsOf()));
                if (resolved)
                    item.proto.setPortfolio(resolved);
            }
            return items;
        });
    }
    /** Test/debug helper. Clears in-flight maps; the process-wide LinkCache
     * is left alone (tests that need to drop a specific cached entry call
     * `LinkCache.SECURITY.evict(uuid)` directly). */
    clearCache() {
        this.securityInFlight.clear();
        this.portfolioInFlight.clear();
    }
    // ---------- internals ----------
    fetchSecurityProto(uuid, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const uuidStr = uuid.toString();
            const asOfZdt = asOfToZdt(asOf);
            const cached = LinkCacheModule.SECURITY.get(uuidStr, asOfZdt);
            if (cached)
                return cached;
            const key = `${uuidStr}@${asOfKey(asOf)}`;
            const inFlight = this.securityInFlight.get(key);
            if (inFlight)
                return inFlight;
            const promise = this.batchFetchSecurities([uuid], asOf).then((protos) => {
                if (protos.length === 0) {
                    throw new Error(`Security not found: ${key}`);
                }
                const proto = protos[0];
                LinkCacheModule.SECURITY.put(uuidStr, proto, asOfZdt);
                return proto;
            }).finally(() => {
                this.securityInFlight.delete(key);
            });
            this.securityInFlight.set(key, promise);
            return promise;
        });
    }
    fetchPortfolioProto(uuid, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const uuidStr = uuid.toString();
            const asOfZdt = asOfToZdt(asOf);
            const cached = LinkCacheModule.PORTFOLIO.get(uuidStr, asOfZdt);
            if (cached)
                return cached;
            const key = `${uuidStr}@${asOfKey(asOf)}`;
            const inFlight = this.portfolioInFlight.get(key);
            if (inFlight)
                return inFlight;
            const promise = this.batchFetchPortfolios([uuid], asOf).then((protos) => {
                if (protos.length === 0) {
                    throw new Error(`Portfolio not found: ${key}`);
                }
                const proto = protos[0];
                LinkCacheModule.PORTFOLIO.put(uuidStr, proto, asOfZdt);
                return proto;
            }).finally(() => {
                this.portfolioInFlight.delete(key);
            });
            this.portfolioInFlight.set(key, promise);
            return promise;
        });
    }
    batchFetchSecurities(uuids, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uuids.length === 0)
                return [];
            const request = new query_security_request_pb_1.QuerySecurityRequestProto();
            request.setObjectClass('SecurityRequest');
            request.setVersion('0.0.1');
            const uuidProtos = uuids.map((u) => u.toUUIDProto());
            request.setUuidsList(uuidProtos);
            if (asOf)
                request.setAsOf(asOf);
            const getByIdsAsync = (0, util_1.promisify)(this.securityClient.getByIds.bind(this.securityClient));
            const response = (yield getByIdsAsync(request));
            return response.getSecurityResponseList();
        });
    }
    batchFetchPortfolios(uuids, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uuids.length === 0)
                return [];
            const request = new query_portfolio_request_pb_1.QueryPortfolioRequestProto();
            request.setObjectClass('PortfolioRequest');
            request.setVersion('0.0.1');
            const uuidProtos = uuids.map((u) => u.toUUIDProto());
            request.setUuidsList(uuidProtos);
            if (asOf)
                request.setAsOf(asOf);
            const getByIdsAsync = (0, util_1.promisify)(this.portfolioClient.getByIds.bind(this.portfolioClient));
            const response = (yield getByIdsAsync(request));
            return response.getPortfolioResponseList();
        });
    }
}
/**
 * Walk `items` and return the first sub-message's as_of whose serialized
 * key matches `bucketKey`. Used by the bulk resolvers to recover the
 * canonical LocalTimestampProto instance for a bucket.
 */
function findAsOfForBucket(items, read, bucketKey) {
    for (const item of items) {
        const sub = read(item.proto);
        if (!sub || !sub.getIsLink())
            continue;
        const asOf = sub.getAsOf();
        if (asOfKey(asOf) === bucketKey)
            return asOf;
    }
    return undefined;
}
exports.default = LinkResolver;
//# sourceMappingURL=link-resolver.js.map