import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';

import assert = require('assert');
import Portfolio from './portfolio';

import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';


test('test the portfolio wrapper', () => {
    testSerialization();
});

function testSerialization(): void {
    const portfolio = dummyPortfolio();

    assert(portfolio.getPortfolioName() === 'Test Portfolio');
}

export function dummyPortfolio(): Portfolio {
    const portfolioProto = new PortfolioProto();
    portfolioProto.setObjectClass('Portfolio');
    portfolioProto.setVersion('0.0.1');
    portfolioProto.setUuid(UUID.random().toUUIDProto());
    portfolioProto.setPortfolioName('Test Portfolio');
    portfolioProto.setAsOf(ZonedDateTime.now().toProto());
    return new Portfolio(portfolioProto);
}
