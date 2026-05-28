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
exports.TransactionService = void 0;
const util_1 = require("util");
// Models
const transaction_1 = __importDefault(require("../../models/transaction/transaction"));
// Model Utils
// Requests & Services
const transaction_service_grpc_pb_1 = require("../../../fintekkers/services/transaction-service/transaction_service_grpc_pb");
const create_transaction_request_pb_1 = require("../../../fintekkers/requests/transaction/create_transaction_request_pb");
const query_transaction_request_pb_1 = require("../../../fintekkers/requests/transaction/query_transaction_request_pb");
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const uuid_1 = require("../../models/utils/uuid");
const datetime_1 = require("../../models/utils/datetime");
class TransactionService {
    constructor(apiKey) {
        if (apiKey) {
            const { credentials, interceptors } = requestcontext_1.default.getAuthenticatedClientOptions(apiKey);
            this.client = new transaction_service_grpc_pb_1.TransactionClient(requestcontext_1.default.apiURL, credentials, { interceptors });
        }
        else {
            this.client = new transaction_service_grpc_pb_1.TransactionClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
        }
    }
    validateCreateTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_transaction_request_pb_1.CreateTransactionRequestProto();
            createRequest.setObjectClass('TransactionRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setCreateTransactionInput(transaction.proto);
            const validateCreateOrUpdateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
            const response = yield validateCreateOrUpdateAsync(createRequest);
            return response;
        });
    }
    createTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_transaction_request_pb_1.CreateTransactionRequestProto();
            createRequest.setObjectClass('TransactionRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setCreateTransactionInput(transaction.proto);
            const createTransactionAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
            const response = yield createTransactionAsync(createRequest);
            // Write-through to LinkCache. transactionResponse is a singular field.
            const persisted = response.getTransactionResponse();
            if (persisted) {
                const uuidProto = persisted.getUuid();
                const asOfProto = persisted.getAsOf();
                if (uuidProto && asOfProto) {
                    const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
                    LinkCacheModule.TRANSACTION.put(uuidKey, persisted, new datetime_1.ZonedDateTime(asOfProto));
                }
            }
            return response;
        });
    }
    searchTransaction(asOf, positionFilter, maxResults = 100) {
        const searchRequest = new query_transaction_request_pb_1.QueryTransactionRequestProto();
        searchRequest.setObjectClass('SecurityRequest');
        searchRequest.setVersion('0.0.1');
        searchRequest.setAsOf(asOf);
        searchRequest.setSearchTransactionInput(positionFilter.toProto());
        searchRequest.setLimit(maxResults);
        const tmpClient = this.client;
        function processStreamSynchronously() {
            return __awaiter(this, void 0, void 0, function* () {
                const stream2 = tmpClient.search(searchRequest);
                var results = [];
                return new Promise((resolve, reject) => {
                    stream2.on('data', (response) => {
                        response.getTransactionResponseList().forEach((transaction) => {
                            const txn = new transaction_1.default(transaction);
                            results.push(txn);
                        });
                    });
                    stream2.on('end', () => {
                        console.log("Stream ended with ", results.length);
                        resolve(results);
                    });
                    stream2.on('error', (err) => {
                        console.error('Error in the stream:', err);
                        reject(err);
                    });
                });
            });
        }
        return processStreamSynchronously();
    }
    /**
     * Search transactions and hydrate each Transaction's embedded Security
     * AND Portfolio from link to full entity, with both fetches batched.
     *
     * Pass a shared `linkResolver` to share caching across multiple
     * service-wrapper calls in the same request scope. If omitted, a new
     * resolver is constructed per call.
     *
     * Mutates each returned Transaction.proto's embedded SecurityProto and
     * PortfolioProto in place (link → full). See LinkResolver for cache +
     * dedupe semantics.
     */
    searchWithSecurityAndPortfolio(asOf, positionFilter, maxResults = 100, linkResolver) {
        return __awaiter(this, void 0, void 0, function* () {
            const txns = yield this.searchTransaction(asOf, positionFilter, maxResults);
            const resolver = linkResolver !== null && linkResolver !== void 0 ? linkResolver : new link_resolver_1.default();
            // Run both resolves in parallel — they hit different services.
            yield Promise.all([
                resolver.resolveSecurities(txns),
                resolver.resolvePortfolios(txns),
            ]);
            return txns;
        });
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map