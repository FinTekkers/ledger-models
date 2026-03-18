"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyPortfolio = void 0;
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const assert = require("assert");
const portfolio_1 = __importDefault(require("./portfolio"));
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
test('test the portfolio wrapper', () => {
    testSerialization();
});
function testSerialization() {
    const portfolio = dummyPortfolio();
    assert(portfolio.getPortfolioName() === 'Test Portfolio');
}
function dummyPortfolio() {
    const portfolioProto = new portfolio_pb_1.PortfolioProto();
    portfolioProto.setObjectClass('Portfolio');
    portfolioProto.setVersion('0.0.1');
    portfolioProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    portfolioProto.setPortfolioName('Test Portfolio');
    portfolioProto.setAsOf(datetime_1.ZonedDateTime.now().toProto());
    return new portfolio_1.default(portfolioProto);
}
exports.dummyPortfolio = dummyPortfolio;
//# sourceMappingURL=portfolio.test.js.map