"use strict";
/**
 * LM-287: every JS service client gets its address from the per-service
 * lookup, so with the UI's environment (BROKER_HOST=127.0.0.1:8085,
 * API_URL=localhost) all of them, the price client included, call the broker
 * rather than ledger-service on localhost:8082.
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
const link_resolver_1 = __importDefault(require("../util/link-resolver"));
// Every variable the lookup reads; each test starts with none of them set.
const LOOKUP_VARS = [
    'BROKER_HOST',
    'API_URL',
    ...['BROKER', 'LEDGER', 'VALUATION', 'PRICE'].flatMap((p) => [`${p}_SERVICE_HOST`, `${p}_SERVICE_PORT`]),
];
const saved = LOOKUP_VARS.map((k) => process.env[k]);
function setEnv(key, value) {
    if (value === undefined) {
        delete process.env[key];
    }
    else {
        process.env[key] = value;
    }
}
beforeEach(() => {
    jest.clearAllMocks();
    LOOKUP_VARS.forEach((k) => setEnv(k, undefined));
});
afterEach(() => {
    LOOKUP_VARS.forEach((k, i) => setEnv(k, saved[i]));
    jest.restoreAllMocks();
});
// [name, wrapper, generated client, port with only API_URL=localhost]
const clients = [
    ['PriceService', PriceService_1.PriceService, price_service_grpc_pb_1.PriceClient, 8083],
    ['SecurityService', SecurityService_1.SecurityService, security_service_grpc_pb_1.SecurityClient, 8082],
    ['TransactionService', TransactionService_1.TransactionService, transaction_service_grpc_pb_1.TransactionClient, 8082],
    ['PortfolioService', PortfolioService_1.PortfolioService, portfolio_service_grpc_pb_1.PortfolioClient, 8082],
    ['PositionService', PositionService_1.PositionService, position_service_grpc_pb_1.PositionClient, 8082],
];
function onlyCall(Client) {
    const mock = Client;
    expect(mock).toHaveBeenCalledTimes(1);
    return mock.mock.calls[0];
}
function sentMetadata(interceptor) {
    const nextStart = jest.fn();
    const fakeNextCall = {
        start: nextStart,
        cancelWithStatus: jest.fn(),
        getPeer: jest.fn(),
        sendMessageWithContext: jest.fn(),
        sendMessage: jest.fn(),
        startRead: jest.fn(),
        halfClose: jest.fn(),
        setCredentials: jest.fn(),
    };
    const call = interceptor({}, jest.fn(() => fakeNextCall));
    call.start(new grpc.Metadata(), {});
    expect(nextStart).toHaveBeenCalledTimes(1);
    return nextStart.mock.calls[0][0];
}
describe.each(clients)('%s', (_name, Wrapper, Client, apiUrlPort) => {
    describe('with BROKER_HOST=127.0.0.1:8085 and API_URL=localhost', () => {
        beforeEach(() => {
            setEnv('BROKER_HOST', '127.0.0.1:8085');
            setEnv('API_URL', 'localhost');
        });
        test('targets the broker over an insecure channel', () => {
            const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
            const ssl = jest.spyOn(grpc.credentials, 'createSsl');
            new Wrapper();
            const [address, credentials] = onlyCall(Client);
            expect(address).toBe('127.0.0.1:8085');
            expect(address).not.toBe('localhost:8082');
            expect(insecure).toHaveBeenCalledTimes(1);
            expect(credentials).toBe(insecure.mock.results[0].value);
            expect(ssl).not.toHaveBeenCalled();
        });
        test('with an API key, targets the broker and sends x-api-key', () => {
            const ssl = jest.spyOn(grpc.credentials, 'createSsl');
            new Wrapper('k');
            const [address, , options] = onlyCall(Client);
            expect(address).toBe('127.0.0.1:8085');
            expect(ssl).not.toHaveBeenCalled();
            const { interceptors } = options;
            expect(interceptors).toHaveLength(1);
            expect(sentMetadata(interceptors[0]).get('x-api-key')).toEqual(['k']);
        });
    });
    test(`with only API_URL=localhost, targets localhost:${apiUrlPort}`, () => {
        setEnv('API_URL', 'localhost');
        new Wrapper();
        const [address] = onlyCall(Client);
        expect(address).toBe(`localhost:${apiUrlPort}`);
    });
    test('a client built after the environment changes uses the new address', () => {
        setEnv('BROKER_HOST', '127.0.0.1:8085');
        new Wrapper();
        expect(onlyCall(Client)[0]).toBe('127.0.0.1:8085');
        Client.mockClear();
        setEnv('BROKER_HOST', 'broker.example:9000');
        new Wrapper();
        expect(onlyCall(Client)[0]).toBe('broker.example:9000');
    });
});
describe('PortfolioService.url', () => {
    test('is a getter, read on every access', () => {
        var _a;
        expect(typeof ((_a = Object.getOwnPropertyDescriptor(PortfolioService_1.PortfolioService, 'url')) === null || _a === void 0 ? void 0 : _a.get)).toBe('function');
        setEnv('BROKER_HOST', '127.0.0.1:8085');
        expect(PortfolioService_1.PortfolioService.url).toBe('127.0.0.1:8085');
        setEnv('BROKER_HOST', 'broker.example:9000');
        expect(PortfolioService_1.PortfolioService.url).toBe('broker.example:9000');
    });
});
describe('LinkResolver default clients', () => {
    test('target the broker', () => {
        setEnv('BROKER_HOST', '127.0.0.1:8085');
        setEnv('API_URL', 'localhost');
        new link_resolver_1.default();
        for (const Client of [security_service_grpc_pb_1.SecurityClient, portfolio_service_grpc_pb_1.PortfolioClient, transaction_service_grpc_pb_1.TransactionClient]) {
            expect(onlyCall(Client)[0]).toBe('127.0.0.1:8085');
        }
    });
});
//# sourceMappingURL=serviceaddress.clients.test.js.map