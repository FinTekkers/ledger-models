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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
var util_1 = require("util");
// Models
var transaction_1 = require("../../models/transaction/transaction");
// Model Utils
// Requests & Services
var transaction_service_grpc_pb_1 = require("../../../fintekkers/services/transaction-service/transaction_service_grpc_pb");
var create_transaction_request_pb_1 = require("../../../fintekkers/requests/transaction/create_transaction_request_pb");
var query_transaction_request_pb_1 = require("../../../fintekkers/requests/transaction/query_transaction_request_pb");
var requestcontext_1 = require("../../models/utils/requestcontext");
var TransactionService = /** @class */ (function () {
    function TransactionService() {
        this.client = new transaction_service_grpc_pb_1.TransactionClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
    }
    TransactionService.prototype.validateCreateTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var createRequest, validateCreateOrUpdateAsync, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRequest = new create_transaction_request_pb_1.CreateTransactionRequestProto();
                        createRequest.setObjectClass('TransactionRequest');
                        createRequest.setVersion('0.0.1');
                        createRequest.setCreateTransactionInput(transaction.proto);
                        validateCreateOrUpdateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
                        return [4 /*yield*/, validateCreateOrUpdateAsync(createRequest)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    TransactionService.prototype.createTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var createRequest, createTransactionAsync, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRequest = new create_transaction_request_pb_1.CreateTransactionRequestProto();
                        createRequest.setObjectClass('TransactionRequest');
                        createRequest.setVersion('0.0.1');
                        createRequest.setCreateTransactionInput(transaction.proto);
                        createTransactionAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
                        return [4 /*yield*/, createTransactionAsync(createRequest)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    TransactionService.prototype.searchTransaction = function (asOf, positionFilter, maxResults) {
        if (maxResults === void 0) { maxResults = 100; }
        var searchRequest = new query_transaction_request_pb_1.QueryTransactionRequestProto();
        searchRequest.setObjectClass('SecurityRequest');
        searchRequest.setVersion('0.0.1');
        searchRequest.setAsOf(asOf);
        searchRequest.setSearchTransactionInput(positionFilter.toProto());
        searchRequest.setLimit(maxResults);
        var tmpClient = this.client;
        function processStreamSynchronously() {
            return __awaiter(this, void 0, void 0, function () {
                var stream2, results;
                return __generator(this, function (_a) {
                    stream2 = tmpClient.search(searchRequest);
                    results = [];
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            stream2.on('data', function (response) {
                                response.getTransactionResponseList().forEach(function (transaction) {
                                    var txn = new transaction_1.default(transaction);
                                    results.push(txn);
                                });
                            });
                            stream2.on('end', function () {
                                console.log("Stream ended with ", results.length);
                                resolve(results);
                            });
                            stream2.on('error', function (err) {
                                console.error('Error in the stream:', err);
                                reject(err);
                            });
                        })];
                });
            });
        }
        return processStreamSynchronously();
    };
    return TransactionService;
}());
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map