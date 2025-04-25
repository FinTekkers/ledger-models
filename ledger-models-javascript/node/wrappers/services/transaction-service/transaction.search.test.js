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
Object.defineProperty(exports, "__esModule", { value: true });
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const dt = __importStar(require("../../models/utils/datetime"));
const TransactionService_1 = require("./TransactionService");
const positionfilter_1 = require("../../models/position/positionfilter");
test('test creating a transaction against the portfolio service', () => __awaiter(void 0, void 0, void 0, function* () {
    const isTrue = yield searchListTransactions();
    expect(isTrue).toBe(true);
}), 30000);
function searchListTransactions() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = dt.ZonedDateTime.now();
        const transactionService = new TransactionService_1.TransactionService();
        const positionFilter = new positionfilter_1.PositionFilter();
        positionFilter.addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income');
        // positionFilter.addEqualsFilter(FieldProto.ID, transactionID);
        const transactions = yield transactionService.searchTransaction(now.toProto(), positionFilter);
        console.timeEnd("searchTransaction");
        if (transactions === undefined) {
            console.log('No transactions found');
            throw Error('No transactions found');
        }
        else {
            let transaction = transactions[0];
            //We can get data straight from the transaction
            transaction.getIssuerName();
            //Or we can get information from the security
            transaction.getSecurity().getAssetClass();
        }
        return true;
    });
}
//# sourceMappingURL=transaction.search.test.js.map