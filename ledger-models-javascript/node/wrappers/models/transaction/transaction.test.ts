import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUID } from '../utils/uuid';

import assert = require('assert');
import Transaction from './transaction';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';

import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';


test('test the transaction wrapper', () => {
    testSerialization();
  });

function testSerialization(): void {
    const transaction = dummyTransaction();

    assert(transaction.getTransactionType().toString() === 'BUY');
    assert(transaction.getDirectedQuantity().toNumber() > 0);
}

function dummyTransaction() {

    return new Transaction(new TransactionProto()
    .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
    .setTradeDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
    .setTransactionType(TransactionTypeProto.BUY)
    .setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
    .setSettlementDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1)));
}

