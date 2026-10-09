"use strict";
/**
 * Unit tests for Issue #114: each wrapper service hands the generated gRPC
 * client the authenticated credentials when given an apiKey, and
 * EnvConfig.credentialsFor(service) otherwise, for its own service (LM-287).
 *
 * The generated *_grpc_pb clients are mocked, so no channel is opened.
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb', () => ({
    PortfolioClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/position-service/position_service_grpc_pb', () => ({
    PositionClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/price-service/price_service_grpc_pb', () => ({
    PriceClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/security-service/security_service_grpc_pb', () => ({
    SecurityClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/transaction-service/transaction_service_grpc_pb', () => ({
    TransactionClient: jest.fn(),
}));
const grpc = __importStar(require("@grpc/grpc-js"));
const requestcontext_1 = __importDefault(require("../models/utils/requestcontext"));
const serviceaddress_1 = require("../util/serviceaddress");
const portfolio_service_grpc_pb_1 = require("../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb");
const position_service_grpc_pb_1 = require("../../fintekkers/services/position-service/position_service_grpc_pb");
const price_service_grpc_pb_1 = require("../../fintekkers/services/price-service/price_service_grpc_pb");
const security_service_grpc_pb_1 = require("../../fintekkers/services/security-service/security_service_grpc_pb");
const transaction_service_grpc_pb_1 = require("../../fintekkers/services/transaction-service/transaction_service_grpc_pb");
const PortfolioService_1 = require("./portfolio-service/PortfolioService");
const PositionService_1 = require("./position-service/PositionService");
const PriceService_1 = require("./price-service/PriceService");
const SecurityService_1 = require("./security-service/SecurityService");
const TransactionService_1 = require("./transaction-service/TransactionService");
const cases = [
    ['PortfolioService', PortfolioService_1.PortfolioService, portfolio_service_grpc_pb_1.PortfolioClient, serviceaddress_1.Service.PORTFOLIO],
    ['PositionService', PositionService_1.PositionService, position_service_grpc_pb_1.PositionClient, serviceaddress_1.Service.POSITION],
    ['PriceService', PriceService_1.PriceService, price_service_grpc_pb_1.PriceClient, serviceaddress_1.Service.PRICE],
    ['SecurityService', SecurityService_1.SecurityService, security_service_grpc_pb_1.SecurityClient, serviceaddress_1.Service.SECURITY],
    ['TransactionService', TransactionService_1.TransactionService, transaction_service_grpc_pb_1.TransactionClient, serviceaddress_1.Service.TRANSACTION],
];
beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
    jest.restoreAllMocks();
});
describe.each(cases)('%s', (_name, Service, Client, service) => {
    const ClientMock = Client;
    test('with apiKey, client gets the authenticated credentials', () => {
        const sentinel = {
            credentials: grpc.credentials.createInsecure(),
            interceptors: [],
        };
        const authSpy = jest
            .spyOn(requestcontext_1.default, 'getAuthenticatedClientOptions')
            .mockReturnValue(sentinel);
        new Service('k');
        expect(authSpy).toHaveBeenCalledWith('k', service);
        expect(ClientMock).toHaveBeenCalledTimes(1);
        expect(ClientMock).toHaveBeenCalledWith(requestcontext_1.default.urlFor(service), sentinel.credentials, { interceptors: sentinel.interceptors });
    });
    test('zero-arg constructor constructs with EnvConfig.credentialsFor(service)', () => {
        const plain = grpc.credentials.createInsecure();
        const credsSpy = jest.spyOn(requestcontext_1.default, 'credentialsFor').mockReturnValue(plain);
        const authSpy = jest.spyOn(requestcontext_1.default, 'getAuthenticatedClientOptions');
        expect(new Service()).toBeDefined();
        expect(authSpy).not.toHaveBeenCalled();
        expect(credsSpy).toHaveBeenCalledWith(service);
        expect(ClientMock).toHaveBeenCalledTimes(1);
        expect(ClientMock).toHaveBeenCalledWith(requestcontext_1.default.urlFor(service), plain);
    });
});
//# sourceMappingURL=apikey.credentials.test.js.map