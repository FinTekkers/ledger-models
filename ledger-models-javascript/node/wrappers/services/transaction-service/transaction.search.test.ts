// Models
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

import * as uuid from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';

import { SecurityService } from '../security-service/SecurityService';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PortfolioService } from '../portfolio-service/PortfolioService';
import { TransactionService } from './TransactionService';
import Transaction from '../../models/transaction/transaction';
import { CreateTransactionResponseProto } from '../../../fintekkers/requests/transaction/create_transaction_response_pb';

import assert = require("assert");
import { PositionFilter } from '../../models/position/positionfilter';

test('test creating a transaction against the portfolio service', async () => {
  const isTrue = await searchListTransactions();
  expect(isTrue).toBe(true);
}, 30000);

async function searchListTransactions(): Promise<boolean> {
  const now = dt.ZonedDateTime.now();
  const transactionService = new TransactionService();

  const positionFilter = new PositionFilter();
  positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');

  // positionFilter.addEqualsFilter(FieldProto.ID, transactionID);
  const transactions = await transactionService.searchTransaction(now.toProto(), positionFilter);
  console.timeEnd("searchTransaction");

  if (transactions === undefined) {
    console.log('No transactions found');
    throw Error('No transactions found');
  } else {
    let transaction: Transaction = transactions[0];

    //We can get data straight from the transaction
    transaction.getIssuerName();

    //Or we can get information from the security
    transaction.getSecurity().getAssetClass();
  }

  return true;
}
