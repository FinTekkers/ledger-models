"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var uuid_1 = require("../utils/uuid");
var assert = require("assert");
var transaction_1 = require("./transaction");
var transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
test('test the transaction wrapper', function () {
    testSerialization();
});
function testSerialization() {
    var transaction = dummyTransaction();
    assert(transaction.getTransactionType().toString() === 'BUY');
    assert(transaction.getDirectedQuantity().toNumber() > 0);
}
function dummyTransaction() {
    return new transaction_1.default(new transaction_pb_1.TransactionProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setTradeDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setTransactionType(transaction_type_pb_1.TransactionTypeProto.BUY)
        .setQuantity(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setSettlementDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1)));
}
//# sourceMappingURL=transaction.test.js.map