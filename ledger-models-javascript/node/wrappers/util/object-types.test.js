"use strict";
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
// Object type and version (LM-297, LM-318): `stamp` writes object_type = 1
// and version = 2 (0.0.1), and bytes from earlier releases are not readable.
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const decimal_js_1 = require("decimal.js");
const object_type_pb_1 = require("../../fintekkers/models/util/object_type_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const transaction_type_pb_1 = require("../../fintekkers/models/transaction/transaction_type_pb");
const position_pb_1 = require("../../fintekkers/models/position/position_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
const query_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_response_pb");
const summary_pb_1 = require("../../fintekkers/requests/util/errors/summary_pb");
const objectTypes = __importStar(require("./object-types"));
const link_resolver_1 = __importDefault(require("./link-resolver"));
const Price_1 = __importDefault(require("../models/price/Price"));
const security_1 = __importDefault(require("../models/security/security"));
const portfolio_1 = __importDefault(require("../models/portfolio/portfolio"));
const transaction_1 = __importDefault(require("../models/transaction/transaction"));
const transaction_type_1 = require("../models/transaction/transaction_type");
const positionfilter_1 = require("../models/position/positionfilter");
const QueryPositionRequest_1 = require("../requests/position/QueryPositionRequest");
const uuid_1 = require("../models/utils/uuid");
const datetime_1 = require("../models/utils/datetime");
const PriceService_1 = require("../services/price-service/PriceService");
const SecurityService_1 = require("../services/security-service/SecurityService");
const TransactionService_1 = require("../services/transaction-service/TransactionService");
const PortfolioService_1 = require("../services/portfolio-service/PortfolioService");
// A PriceProto written by ledger-models v0.4.33: object_class / version
// strings in fields 1 and 2.
const OLD_PRICE = path.resolve(__dirname, '../../../../ledger-models-protos/fixtures/legacy_v0433/price.bin');
// ---- stamp round-trips (metric 2) ----
test('a stamped price round-trips type and version', () => {
    const price = objectTypes.stamp(new price_pb_1.PriceProto(), object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE);
    const bytes = price.serializeBinary();
    // Exactly field 1 (varint 11) and field 2 ({patch: 1}): nothing at the
    // removed 1001-1004.
    expect(Array.from(bytes)).toEqual([0x08, 11, 0x12, 0x02, 0x18, 0x01]);
    const reread = price_pb_1.PriceProto.deserializeBinary(bytes);
    expect(objectTypes.readType(reread)).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE);
    expect(objectTypes.readVersion(reread)).toEqual([0, 0, 1]);
    const version = reread.getVersion();
    expect([version.getMajor(), version.getMinor(), version.getPatch()]).toEqual([0, 0, 1]);
    // Nothing unknown kept on re-serialising.
    expect(Array.from(reread.serializeBinary())).toEqual(Array.from(bytes));
});
test('an unstamped message reads as unknown and absent', () => {
    const price = price_pb_1.PriceProto.deserializeBinary(new price_pb_1.PriceProto().serializeBinary());
    expect(objectTypes.readType(price)).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
    expect(objectTypes.readVersion(price)).toBeUndefined();
});
// ---- Old bytes are not readable (metric 3) ----
test('bytes from v0.4.33 are not readable', () => {
    // Field 2 held the string "0.0.1", which does not parse as a VersionProto.
    const old = new Uint8Array(fs.readFileSync(OLD_PRICE));
    expect(() => price_pb_1.PriceProto.deserializeBinary(old)).toThrow();
});
// ---- Every library writer stamps the new form (metric 2) ----
/** A service with its gRPC client swapped for one that records each request. */
function capturingService(cls, response) {
    const requests = [];
    const unary = (request, callback) => {
        requests.push(request);
        callback(null, response());
    };
    const stream = (request) => {
        requests.push(request);
        const handlers = {};
        setImmediate(() => { var _a; return (_a = handlers.end) === null || _a === void 0 ? void 0 : _a.call(handlers); });
        return { on(event, handler) { handlers[event] = handler; return this; } };
    };
    const service = Object.create(cls.prototype);
    service.client = {
        validateCreateOrUpdate: unary, search: stream,
    };
    return { service, requests };
}
const asOf = datetime_1.ZonedDateTime.now().toProto();
const filter = () => new positionfilter_1.PositionFilter();
function security() {
    return security_1.default.create(new security_pb_1.SecurityProto().setUuid(uuid_1.UUID.random().toUUIDProto()).setAssetClass('Equity'));
}
function portfolio() {
    return new portfolio_1.default(new portfolio_pb_1.PortfolioProto().setUuid(uuid_1.UUID.random().toUUIDProto()).setPortfolioName('P').setAsOf(asOf));
}
function linkResolverRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        const requests = [];
        const client = (response) => ({
            getByIds: (request, callback) => {
                requests.push(request);
                callback(null, response());
            },
        });
        const resolver = new link_resolver_1.default({
            securityClient: client(() => new query_security_response_pb_1.QuerySecurityResponseProto()),
            portfolioClient: client(() => new query_portfolio_response_pb_1.QueryPortfolioResponseProto()),
            transactionClient: client(() => new query_transaction_response_pb_1.QueryTransactionResponseProto()),
        });
        // Nothing comes back, so each lookup rejects as not found.
        yield expect(resolver.getSecurity(uuid_1.UUID.random())).rejects.toThrow();
        yield expect(resolver.getPortfolio(uuid_1.UUID.random())).rejects.toThrow();
        yield expect(resolver.getTransaction(uuid_1.UUID.random())).rejects.toThrow();
        return requests;
    });
}
function lastRequest(cls, call) {
    return __awaiter(this, void 0, void 0, function* () {
        const { service, requests } = capturingService(cls, () => new summary_pb_1.SummaryProto());
        yield call(service);
        return requests[requests.length - 1];
    });
}
const LIBRARY_WRITERS = [
    ['Price.fromSimple', () => __awaiter(void 0, void 0, void 0, function* () { return Price_1.default.fromSimple(uuid_1.UUID.random().toString(), 1, new Date()).proto; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE],
    ['Price.create', () => __awaiter(void 0, void 0, void 0, function* () { return Price_1.default.create(new decimal_js_1.Decimal(1), security(), datetime_1.ZonedDateTime.now()).proto; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE],
    ['PositionFilter.toProto', () => __awaiter(void 0, void 0, void 0, function* () { return filter().toProto(); }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER],
    ['QueryPositionRequest.toProto', () => __awaiter(void 0, void 0, void 0, function* () {
            return new QueryPositionRequest_1.QueryPositionRequest(filter(), position_pb_1.PositionTypeProto.TRANSACTION, position_pb_1.PositionViewProto.DEFAULT_VIEW, [], [], datetime_1.ZonedDateTime.now()).toProto();
        }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST],
    ['Transaction', () => __awaiter(void 0, void 0, void 0, function* () { return transaction().proto; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_TRANSACTION],
    ['Transaction strategy allocation', () => __awaiter(void 0, void 0, void 0, function* () { return transaction().proto.getStrategyAllocation(); }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION],
    ['PriceService.validateCreateOrUpdate', () => lastRequest(PriceService_1.PriceService, (s) => s.validateCreateOrUpdate(new price_pb_1.PriceProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST],
    ['PriceService.search', () => lastRequest(PriceService_1.PriceService, (s) => s.search(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST],
    ['SecurityService.validateCreateSecurity', () => lastRequest(SecurityService_1.SecurityService, (s) => s.validateCreateSecurity(new security_pb_1.SecurityProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST],
    ['SecurityService.searchSecurity', () => lastRequest(SecurityService_1.SecurityService, (s) => s.searchSecurity(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
    ['TransactionService.validateCreateTransaction', () => lastRequest(TransactionService_1.TransactionService, (s) => s.validateCreateTransaction({ proto: new transaction_pb_1.TransactionProto() })),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST],
    ['TransactionService.searchTransaction', () => lastRequest(TransactionService_1.TransactionService, (s) => s.searchTransaction(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
    ['PortfolioService.validateCreatePortfolio', () => lastRequest(PortfolioService_1.PortfolioService, (s) => s.validateCreatePortfolio(new portfolio_pb_1.PortfolioProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST],
    ['PortfolioService.searchPortfolio', () => lastRequest(PortfolioService_1.PortfolioService, (s) => s.searchPortfolio(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
    ['LinkResolver securities', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[0]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
    ['LinkResolver portfolios', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[1]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
    ['LinkResolver transactions', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[2]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
];
function transaction() {
    return new transaction_1.default({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('100.50'),
        security: security(),
        transactionType: new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY),
        portfolio: portfolio(),
        quantity: new decimal_js_1.Decimal('10'),
    });
}
test.each(LIBRARY_WRITERS)('%s stamps the type and schema version', (_name, build, type) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield build();
    expect(objectTypes.readType(message)).toBe(type);
    expect(objectTypes.readVersion(message)).toEqual(objectTypes.SCHEMA_VERSION);
    expect(objectTypes.SCHEMA_VERSION).toEqual([0, 0, 1]);
}));
//# sourceMappingURL=object-types.test.js.map