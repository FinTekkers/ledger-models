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
const util_1 = require("util");
const security_service_grpc_pb_1 = require("../../fintekkers/services/security-service/security_service_grpc_pb");
const portfolio_service_grpc_pb_1 = require("../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb");
const query_security_request_pb_1 = require("../../fintekkers/requests/security/query_security_request_pb");
const query_portfolio_request_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_request_pb");
const security_1 = __importDefault(require("../models/security/security"));
const portfolio_1 = __importDefault(require("../models/portfolio/portfolio"));
const uuid_1 = require("../models/utils/uuid");
const requestcontext_1 = __importDefault(require("../models/utils/requestcontext"));
/**
 * Tiny LRU. Map keeps insertion order; on get-hit we delete + re-insert
 * to bump to the end (most recently used). On overflow we drop the
 * oldest entry (first key in the Map). Avoids pulling in lru-cache as a
 * dependency for ~30 lines of logic.
 */
class TinyLRU {
    constructor(maxSize, ttlMs) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this.map = new Map();
    }
    get(key) {
        if (this.maxSize === 0)
            return undefined;
        const entry = this.map.get(key);
        if (!entry)
            return undefined;
        if (this.ttlMs !== undefined && Date.now() - entry.insertedAt > this.ttlMs) {
            this.map.delete(key);
            return undefined;
        }
        // Bump to most-recently-used.
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }
    set(key, value) {
        if (this.maxSize === 0)
            return;
        if (this.map.has(key))
            this.map.delete(key);
        this.map.set(key, { value, insertedAt: Date.now() });
        while (this.map.size > this.maxSize) {
            const oldest = this.map.keys().next().value;
            if (oldest === undefined)
                break;
            this.map.delete(oldest);
        }
    }
    size() {
        return this.map.size;
    }
    clear() {
        this.map.clear();
    }
}
class LinkResolver {
    constructor(opts = {}) {
        var _a;
        // Concurrent-call dedupe: a UUID currently being fetched maps to the
        // promise the *first* caller is awaiting. Subsequent callers for the
        // same UUID receive that same promise.
        this.securityInFlight = new Map();
        this.portfolioInFlight = new Map();
        const cacheSize = (_a = opts.cacheSize) !== null && _a !== void 0 ? _a : 1000;
        const ttlMs = opts.ttlMs;
        this.securityCache = new TinyLRU(cacheSize, ttlMs);
        this.portfolioCache = new TinyLRU(cacheSize, ttlMs);
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
     * Resolve a single SecurityProto by UUID. Cached + concurrent-deduped.
     * Throws if the server doesn't return the UUID (no silent null).
     */
    getSecurity(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const proto = yield this.fetchSecurityProto(uuid);
            return security_1.default.create(proto);
        });
    }
    /**
     * Resolve a single PortfolioProto by UUID. Cached + concurrent-deduped.
     */
    getPortfolio(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const proto = yield this.fetchPortfolioProto(uuid);
            return new portfolio_1.default(proto);
        });
    }
    /**
     * Walk `items`, find the ones whose embedded security is `is_link=true`
     * (or unset), batch-fetch the unique UUIDs in one GetByIds RPC, and
     * mutate each item's proto in place so subsequent `item.getSecurity()`
     * calls return the full entity. Returns the same array for chaining.
     *
     * `T` is structural: anything with a `proto` field that exposes
     * `getSecurity()` / `setSecurity()` works (Price, Transaction, etc).
     */
    resolveSecurities(items) {
        return __awaiter(this, void 0, void 0, function* () {
            if (items.length === 0)
                return items;
            const uuidsToFetch = new Map();
            for (const item of items) {
                const sec = item.proto.getSecurity();
                if (!sec || !sec.getIsLink())
                    continue;
                const uuidProto = sec.getUuid();
                if (!uuidProto)
                    continue;
                const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
                const key = uuid.toString();
                // Skip if already cached.
                if (this.securityCache.get(key)) {
                    uuidsToFetch.delete(key);
                    continue;
                }
                if (!uuidsToFetch.has(key))
                    uuidsToFetch.set(key, uuid);
            }
            if (uuidsToFetch.size > 0) {
                const fetched = yield this.batchFetchSecurities(Array.from(uuidsToFetch.values()));
                for (const proto of fetched) {
                    const uuidProto = proto.getUuid();
                    if (!uuidProto)
                        continue;
                    const key = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    this.securityCache.set(key, proto);
                }
            }
            // Mutate each item's embedded security in place.
            for (const item of items) {
                const sec = item.proto.getSecurity();
                if (!sec || !sec.getIsLink())
                    continue;
                const uuidProto = sec.getUuid();
                if (!uuidProto)
                    continue;
                const key = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                const resolved = this.securityCache.get(key);
                if (resolved) {
                    item.proto.setSecurity(resolved);
                }
            }
            return items;
        });
    }
    /**
     * Same shape as resolveSecurities, but for embedded PortfolioProto.
     */
    resolvePortfolios(items) {
        return __awaiter(this, void 0, void 0, function* () {
            if (items.length === 0)
                return items;
            const uuidsToFetch = new Map();
            for (const item of items) {
                const port = item.proto.getPortfolio();
                if (!port || !port.getIsLink())
                    continue;
                const uuidProto = port.getUuid();
                if (!uuidProto)
                    continue;
                const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
                const key = uuid.toString();
                if (this.portfolioCache.get(key)) {
                    uuidsToFetch.delete(key);
                    continue;
                }
                if (!uuidsToFetch.has(key))
                    uuidsToFetch.set(key, uuid);
            }
            if (uuidsToFetch.size > 0) {
                const fetched = yield this.batchFetchPortfolios(Array.from(uuidsToFetch.values()));
                for (const proto of fetched) {
                    const uuidProto = proto.getUuid();
                    if (!uuidProto)
                        continue;
                    const key = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    this.portfolioCache.set(key, proto);
                }
            }
            for (const item of items) {
                const port = item.proto.getPortfolio();
                if (!port || !port.getIsLink())
                    continue;
                const uuidProto = port.getUuid();
                if (!uuidProto)
                    continue;
                const key = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                const resolved = this.portfolioCache.get(key);
                if (resolved) {
                    item.proto.setPortfolio(resolved);
                }
            }
            return items;
        });
    }
    /** Test/debug helper. Not part of the stable API. */
    clearCache() {
        this.securityCache.clear();
        this.portfolioCache.clear();
        this.securityInFlight.clear();
        this.portfolioInFlight.clear();
    }
    // ---------- internals ----------
    fetchSecurityProto(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = uuid.toString();
            const cached = this.securityCache.get(key);
            if (cached)
                return cached;
            const inFlight = this.securityInFlight.get(key);
            if (inFlight)
                return inFlight;
            const promise = this.batchFetchSecurities([uuid]).then((protos) => {
                if (protos.length === 0) {
                    throw new Error(`Security not found: ${key}`);
                }
                const proto = protos[0];
                this.securityCache.set(key, proto);
                return proto;
            }).finally(() => {
                this.securityInFlight.delete(key);
            });
            this.securityInFlight.set(key, promise);
            return promise;
        });
    }
    fetchPortfolioProto(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = uuid.toString();
            const cached = this.portfolioCache.get(key);
            if (cached)
                return cached;
            const inFlight = this.portfolioInFlight.get(key);
            if (inFlight)
                return inFlight;
            const promise = this.batchFetchPortfolios([uuid]).then((protos) => {
                if (protos.length === 0) {
                    throw new Error(`Portfolio not found: ${key}`);
                }
                const proto = protos[0];
                this.portfolioCache.set(key, proto);
                return proto;
            }).finally(() => {
                this.portfolioInFlight.delete(key);
            });
            this.portfolioInFlight.set(key, promise);
            return promise;
        });
    }
    batchFetchSecurities(uuids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uuids.length === 0)
                return [];
            const request = new query_security_request_pb_1.QuerySecurityRequestProto();
            request.setObjectClass('SecurityRequest');
            request.setVersion('0.0.1');
            const uuidProtos = uuids.map((u) => u.toUUIDProto());
            request.setUuidsList(uuidProtos);
            const getByIdsAsync = (0, util_1.promisify)(this.securityClient.getByIds.bind(this.securityClient));
            const response = (yield getByIdsAsync(request));
            return response.getSecurityResponseList();
        });
    }
    batchFetchPortfolios(uuids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uuids.length === 0)
                return [];
            const request = new query_portfolio_request_pb_1.QueryPortfolioRequestProto();
            request.setObjectClass('PortfolioRequest');
            request.setVersion('0.0.1');
            const uuidProtos = uuids.map((u) => u.toUUIDProto());
            request.setUuidsList(uuidProtos);
            const getByIdsAsync = (0, util_1.promisify)(this.portfolioClient.getByIds.bind(this.portfolioClient));
            const response = (yield getByIdsAsync(request));
            return response.getPortfolioResponseList();
        });
    }
}
exports.default = LinkResolver;
//# sourceMappingURL=link-resolver.js.map