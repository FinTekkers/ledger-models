// Models

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import * as uuid from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';

//Requests & Services
import { PortfolioService } from './PortfolioService';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { CreatePortfolioResponseProto } from '../../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import { PositionFilter } from '../../models/position/positionfilter';


test('test creating a portfolio against the api.fintekkers.org portfolio service', () => {
  const isTrue = testPortfolio();
  expect(isTrue).resolves.toBe(true);
}, 30000);

export async function testPortfolio(): Promise<boolean> {
  const id_proto = uuid.UUID.random().toUUIDProto();
  const now = dt.ZonedDateTime.now();

  const portfolioService = new PortfolioService();

  const portfolio = new PortfolioProto();
  portfolio.setObjectClass('Portfolio');
  portfolio.setVersion('0.0.1');
  portfolio.setUuid(id_proto);
  portfolio.setPortfolioName('TEST PORTFOLIO');
  portfolio.setAsOf(now.toProto());

  var validationSummary = await portfolioService.validateCreatePortfolio(portfolio);

  var createPortfolioResponse: CreatePortfolioResponseProto = await portfolioService.createPortfolio(portfolio);

  var searchResults = await portfolioService.searchPortfolio(now.toProto(), new PositionFilter().addFilter(FieldProto.PORTFOLIO_NAME, 'Federal Reserve SOMA Holdings'));

  return true;
}

