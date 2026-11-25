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
exports.PriceService = exports.PriceSearchError = exports.MAX_SEARCH_RESULTS = void 0;
const util_1 = require("util");
const Price_1 = __importDefault(require("../../models/price/Price"));
const positionfilter_1 = require("../../models/position/positionfilter");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const date_range_pb_1 = require("../../../fintekkers/models/util/date_range_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const price_service_grpc_pb_1 = require("../../../fintekkers/services/price-service/price_service_grpc_pb");
const query_price_request_pb_1 = require("../../../fintekkers/requests/price/query_price_request_pb");
const create_price_request_pb_1 = require("../../../fintekkers/requests/price/create_price_request_pb");
const uuid_1 = require("../../models/utils/uuid");
const dt = __importStar(require("../../models/utils/datetime"));
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
const serviceaddress_1 = require("../../util/serviceaddress");
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const object_type_pb_1 = require("../../../fintekkers/models/util/object_type_pb");
const object_types_1 = require("../../util/object-types");
/** The largest `limit` searchRange sends on one request. */
exports.MAX_SEARCH_RESULTS = 10000;
class PriceSearchError extends Error {
    constructor(code, messages) {
        super(`${code}: ${messages.join('; ')}`);
        this.name = 'PriceSearchError';
        this.code = code;
        this.messages = messages;
        Object.setPrototypeOf(this, PriceSearchError.prototype);
    }
}
exports.PriceSearchError = PriceSearchError;
const NANOS_PER_SECOND = BigInt(1000000000);
function toNanos(ts) {
    const timestamp = ts.getTimestamp();
    if (!timestamp) {
        throw new PriceSearchError('INVALID_ARGUMENT', ['start and end need a timestamp']);
    }
    return BigInt(timestamp.getSeconds()) * NANOS_PER_SECOND + BigInt(timestamp.getNanos());
}
/** `like` with its timestamp set to `nanos`; the time zone is kept. */
function fromNanos(nanos, like) {
    // Floor division: Timestamp nanos are never negative, even before 1970.
    let seconds = nanos / NANOS_PER_SECOND;
    let rest = nanos % NANOS_PER_SECOND;
    if (rest < BigInt(0)) {
        rest += NANOS_PER_SECOND;
        seconds -= BigInt(1);
    }
    const timestamp = new timestamp_pb_1.Timestamp();
    timestamp.setSeconds(Number(seconds));
    timestamp.setNanos(Number(rest));
    return like.cloneMessage().setTimestamp(timestamp);
}
function messageText(detail) {
    return (detail === null || detail === void 0 ? void 0 : detail.getMessageForDeveloper()) || (detail === null || detail === void 0 ? void 0 : detail.getMessageForUser()) || 'no message';
}
class PriceService {
    constructor(apiKey) {
        if (apiKey) {
            const { credentials, interceptors } = requestcontext_1.default.getAuthenticatedClientOptions(apiKey, serviceaddress_1.Service.PRICE);
            this.client = new price_service_grpc_pb_1.PriceClient(requestcontext_1.default.urlFor(serviceaddress_1.Service.PRICE), credentials, { interceptors });
        }
        else {
            this.client = new price_service_grpc_pb_1.PriceClient(requestcontext_1.default.urlFor(serviceaddress_1.Service.PRICE), requestcontext_1.default.credentialsFor(serviceaddress_1.Service.PRICE));
        }
    }
    close() {
        this.client.close();
    }
    validateCreateOrUpdate(price) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceProto = price instanceof Price_1.default ? price.proto : price;
            const createRequest = new create_price_request_pb_1.CreatePriceRequestProto();
            (0, object_types_1.stamp)(createRequest, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
            createRequest.setCreatePriceInput(priceProto);
            const validateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
            const response = yield validateAsync(createRequest);
            return response;
        });
    }
    createOrUpdate(price) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceProto = price instanceof Price_1.default ? price.proto : price;
            const createRequest = new create_price_request_pb_1.CreatePriceRequestProto();
            (0, object_types_1.stamp)(createRequest, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
            createRequest.setCreatePriceInput(priceProto);
            const createAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
            const response = yield createAsync(createRequest);
            // Write-through to LinkCache. price_response is a repeated field.
            for (const persisted of response.getPriceResponseList()) {
                const uuidProto = persisted.getUuid();
                const asOfProto = persisted.getAsOf();
                if (uuidProto && asOfProto) {
                    const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    LinkCacheModule.PRICE.put(uuidKey, persisted, new dt.ZonedDateTime(asOfProto));
                }
            }
            return response;
        });
    }
    searchPriceAsOfNow(positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = dt.ZonedDateTime.now().toProto();
            return this.search(now, positionFilter);
        });
    }
    /**
     * Search for prices matching the given filter, returning Price wrapper objects.
     */
    search(asOf, positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchRequest = new query_price_request_pb_1.QueryPriceRequestProto();
            (0, object_types_1.stamp)(searchRequest, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
            searchRequest.setAsOf(asOf);
            searchRequest.setSearchPriceInput(positionFilter.toProto());
            const tmpClient = this.client;
            const results = [];
            function processStreamSynchronously() {
                return __awaiter(this, void 0, void 0, function* () {
                    const stream = tmpClient.search(searchRequest);
                    return new Promise((resolve, reject) => {
                        stream.on('data', (response) => {
                            response.getPriceResponseList().forEach((priceProto) => {
                                results.push(new Price_1.default(priceProto));
                            });
                        });
                        stream.on('end', () => {
                            resolve(results);
                        });
                        stream.on('error', (err) => {
                            console.error('Error in the price stream:', err);
                            reject(err);
                        });
                    });
                });
            }
            return yield processStreamSynchronously();
        });
    }
    /**
     * Every price matching the filter with an as_of in [start, end], read in
     * chunks of at most `limit` rows (LM-494). search() sends no limit, so the
     * server applies its default cap and the caller silently gets the newest
     * rows only; this method never returns partial data.
     *
     * Each request sets `limit` and `date_range`. A window that comes back
     * full is discarded and split in half, until every window fits. Windows
     * never overlap and every split halves one, so the read always ends and
     * never asks for the same window twice.
     *
     * Rejects with PriceSearchError:
     * - INVALID_ARGUMENT: `limit` is not an integer in 1..MAX_SEARCH_RESULTS,
     *   or start is after end. No request is sent.
     * - SERVER_REPORTED: a response had an entry in errors_or_warnings.
     * - UNSPLITTABLE: more than `limit` prices share one timestamp.
     * - OUT_OF_RANGE: a window's rows include a price whose as_of is outside
     *   that window, so the server is not honouring date_range.
     * A gRPC stream error rejects unchanged, as in search().
     *
     * Server requirement: a server that returns fewer rows than asked must
     * say so with `truncated`, `row_cap` or `next_page_token`. A server that
     * cuts rows with none of those signals cannot be detected here.
     */
    searchRange(positionFilter, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (_a = options.limit) !== null && _a !== void 0 ? _a : exports.MAX_SEARCH_RESULTS;
            if (!Number.isInteger(limit) || limit < 1 || limit > exports.MAX_SEARCH_RESULTS) {
                throw new PriceSearchError('INVALID_ARGUMENT', [`limit must be an integer in 1..${exports.MAX_SEARCH_RESULTS}, got ${limit}`]);
            }
            const startNanos = toNanos(options.start);
            const endNanos = toNanos(options.end);
            if (startNanos > endNanos) {
                throw new PriceSearchError('INVALID_ARGUMENT', ['start is after end']);
            }
            const asOf = (_b = options.asOf) !== null && _b !== void 0 ? _b : dt.ZonedDateTime.now().toProto();
            const filterProto = positionFilter.toProto();
            const kept = [];
            // LIFO: the left half is pushed last, so windows finish oldest first.
            const windows = [[startNanos, endNanos]];
            while (windows.length > 0) {
                const [s, e] = windows.pop();
                const request = new query_price_request_pb_1.QueryPriceRequestProto();
                (0, object_types_1.stamp)(request, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
                request.setAsOf(asOf);
                request.setSearchPriceInput(filterProto);
                request.setLimit(limit);
                const dateRange = new date_range_pb_1.DateRangeProto();
                (0, object_types_1.stamp)(dateRange, object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_DATE_RANGE);
                dateRange.setStart(fromNanos(s, options.start));
                dateRange.setEnd(fromNanos(e, options.start));
                request.setDateRange(dateRange);
                const result = yield this.streamWindow(request);
                if (result.reported.length > 0) {
                    throw new PriceSearchError('SERVER_REPORTED', result.reported);
                }
                // A window holding exactly `limit` rows may have more, so it splits;
                // one timestamp cannot split, and without a cap signal it is complete.
                if (!result.capped && (result.prices.length < limit || s === e)) {
                    const outside = result.prices.find((p) => {
                        const at = p.getAsOf();
                        return (at === null || at === void 0 ? void 0 : at.getTimestamp()) !== undefined && (toNanos(at) < s || toNanos(at) > e);
                    });
                    if (outside) {
                        throw new PriceSearchError('OUT_OF_RANGE', ['the server returned a price outside the requested date_range']);
                    }
                    kept.push(...result.prices);
                    continue;
                }
                if (s === e) {
                    throw new PriceSearchError('UNSPLITTABLE', [`more than ${limit} prices at one timestamp`]);
                }
                const m = s + (e - s) / BigInt(2);
                windows.push([m + BigInt(1), e]);
                windows.push([s, m]);
            }
            // Windows are disjoint, so this de-dupe is only a safety net.
            const seen = new Set();
            const prices = [];
            for (const priceProto of kept) {
                const uuid = priceProto.getUuid();
                if (uuid) {
                    const key = uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8()).toString();
                    if (seen.has(key))
                        continue;
                    seen.add(key);
                }
                prices.push(new Price_1.default(priceProto));
            }
            return prices;
        });
    }
    /** Streams one searchRange window, collecting rows and server signals. */
    streamWindow(request) {
        const stream = this.client.search(request);
        const result = { prices: [], capped: false, reported: [] };
        return new Promise((resolve, reject) => {
            stream.on('data', (response) => {
                result.prices.push(...response.getPriceResponseList());
                if (response.getTruncated() || response.getRowCap() > 0 || response.getNextPageToken() !== '') {
                    result.capped = true;
                }
                const summary = response.getErrorsOrWarnings();
                if (summary) {
                    summary.getErrorsList().forEach((error) => result.reported.push(messageText(error.getDetail())));
                    summary.getWarningsList().forEach((warning) => result.reported.push(messageText(warning.getDetail())));
                }
            });
            stream.on('end', () => {
                resolve(result);
            });
            stream.on('error', (err) => {
                reject(err);
            });
        });
    }
    /**
     * Backward-compatible alias for search().
     */
    searchPrice(asOf, positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const prices = yield this.search(asOf, positionFilter);
            return prices.map(p => p.proto);
        });
    }
    /**
     * Search prices by security UUID string.
     * Convenience method so callers can write:
     *   priceService.searchBySecurityId('18e8c4e6-3da0-47c9-...')
     */
    searchBySecurityId(securityId, asOf) {
        return __awaiter(this, void 0, void 0, function* () {
            const effectiveAsOf = asOf !== null && asOf !== void 0 ? asOf : dt.ZonedDateTime.now().toProto();
            const securityUuid = new uuid_1.UUID(uuid_1.UUID.fromString(securityId));
            const filter = new positionfilter_1.PositionFilter()
                .addEqualsFilter(field_pb_1.FieldProto.SECURITY_ID, securityUuid);
            return this.search(effectiveAsOf, filter);
        });
    }
    /**
     * Search prices and hydrate each Price's embedded Security from link
     * to full entity in a single batched lookup. Equivalent to:
     *
     *   const prices = await priceService.search(asOf, filter);
     *   await new LinkResolver().resolveSecurities(prices);
     *
     * but with the LinkResolver instance reusable across calls (cache hits
     * benefit subsequent lookups).
     *
     * Pass a shared `linkResolver` to share caching across multiple
     * service-wrapper calls in the same request scope. If omitted, a new
     * resolver is constructed per call (no cross-call cache reuse).
     *
     * Mutates each returned Price.proto's embedded SecurityProto in place
     * (link → full). See LinkResolver for cache + dedupe semantics.
     */
    searchWithSecurities(asOf, positionFilter, linkResolver) {
        return __awaiter(this, void 0, void 0, function* () {
            const prices = yield this.search(asOf, positionFilter);
            const resolver = linkResolver !== null && linkResolver !== void 0 ? linkResolver : new link_resolver_1.default();
            yield resolver.resolveSecurities(prices);
            return prices;
        });
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=PriceService.js.map