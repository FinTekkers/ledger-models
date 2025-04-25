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
// Models
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const uuid = __importStar(require("../../models/utils/uuid"));
const dt = __importStar(require("../../models/utils/datetime"));
const SecurityService_1 = require("../security-service/SecurityService");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const PortfolioService_1 = require("../portfolio-service/PortfolioService");
const TransactionService_1 = require("./TransactionService");
const transaction_1 = __importDefault(require("../../models/transaction/transaction"));
const assert = require("assert");
const positionfilter_1 = require("../../models/position/positionfilter");
const position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
test('test printing a transaction to string', () => __awaiter(void 0, void 0, void 0, function* () {
    const isTrue = yield testToString();
    expect(isTrue).toBe(true);
}), 30000);
function testToString() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = dt.ZonedDateTime.now();
        const today = new local_date_pb_1.LocalDateProto().setDay(1).setMonth(1).setYear(2021);
        const positionFilter = new positionfilter_1.PositionFilter();
        positionFilter.addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income');
        const transactionProto = yield getTransaction(now, positionFilter, today);
        const transaction = new transaction_1.default(transactionProto);
        transaction.toString();
        return true;
    });
}
test('test creating a transaction against the transaction service', () => __awaiter(void 0, void 0, void 0, function* () {
    const isTrue = yield testTransaction();
    expect(isTrue).toBe(true);
}), 30000);
function testTransaction() {
    return __awaiter(this, void 0, void 0, function* () {
        const transactionService = new TransactionService_1.TransactionService();
        const now = dt.ZonedDateTime.now();
        const today = new local_date_pb_1.LocalDateProto().setDay(1).setMonth(1).setYear(2021);
        const positionFilter = new positionfilter_1.PositionFilter();
        positionFilter.addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income');
        const transaction = yield getTransaction(now, positionFilter, today);
        // var validationSummary = await transactionService.validateCreateTransaction(new Transaction(transaction));
        // assert(validationSummary.getErrorsList().length == 0, "Validation errors found");
        console.time("createTransaction");
        var createTransactionResponse = yield transactionService.createTransaction(new transaction_1.default(transaction));
        const transactionResponse = createTransactionResponse.getTransactionResponse();
        assert(transactionResponse, "No transaction response found");
        console.timeEnd("createTransaction");
        console.log("Searching transaction");
        console.time("searchTransaction");
        const transactionUuid = transactionResponse.getUuid();
        if (!transactionUuid)
            throw new Error("Transaction UUID is required");
        const transactionID = uuid.UUID.fromU8Array(transactionUuid.getRawUuid_asU8());
        positionFilter.addEqualsFilter(field_pb_1.FieldProto.ID, transactionID);
        const transactions = yield transactionService.searchTransaction(now.toProto(), positionFilter);
        console.timeEnd("searchTransaction");
        if (transactions === undefined) {
            console.log('No transactions found');
        }
        else {
            console.log(transactions.length);
        }
        return true;
    });
}
function getTransaction(now, positionFilter, today) {
    return __awaiter(this, void 0, void 0, function* () {
        const securityService = new SecurityService_1.SecurityService();
        const portfolioService = new PortfolioService_1.PortfolioService();
        console.time("searchSecurity");
        let fixedIncomeSecurities = yield securityService
            .searchSecurity(now.toProto(), positionFilter)
            .then((fixedIncomeSecurities) => {
            return fixedIncomeSecurities;
        });
        console.timeEnd("searchSecurity");
        let security = fixedIncomeSecurities[0];
        console.time("searchPortfolio");
        let portfolios = yield portfolioService.searchPortfolio(now.toProto(), new positionfilter_1.PositionFilter().addEqualsFilter(field_pb_1.FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO'));
        console.timeEnd("searchPortfolio");
        if (portfolios === undefined) {
            throw new Error('No portfolios found');
        }
        const portfolio = portfolios[0];
        if (portfolio.getPortfolioName().includes('Federal')) {
            throw new Error('Portfolio is not a test portfolio! Abandoning test');
        }
        const transaction = new transaction_pb_1.TransactionProto();
        transaction.setObjectClass('Transaction');
        transaction.setVersion('0.0.1');
        transaction.setUuid(uuid.UUID.random().toUUIDProto());
        transaction.setAsOf(now.toProto());
        transaction.setTradeDate(today);
        transaction.setSettlementDate(today); //Same day settlement
        transaction.setTransactionType(transaction_type_pb_1.TransactionTypeProto.BUY);
        transaction.setPositionStatus(position_status_pb_1.PositionStatusProto.EXECUTED);
        transaction.setPrice(new price_pb_1.PriceProto()
            .setObjectClass('Price')
            .setAsOf(now.toProto())
            .setVersion('0.0.1')
            .setSecurity(security.proto)
            .setUuid(uuid.UUID.random().toUUIDProto())
            .setPrice(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('100.00')));
        transaction.setQuantity(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('10000.00'));
        transaction.setPortfolio(portfolio.proto);
        transaction.setSecurity(security.proto);
        return transaction;
    });
}
//# sourceMappingURL=transaction.test.js.map