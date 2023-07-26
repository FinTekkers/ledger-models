// Models

// Model Utils
import { FieldProto } from '../fintekkers/models/position/field_pb';
import * as uuid from './models/utils/uuid';
import * as dt from './models/utils/datetime';

//Requests & Services
import { PortfolioService } from './services/portfolio-service/PortfolioService';
import { PortfolioProto } from '../fintekkers/models/portfolio/portfolio_pb';
import { CreatePortfolioResponseProto } from '../fintekkers/requests/portfolio/create_portfolio_response_pb';

async function testPortfolio(): Promise<void> {
  const id_proto = uuid.UUID.random().to_uuid_proto();
  const now = dt.ZonedDateTime.now();

  const portfolioService = new PortfolioService();

  const portfolio = new PortfolioProto();
  portfolio.setObjectClass('Portfolio');
  portfolio.setVersion('0.0.1');
  portfolio.setUuid(id_proto);
  portfolio.setPortfolioName('TEST PORTFOLIO');
  portfolio.setAsOf(now.to_date_proto());

  var validationSummary = await portfolioService.validateCreatePortfolio(portfolio);
  console.log(validationSummary);

  var createPortfolioResponse:CreatePortfolioResponseProto = await portfolioService.createPortfolio(portfolio);
  console.log(createPortfolioResponse);

  var searchResults = await portfolioService.searchPortfolio(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  console.log('There are %d securities in this response', searchResults.length);
}

export { testPortfolio };
