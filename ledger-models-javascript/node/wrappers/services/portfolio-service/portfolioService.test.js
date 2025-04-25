"use strict";
// Models
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const uuid = __importStar(require("../../models/utils/uuid"));
const dt = __importStar(require("../../models/utils/datetime"));
//Requests & Services
const PortfolioService_1 = require("./PortfolioService");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const positionfilter_1 = require("../../models/position/positionfilter");
test('test creating a portfolio against the api.fintekkers.org portfolio service', () => __awaiter(void 0, void 0, void 0, function* () {
    const id_proto = uuid.UUID.random().toUUIDProto();
    const now = dt.ZonedDateTime.now();
    const portfolioService = new PortfolioService_1.PortfolioService();
    const portfolio = new portfolio_pb_1.PortfolioProto();
    portfolio.setObjectClass('Portfolio');
    portfolio.setVersion('0.0.1');
    portfolio.setUuid(id_proto);
    portfolio.setPortfolioName('TEST PORTFOLIO');
    portfolio.setAsOf(now.toProto());
    var validationSummary = yield portfolioService.validateCreatePortfolio(portfolio);
    expect(validationSummary.getErrorsList().length).toBe(0);
    var createPortfolioResponse = yield portfolioService.createPortfolio(portfolio);
    expect(createPortfolioResponse.getPortfolioResponseList().length).toBe(1);
    let portfolioFilter = new positionfilter_1.PositionFilter().addEqualsStringFilter(field_pb_1.FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO');
    var searchResults = yield portfolioService.searchPortfolio(now.toProto(), portfolioFilter);
    expect(searchResults.length > 0).toBe(true);
}), 30000);
//# sourceMappingURL=portfolioService.test.js.map