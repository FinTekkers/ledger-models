"use strict";
// Verifies SecurityService / PortfolioService / PriceService / TransactionService
// each populate LinkCache on a successful createOrUpdate. Pure unit tests —
// the gRPC client is replaced via Object.assign on the service instance so we
// never hit the wire.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("../models/utils/uuid");
const datetime_1 = require("../models/utils/datetime");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const create_security_response_pb_1 = require("../../fintekkers/requests/security/create_security_response_pb");
const create_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/create_portfolio_response_pb");
const create_price_response_pb_1 = require("../../fintekkers/requests/price/create_price_response_pb");
const create_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/create_transaction_response_pb");
const SecurityService_1 = require("./security-service/SecurityService");
const PortfolioService_1 = require("./portfolio-service/PortfolioService");
const PriceService_1 = require("./price-service/PriceService");
const TransactionService_1 = require("./transaction-service/TransactionService");
const transaction_1 = __importDefault(require("../models/transaction/transaction"));
const LinkCacheModule = __importStar(require("../util/link-cache"));
function makeAsOf(epochSecondsOffset = 0) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(1700000000 + epochSecondsOffset);
    ts.setNanos(0);
    const proto = new local_timestamp_pb_1.LocalTimestampProto();
    proto.setTimestamp(ts);
    proto.setTimeZone('UTC');
    return proto;
}
/**
 * Build a fake gRPC client that returns a pre-canned response on
 * createOrUpdate. Mimics the callback shape the real grpc-js client uses,
 * since the service wraps it with `promisify`.
 */
function fakeClient(response) {
    return {
        createOrUpdate(_req, cb) {
            cb(null, response);
        },
    };
}
beforeEach(() => {
    LinkCacheModule.SECURITY.clear();
    LinkCacheModule.PORTFOLIO.clear();
    LinkCacheModule.PRICE.clear();
    LinkCacheModule.TRANSACTION.clear();
});
test('SecurityService.createSecurity populates LinkCache.SECURITY', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(0);
    const persisted = new security_pb_1.SecurityProto();
    persisted.setUuid(uuid.toUUIDProto());
    persisted.setAsOf(asOf);
    persisted.setIssuerName('ACME');
    const response = new create_security_response_pb_1.CreateSecurityResponseProto();
    response.setSecurityResponse(persisted);
    const svc = new SecurityService_1.SecurityService();
    svc.client = fakeClient(response);
    yield svc.createSecurity(new security_pb_1.SecurityProto());
    const cached = LinkCacheModule.SECURITY.get(uuid.toString(), new datetime_1.ZonedDateTime(asOf));
    expect(cached).toBeDefined();
    expect(cached.getIssuerName()).toBe('ACME');
}));
test('PortfolioService.createPortfolio populates LinkCache.PORTFOLIO', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(1);
    const persisted = new portfolio_pb_1.PortfolioProto();
    persisted.setUuid(uuid.toUUIDProto());
    persisted.setAsOf(asOf);
    persisted.setPortfolioName('Strategy Z');
    const response = new create_portfolio_response_pb_1.CreatePortfolioResponseProto();
    response.addPortfolioResponse(persisted);
    const svc = new PortfolioService_1.PortfolioService();
    svc.client = fakeClient(response);
    yield svc.createPortfolio(new portfolio_pb_1.PortfolioProto());
    const cached = LinkCacheModule.PORTFOLIO.get(uuid.toString(), new datetime_1.ZonedDateTime(asOf));
    expect(cached).toBeDefined();
    expect(cached.getPortfolioName()).toBe('Strategy Z');
}));
test('PriceService.createOrUpdate populates LinkCache.PRICE', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(2);
    const persisted = new price_pb_1.PriceProto();
    persisted.setUuid(uuid.toUUIDProto());
    persisted.setAsOf(asOf);
    const response = new create_price_response_pb_1.CreatePriceResponseProto();
    response.addPriceResponse(persisted);
    const svc = new PriceService_1.PriceService();
    svc.client = fakeClient(response);
    yield svc.createOrUpdate(new price_pb_1.PriceProto());
    const cached = LinkCacheModule.PRICE.get(uuid.toString(), new datetime_1.ZonedDateTime(asOf));
    expect(cached).toBeDefined();
}));
test('TransactionService.createTransaction populates LinkCache.TRANSACTION', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(3);
    const persisted = new transaction_pb_1.TransactionProto();
    persisted.setUuid(uuid.toUUIDProto());
    persisted.setAsOf(asOf);
    const response = new create_transaction_response_pb_1.CreateTransactionResponseProto();
    response.setTransactionResponse(persisted);
    const svc = new TransactionService_1.TransactionService();
    svc.client = fakeClient(response);
    yield svc.createTransaction(new transaction_1.default(new transaction_pb_1.TransactionProto()));
    const cached = LinkCacheModule.TRANSACTION.get(uuid.toString(), new datetime_1.ZonedDateTime(asOf));
    expect(cached).toBeDefined();
}));
//# sourceMappingURL=service-client-writethrough.test.js.map