// Models
import { DecimalValueProto } from '../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../fintekkers/models/util/local_date_pb';

// Model Utils
import { FieldProto } from '../fintekkers/models/position/field_pb';

import * as uuid from './models/utils/uuid';
import * as dt from './models/utils/datetime';

import { SecurityService } from './services/security-service/SecurityService';
import { TransactionTypeProto } from '../fintekkers/models/transaction/transaction_type_pb';
import { TransactionProto } from '../fintekkers/models/transaction/transaction_pb';
import { PriceProto } from '../fintekkers/models/price/price_pb';
import { PortfolioService } from './services/portfolio-service/PortfolioService';
import { TransactionService } from './services/transaction-service/TransactionService';
import Transaction from './models/transaction/transaction';
import { CreateTransactionResponseProto } from '../fintekkers/requests/transaction/create_transaction_response_pb';

async function testTransaction(): Promise<void> {
  const id_proto = uuid.UUID.random().toUUIDProto();
  const now = dt.ZonedDateTime.now();
  const today = new LocalDateProto().setDay(1).setMonth(1).setYear(2021);

  const securityService = new SecurityService();
  const portfolioService = new PortfolioService();
  const transactionService = new TransactionService();

  // let usd_security = await securityService
  //   .searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Cash')
  //   .then((securities) => {
  //     return securities[0];
  //   });

  let fixedIncomeSecurities = await securityService
  .searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income')
  .then((fixedIncomeSecurities) => {
    return fixedIncomeSecurities;
  });

  let security = fixedIncomeSecurities[0];

  let portfolios = await portfolioService.searchPortfolio(
      now.to_date_proto(),
      FieldProto.PORTFOLIO_NAME,
      'TEST PORTFOLIO');
  
  if(portfolios === undefined) {
    throw new Error('No portfolios found');
  }

  console.log('There are %d portfolios in this response', portfolios.length);
  const portfolio = portfolios[0];

  if(portfolio.getPortfolioName().includes('Federal')){
    throw new Error('Portfolio is not a test portfolio! Abandoning test');
  }

  const transaction = new TransactionProto();
  transaction.setObjectClass('Transaction');
  transaction.setVersion('0.0.1');
  transaction.setUuid(uuid.UUID.random().toUUIDProto());
  transaction.setAsOf(now.to_date_proto());
  transaction.setTradeDate(today);
  transaction.setSettlementDate(today); //Same day settlement
  transaction.setTransactionType(TransactionTypeProto.BUY);
  transaction.setPrice(
    new PriceProto()
      .setObjectClass('Price')
      .setAsOf(now.to_date_proto())
      .setVersion('0.0.1')
      .setSecurity(security.proto)
      .setUuid(uuid.UUID.random().toUUIDProto())
      .setPrice(new DecimalValueProto().setArbitraryPrecisionValue('100.00'))
  );
  transaction.setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('10000.00')); 
  transaction.setPortfolio(portfolio); 
  transaction.setSecurity(security.proto);

  // var validationSummary = await transactionService.validateCreateTransaction(new Transaction(transaction));
  // console.log(validationSummary);

  var createTransactionResponse:CreateTransactionResponseProto = await transactionService.createTransaction(new Transaction(transaction));
  console.log(createTransactionResponse);

  var searchResults = await transactionService.searchTransaction(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  console.log('There are %d transactions in this response', searchResults.length);
}

export { testTransaction };
