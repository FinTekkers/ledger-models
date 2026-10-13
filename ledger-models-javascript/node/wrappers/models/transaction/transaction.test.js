"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const uuid_1 = require("../utils/uuid");
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const datetime_1 = require("../utils/datetime");
const decimal_1 = require("../utils/decimal");
test('test the transaction wrapper', () => {
    testSerialization();
});
function testSerialization() {
    const transaction = dummyTransaction();
    assert(transaction.getTransactionType().toString() === 'BUY');
    assert(transaction.getDirectedQuantity().toNumber() > 0);
}
function dummyTransaction() {
    return new transaction_1.default(new transaction_pb_1.TransactionProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(datetime_1.ZonedDateTime.now().toProto())
        .setTradeDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setTransactionType(transaction_type_pb_1.TransactionTypeProto.BUY)
        .setQuantity((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('1000.00')))
        .setSettlementDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1)));
}
//# sourceMappingURL=transaction.test.js.map