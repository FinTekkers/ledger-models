"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const util_1 = require("util");
// Model Utils
// Requests & Services
const portfolio_service_grpc_pb_1 = require("../../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb");
const query_portfolio_request_pb_1 = require("../../../fintekkers/requests/portfolio/query_portfolio_request_pb");
const create_portfolio_request_pb_1 = require("../../../fintekkers/requests/portfolio/create_portfolio_request_pb");
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
const portfolio_1 = __importDefault(require("../../models/portfolio/portfolio"));
class PortfolioService {
    constructor() {
        this.client = new portfolio_service_grpc_pb_1.PortfolioClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
    }
    validateCreatePortfolio(portfolio) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_portfolio_request_pb_1.CreatePortfolioRequestProto();
            createRequest.setObjectClass('PortfolioRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setCreatePortfolioInput(portfolio);
            const validateCreateOrUpdateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
            const response = yield validateCreateOrUpdateAsync(createRequest);
            return response;
        });
    }
    createPortfolio(portfolio) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_portfolio_request_pb_1.CreatePortfolioRequestProto();
            createRequest.setObjectClass('PortfolioRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setCreatePortfolioInput(portfolio);
            const createPortfolioAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
            const response = yield createPortfolioAsync(createRequest);
            return response;
        });
    }
    searchPortfolio(asOf, positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchRequest = new query_portfolio_request_pb_1.QueryPortfolioRequestProto();
            searchRequest.setObjectClass('PortfolioRequest');
            searchRequest.setVersion('0.0.1');
            searchRequest.setAsOf(asOf);
            searchRequest.setSearchPortfolioInput(positionFilter.toProto());
            const tmpClient = this.client;
            const listPortfolios = [];
            function processStreamSynchronously() {
                return __awaiter(this, void 0, void 0, function* () {
                    const stream2 = tmpClient.search(searchRequest);
                    return new Promise((resolve, reject) => {
                        stream2.on('data', (response) => {
                            response.getPortfolioResponseList().forEach((portfolio) => {
                                listPortfolios.push(new portfolio_1.default(portfolio));
                            });
                        });
                        stream2.on('end', () => {
                            resolve(listPortfolios);
                        });
                        stream2.on('error', (err) => {
                            console.error('Error in the stream:', err);
                            reject(err);
                        });
                    });
                });
            }
            return yield processStreamSynchronously();
        });
    }
}
exports.PortfolioService = PortfolioService;
PortfolioService.url = requestcontext_1.default.apiURL;
//# sourceMappingURL=PortfolioService.js.map