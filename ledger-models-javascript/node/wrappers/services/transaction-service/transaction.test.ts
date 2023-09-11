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
  const isTrue = await testTransaction();
  expect(isTrue).toBe(true);
}, 30000);

async function testTransaction(): Promise<boolean> {
  const id_proto = uuid.UUID.random().toUUIDProto();
  const now = dt.ZonedDateTime.now();
  const today = new LocalDateProto().setDay(1).setMonth(1).setYear(2021);

  const securityService = new SecurityService();
  const portfolioService = new PortfolioService();
  const transactionService = new TransactionService();

  const positionFilter = new PositionFilter();
  positionFilter.addFilter(FieldProto.ASSET_CLASS, 'Fixed Income');

  console.time("searchSecurity");
  let fixedIncomeSecurities = await securityService
    .searchSecurity(now.toProto(), positionFilter)
    .then((fixedIncomeSecurities) => {
      return fixedIncomeSecurities;
    });
  console.timeEnd("searchSecurity");

  let security = fixedIncomeSecurities[0];

  console.time("searchPortfolio");
  let portfolios = await portfolioService.searchPortfolio(
    now.toProto(),
    new PositionFilter().addFilter(FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO'));
  console.timeEnd("searchPortfolio");

  if (portfolios === undefined) {
    throw new Error('No portfolios found');
  }

  const portfolio = portfolios[0];

  if (portfolio.getPortfolioName().includes('Federal')) {
    throw new Error('Portfolio is not a test portfolio! Abandoning test');
  }

  const transaction = new TransactionProto();
  transaction.setObjectClass('Transaction');
  transaction.setVersion('0.0.1');
  transaction.setUuid(uuid.UUID.random().toUUIDProto());
  transaction.setAsOf(now.toProto());
  transaction.setTradeDate(today);
  transaction.setSettlementDate(today); //Same day settlement
  transaction.setTransactionType(TransactionTypeProto.BUY);
  transaction.setPrice(
    new PriceProto()
      .setObjectClass('Price')
      .setAsOf(now.toProto())
      .setVersion('0.0.1')
      .setSecurity(security.proto)
      .setUuid(uuid.UUID.random().toUUIDProto())
      .setPrice(new DecimalValueProto().setArbitraryPrecisionValue('100.00'))
  );
  transaction.setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('10000.00'));
  transaction.setPortfolio(portfolio);
  transaction.setSecurity(security.proto);

  // var validationSummary = await transactionService.validateCreateTransaction(new Transaction(transaction));
  // assert(validationSummary.getErrorsList().length == 0, "Validation errors found");


  console.time("createTransaction");
  var createTransactionResponse: CreateTransactionResponseProto = await transactionService.createTransaction(new Transaction(transaction));
  const transactionResponse = createTransactionResponse.getTransactionResponse();
  assert(transactionResponse, "No transaction response found");

  console.timeEnd("createTransaction");

  console.log("Searching transaction");

  console.time("searchTransaction");

  const transactionID = uuid.UUID.fromU8Array(transactionResponse.getUuid().getRawUuid_asU8());
  positionFilter.addFilter(FieldProto.ID, transactionID);
  const transactions = await transactionService.searchTransaction(now.toProto(), positionFilter);
  console.timeEnd("searchTransaction");

  if (transactions === undefined) {
    console.log('No transactions found');
  } else {
    console.log(transactions.length);
  }

  return true;
}
