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
exports.PriceService = void 0;
const util_1 = require("util");
const Price_1 = __importDefault(require("../../models/price/Price"));
const positionfilter_1 = require("../../models/position/positionfilter");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const price_service_grpc_pb_1 = require("../../../fintekkers/services/price-service/price_service_grpc_pb");
const query_price_request_pb_1 = require("../../../fintekkers/requests/price/query_price_request_pb");
const create_price_request_pb_1 = require("../../../fintekkers/requests/price/create_price_request_pb");
const uuid_1 = require("../../models/utils/uuid");
const dt = __importStar(require("../../models/utils/datetime"));
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
class PriceService {
    constructor(apiKey) {
        if (apiKey) {
            const { credentials, interceptors } = requestcontext_1.default.getAuthenticatedClientOptions(apiKey);
            this.client = new price_service_grpc_pb_1.PriceClient(requestcontext_1.default.apiURL, credentials, { interceptors });
        }
        else {
            this.client = new price_service_grpc_pb_1.PriceClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
        }
    }
    close() {
        this.client.close();
    }
    validateCreateOrUpdate(price) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceProto = price instanceof Price_1.default ? price.proto : price;
            const createRequest = new create_price_request_pb_1.CreatePriceRequestProto();
            createRequest.setObjectClass('PriceRequest');
            createRequest.setVersion('0.0.1');
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
            createRequest.setObjectClass('PriceRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setCreatePriceInput(priceProto);
            const createAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
            const response = yield createAsync(createRequest);
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
            searchRequest.setObjectClass('PriceRequest');
            searchRequest.setVersion('0.0.1');
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
}
exports.PriceService = PriceService;
//# sourceMappingURL=PriceService.js.map