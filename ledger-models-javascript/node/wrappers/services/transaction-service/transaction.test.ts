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

test('test creating a transaction against the portfolio service', async () => {
  const isTrue =  await testTransaction();
  expect(isTrue).toBe(true);
}, 30000);

async function testTransaction(): Promise<boolean> {
  const id_proto = uuid.UUID.random().toUUIDProto();
  const now = dt.ZonedDateTime.now();
  const today = new LocalDateProto().setDay(1).setMonth(1).setYear(2021);

  const securityService = new SecurityService();
  const portfolioService = new PortfolioService();
  const transactionService = new TransactionService();

  let fixedIncomeSecurities = await securityService
    .searchSecurity(now.toProto(), FieldProto.ASSET_CLASS, 'Fixed Income')
    .then((fixedIncomeSecurities) => {
      return fixedIncomeSecurities;
    });

  let security = fixedIncomeSecurities[0];

  let portfolios = await portfolioService.searchPortfolio(
      now.toProto(),
      FieldProto.PORTFOLIO_NAME,
      'TEST PORTFOLIO');
  
  if(portfolios === undefined) {
    throw new Error('No portfolios found');
  }

  const portfolio = portfolios[0];

  if(portfolio.getPortfolioName().includes('Federal')){
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

  var createTransactionResponse:CreateTransactionResponseProto = await transactionService.createTransaction(new Transaction(transaction));
  const transactionResponse = createTransactionResponse.getTransactionResponse();
  assert(transactionResponse, "No transaction response found");

  // transactionService.addListener(transactionListener);
  const transactions = await transactionService.searchTransaction(now.toProto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  
  if(transactions === undefined) {
    console.log('No transactions found');
  } else {
    console.log(transactions.length);
  }

  return true;
}
