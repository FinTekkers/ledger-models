"use strict";
// Models
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Model Utils
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var uuid = require("../../models/utils/uuid");
var dt = require("../../models/utils/datetime");
//Requests & Services
var PortfolioService_1 = require("./PortfolioService");
var portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
var positionfilter_1 = require("../../models/position/positionfilter");
test('test creating a portfolio against the api.fintekkers.org portfolio service', function () { return __awaiter(void 0, void 0, void 0, function () {
    var id_proto, now, portfolioService, portfolio, validationSummary, createPortfolioResponse, searchResults;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id_proto = uuid.UUID.random().toUUIDProto();
                now = dt.ZonedDateTime.now();
                portfolioService = new PortfolioService_1.PortfolioService();
                portfolio = new portfolio_pb_1.PortfolioProto();
                portfolio.setObjectClass('Portfolio');
                portfolio.setVersion('0.0.1');
                portfolio.setUuid(id_proto);
                portfolio.setPortfolioName('TEST PORTFOLIO');
                portfolio.setAsOf(now.toProto());
                return [4 /*yield*/, portfolioService.validateCreatePortfolio(portfolio)];
            case 1:
                validationSummary = _a.sent();
                expect(validationSummary.getErrorsList().length).toBe(0);
                return [4 /*yield*/, portfolioService.createPortfolio(portfolio)];
            case 2:
                createPortfolioResponse = _a.sent();
                expect(createPortfolioResponse.getPortfolioResponseList().length).toBe(1);
                return [4 /*yield*/, portfolioService.searchPortfolio(now.toProto(), new positionfilter_1.PositionFilter().addEqualsFilter(field_pb_1.FieldProto.PORTFOLIO_NAME, 'Federal Reserve SOMA Holdings'))];
            case 3:
                searchResults = _a.sent();
                expect(searchResults.length > 0).toBe(true);
                console.log(searchResults[0].getPortfolioName());
                return [2 /*return*/];
        }
    });
}); }, 30000);
//# sourceMappingURL=portfolio.test.js.map