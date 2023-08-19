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
// Models
var decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
// Model Utils
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var uuid = require("../../models/utils/uuid");
var dt = require("../../models/utils/datetime");
var SecurityService_1 = require("../security-service/SecurityService");
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
var price_pb_1 = require("../../../fintekkers/models/price/price_pb");
var PortfolioService_1 = require("../portfolio-service/PortfolioService");
var TransactionService_1 = require("./TransactionService");
var transaction_1 = require("../../models/transaction/transaction");
var assert = require("assert");
test('test creating a transaction against the portfolio service', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isTrue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, testTransaction()];
            case 1:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); }, 30000);
function testTransaction() {
    return __awaiter(this, void 0, void 0, function () {
        var id_proto, now, today, securityService, portfolioService, transactionService, fixedIncomeSecurities, security, portfolios, portfolio, transaction, createTransactionResponse, transactionResponse, transactions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id_proto = uuid.UUID.random().toUUIDProto();
                    now = dt.ZonedDateTime.now();
                    today = new local_date_pb_1.LocalDateProto().setDay(1).setMonth(1).setYear(2021);
                    securityService = new SecurityService_1.SecurityService();
                    portfolioService = new PortfolioService_1.PortfolioService();
                    transactionService = new TransactionService_1.TransactionService();
                    return [4 /*yield*/, securityService
                            .searchSecurity(now.toProto(), field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income')
                            .then(function (fixedIncomeSecurities) {
                            return fixedIncomeSecurities;
                        })];
                case 1:
                    fixedIncomeSecurities = _a.sent();
                    security = fixedIncomeSecurities[0];
                    return [4 /*yield*/, portfolioService.searchPortfolio(now.toProto(), field_pb_1.FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO')];
                case 2:
                    portfolios = _a.sent();
                    if (portfolios === undefined) {
                        throw new Error('No portfolios found');
                    }
                    portfolio = portfolios[0];
                    if (portfolio.getPortfolioName().includes('Federal')) {
                        throw new Error('Portfolio is not a test portfolio! Abandoning test');
                    }
                    transaction = new transaction_pb_1.TransactionProto();
                    transaction.setObjectClass('Transaction');
                    transaction.setVersion('0.0.1');
                    transaction.setUuid(uuid.UUID.random().toUUIDProto());
                    transaction.setAsOf(now.toProto());
                    transaction.setTradeDate(today);
                    transaction.setSettlementDate(today); //Same day settlement
                    transaction.setTransactionType(transaction_type_pb_1.TransactionTypeProto.BUY);
                    transaction.setPrice(new price_pb_1.PriceProto()
                        .setObjectClass('Price')
                        .setAsOf(now.toProto())
                        .setVersion('0.0.1')
                        .setSecurity(security.proto)
                        .setUuid(uuid.UUID.random().toUUIDProto())
                        .setPrice(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('100.00')));
                    transaction.setQuantity(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('10000.00'));
                    transaction.setPortfolio(portfolio);
                    transaction.setSecurity(security.proto);
                    return [4 /*yield*/, transactionService.createTransaction(new transaction_1.default(transaction))];
                case 3:
                    createTransactionResponse = _a.sent();
                    transactionResponse = createTransactionResponse.getTransactionResponse();
                    assert(transactionResponse, "No transaction response found");
                    return [4 /*yield*/, transactionService.searchTransaction(now.toProto(), field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income')];
                case 4:
                    transactions = _a.sent();
                    if (transactions === undefined) {
                        console.log('No transactions found');
                    }
                    else {
                        console.log(transactions.length);
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
//# sourceMappingURL=transaction.test.js.map