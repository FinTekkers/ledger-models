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
class TransactionService {
    constructor() {
        this.client = new transaction_service_grpc_pb_1.TransactionClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
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
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map