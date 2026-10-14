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
const ts = __importStar(require("typescript"));
const jspb = __importStar(require("google-protobuf"));
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
const product_type_pb_1 = require("../../fintekkers/models/security/product_type_pb");
const identifier_pb_1 = require("../../fintekkers/models/security/identifier/identifier_pb");
const coupon_type_pb_1 = require("../../fintekkers/models/security/coupon_type_pb");
const coupon_frequency_pb_1 = require("../../fintekkers/models/security/coupon_frequency_pb");
const index_type_pb_1 = require("../../fintekkers/models/security/index/index_type_pb");
const agency_pb_1 = require("../../fintekkers/models/security/bond/agency_pb");
const create_price_response_pb_1 = require("../../fintekkers/requests/price/create_price_response_pb");
const create_security_response_pb_1 = require("../../fintekkers/requests/security/create_security_response_pb");
const create_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/create_transaction_response_pb");
const create_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/create_portfolio_response_pb");
const objectTypes = __importStar(require("./object-types"));
const link_resolver_1 = __importDefault(require("./link-resolver"));
const Price_1 = __importDefault(require("../models/price/Price"));
const security_1 = __importDefault(require("../models/security/security"));
const BondSecurity_1 = __importStar(require("../models/security/BondSecurity"));
const TIPSBond_1 = __importDefault(require("../models/security/TIPSBond"));
const FloatingRateNote_1 = __importDefault(require("../models/security/FloatingRateNote"));
const MortgageBackedSecurity_1 = __importDefault(require("../models/security/MortgageBackedSecurity"));
const identifier_1 = require("../models/security/identifier");
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
const PositionService_1 = require("../services/position-service/PositionService");
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
// ---- Every library builder stamps what it builds (metric 2; LM-324) ----
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
        validateCreateOrUpdate: unary, createOrUpdate: unary, validateQueryRequest: unary, search: stream,
    };
    return { service, requests };
}
const asOf = datetime_1.ZonedDateTime.now().toProto();
const filter = () => new positionfilter_1.PositionFilter();
function security(caller) {
    return security_1.default.create(caller(new security_pb_1.SecurityProto().setUuid(uuid_1.UUID.random().toUUIDProto()).setAssetClass('Equity')));
}
function portfolio(caller) {
    return new portfolio_1.default(caller(new portfolio_pb_1.PortfolioProto().setUuid(uuid_1.UUID.random().toUUIDProto()).setPortfolioName('P').setAsOf(asOf)));
}
const BOND_INPUTS = {
    faceValue: new decimal_js_1.Decimal('1000'),
    couponRate: new decimal_js_1.Decimal('0.05'),
    couponType: coupon_type_pb_1.CouponTypeProto.FIXED,
    couponFrequency: coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY,
    issueDate: new Date(2024, 0, 1),
    maturityDate: new Date(2034, 0, 1),
};
function bond(caller) {
    return security_1.default.create(caller(new security_pb_1.SecurityProto().setUuid(uuid_1.UUID.random().toUUIDProto())
        .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE).setBondDetails((0, BondSecurity_1.buildBondDetails)(BOND_INPUTS))));
}
function transaction(caller, onSecurity = security(caller)) {
    return new transaction_1.default({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('100.50'),
        security: onSecurity,
        transactionType: new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY),
        portfolio: portfolio(caller),
        quantity: new decimal_js_1.Decimal('10'),
    });
}
/** A LinkResolver whose clients record each request and find nothing. */
function capturingResolver() {
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
    return { resolver, requests };
}
/** The request a LinkResolver call sends. Nothing comes back, so a lookup may reject as not found. */
function resolverRequest(call) {
    return __awaiter(this, void 0, void 0, function* () {
        const { resolver, requests } = capturingResolver();
        yield call(resolver).catch(() => undefined);
        expect(requests).toHaveLength(1);
        return requests[0];
    });
}
function lastRequest(cls, call, response = () => new summary_pb_1.SummaryProto()) {
    return __awaiter(this, void 0, void 0, function* () {
        const { service, requests } = capturingService(cls, response);
        yield call(service);
        return requests[requests.length - 1];
    });
}
const B = (name, type, build) => ({ name, type, build });
const T = object_type_pb_1.ObjectTypeProto;
const linkUuid = () => uuid_1.UUID.random();
const linkedPrice = (caller) => new Price_1.default(caller(new price_pb_1.PriceProto().setSecurity(security_1.default.linkOfLatest(linkUuid()))));
const linkedTransaction = (caller) => new transaction_1.default(caller(new transaction_pb_1.TransactionProto().setIsLink(true)
    .setPortfolio(new portfolio_pb_1.PortfolioProto().setIsLink(true).setUuid(linkUuid().toUUIDProto()))));
/** Every public builder, by publicBuilders() key. */
const BUILDERS = [
    B('Security.linkOf', T.OBJECT_TYPE_SECURITY, () => security_1.default.linkOf(linkUuid(), datetime_1.ZonedDateTime.now())),
    B('Security.linkOfLatest', T.OBJECT_TYPE_SECURITY, () => security_1.default.linkOfLatest(linkUuid())),
    B('BondSecurity.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => BondSecurity_1.default.fromPricerInputs(BOND_INPUTS)),
    B('TIPSBond.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => TIPSBond_1.default.fromPricerInputs(Object.assign(Object.assign({}, BOND_INPUTS), { baseCpi: new decimal_js_1.Decimal('300'), indexDate: new Date(2024, 0, 1), inflationIndexType: index_type_pb_1.IndexTypeProto.CPI_U }))),
    B('FloatingRateNote.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => FloatingRateNote_1.default.fromPricerInputs(Object.assign(Object.assign({}, BOND_INPUTS), { spread: new decimal_js_1.Decimal('0.001'), referenceRateIndex: index_type_pb_1.IndexTypeProto.SOFR, resetFrequency: coupon_frequency_pb_1.CouponFrequencyProto.MONTHLY }))),
    B('MortgageBackedSecurity.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => MortgageBackedSecurity_1.default.fromPricerInputs(Object.assign(Object.assign({}, BOND_INPUTS), { poolNumber: 'FN AS1234', agency: agency_pb_1.AgencyProto.FNMA, wac: new decimal_js_1.Decimal('0.045'), wam: 358, passThroughRate: new decimal_js_1.Decimal('0.04'), currentFactor: new decimal_js_1.Decimal('0.95'), originalFaceValue: new decimal_js_1.Decimal('1000'), currentUpb: new decimal_js_1.Decimal('950'), psaSpeed: new decimal_js_1.Decimal('150') }))),
    B('Identifier.fromName', T.OBJECT_TYPE_IDENTIFIER, () => identifier_1.Identifier.fromName('ISIN', 'US0378331005')),
    B('Price.fromSimple', T.OBJECT_TYPE_PRICE, () => Price_1.default.fromSimple(uuid_1.UUID.random().toString(), 1, new Date())),
    B('Price.create', T.OBJECT_TYPE_PRICE, (c) => Price_1.default.create(new decimal_js_1.Decimal(1), security(c), datetime_1.ZonedDateTime.now())),
    B('Price.getCashPrice', T.OBJECT_TYPE_PRICE, (c) => Price_1.default.getCashPrice(security(c), datetime_1.ZonedDateTime.now())),
    B('PositionFilter.toProto', T.OBJECT_TYPE_POSITION_FILTER, () => filter().toProto()),
    B('QueryPositionRequest.toProto', T.OBJECT_TYPE_QUERY_POSITION_REQUEST, () => new QueryPositionRequest_1.QueryPositionRequest(filter(), position_pb_1.PositionTypeProto.TRANSACTION, position_pb_1.PositionViewProto.DEFAULT_VIEW, [], [], datetime_1.ZonedDateTime.now()).toProto()),
    B('Transaction.constructor', T.OBJECT_TYPE_TRANSACTION, (c) => transaction(c)),
    B('Transaction.createCashTransaction', T.OBJECT_TYPE_TRANSACTION, (c) => transaction_1.default.createCashTransaction(security(c), transaction(c))),
    B('Transaction.addCashImpact', T.OBJECT_TYPE_TRANSACTION, (c) => {
        const parent = transaction(c);
        transaction_1.default.addCashImpact(parent, security(c));
        return parent.getChildrenTransactions();
    }),
    B('Transaction.addMaturationTransaction', T.OBJECT_TYPE_TRANSACTION, (c) => {
        const parent = transaction(c, bond(c));
        transaction_1.default.addMaturationTransaction(parent, new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.MATURATION), security(c));
        return parent.getChildrenTransactions();
    }),
    B('Transaction.addDerivedTransactions', T.OBJECT_TYPE_TRANSACTION, (c) => {
        const parent = transaction(c, bond(c));
        transaction_1.default.addDerivedTransactions(parent, security(c));
        return parent.getChildrenTransactions();
    }),
    B('PriceService.validateCreateOrUpdate', T.OBJECT_TYPE_CREATE_PRICE_REQUEST, (c) => lastRequest(PriceService_1.PriceService, (s) => s.validateCreateOrUpdate(c(new price_pb_1.PriceProto())))),
    B('PriceService.createOrUpdate', T.OBJECT_TYPE_CREATE_PRICE_REQUEST, (c) => lastRequest(PriceService_1.PriceService, (s) => s.createOrUpdate(c(new price_pb_1.PriceProto())), () => new create_price_response_pb_1.CreatePriceResponseProto())),
    B('PriceService.search', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService_1.PriceService, (s) => s.search(asOf, filter()))),
    B('PriceService.searchPrice', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService_1.PriceService, (s) => s.searchPrice(asOf, filter()))),
    B('PriceService.searchPriceAsOfNow', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService_1.PriceService, (s) => s.searchPriceAsOfNow(filter()))),
    B('PriceService.searchBySecurityId', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService_1.PriceService, (s) => s.searchBySecurityId(uuid_1.UUID.random().toString(), asOf))),
    B('PriceService.searchWithSecurities', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService_1.PriceService, (s) => s.searchWithSecurities(asOf, filter(), capturingResolver().resolver))),
    B('SecurityService.validateCreateSecurity', T.OBJECT_TYPE_CREATE_SECURITY_REQUEST, (c) => lastRequest(SecurityService_1.SecurityService, (s) => s.validateCreateSecurity(c(new security_pb_1.SecurityProto())))),
    B('SecurityService.createSecurity', T.OBJECT_TYPE_CREATE_SECURITY_REQUEST, (c) => lastRequest(SecurityService_1.SecurityService, (s) => s.createSecurity(c(new security_pb_1.SecurityProto())), () => new create_security_response_pb_1.CreateSecurityResponseProto())),
    B('SecurityService.searchSecurity', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, () => lastRequest(SecurityService_1.SecurityService, (s) => s.searchSecurity(asOf, filter()))),
    B('SecurityService.searchSecurityAsOfNow', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, () => lastRequest(SecurityService_1.SecurityService, (s) => s.searchSecurityAsOfNow(filter()))),
    B('TransactionService.validateCreateTransaction', T.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST, (c) => lastRequest(TransactionService_1.TransactionService, (s) => s.validateCreateTransaction({ proto: c(new transaction_pb_1.TransactionProto()) }))),
    B('TransactionService.createTransaction', T.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST, (c) => lastRequest(TransactionService_1.TransactionService, (s) => s.createTransaction({ proto: c(new transaction_pb_1.TransactionProto()) }), () => new create_transaction_response_pb_1.CreateTransactionResponseProto())),
    B('TransactionService.searchTransaction', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, () => lastRequest(TransactionService_1.TransactionService, (s) => s.searchTransaction(asOf, filter()))),
    B('TransactionService.searchWithSecurityAndPortfolio', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, () => lastRequest(TransactionService_1.TransactionService, (s) => s.searchWithSecurityAndPortfolio(asOf, filter(), 100, capturingResolver().resolver))),
    B('PortfolioService.validateCreatePortfolio', T.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST, (c) => lastRequest(PortfolioService_1.PortfolioService, (s) => s.validateCreatePortfolio(c(new portfolio_pb_1.PortfolioProto())))),
    B('PortfolioService.createPortfolio', T.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST, (c) => lastRequest(PortfolioService_1.PortfolioService, (s) => s.createPortfolio(c(new portfolio_pb_1.PortfolioProto())), () => new create_portfolio_response_pb_1.CreatePortfolioResponseProto())),
    B('PortfolioService.searchPortfolio', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, () => lastRequest(PortfolioService_1.PortfolioService, (s) => s.searchPortfolio(asOf, filter()))),
    B('PositionService.validateRequest', T.OBJECT_TYPE_QUERY_POSITION_REQUEST, () => lastRequest(PositionService_1.PositionService, (s) => s.validateRequest(QueryPositionRequest_1.QueryPositionRequest.from([], [])))),
    B('PositionService.search', T.OBJECT_TYPE_QUERY_POSITION_REQUEST, () => lastRequest(PositionService_1.PositionService, (s) => s.search(QueryPositionRequest_1.QueryPositionRequest.from([], [])))),
    B('LinkResolver.getSecurity', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, () => resolverRequest((r) => r.getSecurity(linkUuid()))),
    B('LinkResolver.getPortfolio', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, () => resolverRequest((r) => r.getPortfolio(linkUuid()))),
    B('LinkResolver.getTransaction', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, () => resolverRequest((r) => r.getTransaction(linkUuid()))),
    B('LinkResolver.resolveSecurities', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, (c) => resolverRequest((r) => r.resolveSecurities([linkedPrice(c)]))),
    B('LinkResolver.resolvePortfolios', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, (c) => resolverRequest((r) => r.resolvePortfolios([linkedTransaction(c)]))),
];
/** The messages a builder returned: wrappers are read through `proto`, arrays item by item. */
function messagesOf(built) {
    return (Array.isArray(built) ? built : [built]).map((item) => {
        const message = item instanceof jspb.Message ? item : item === null || item === void 0 ? void 0 : item.proto;
        if (!(message instanceof jspb.Message))
            throw new Error(`not a message or a wrapper of one: ${String(item)}`);
        return message;
    });
}
// jspb.Message's own getters (getExtension, getJsPbMessageId, ...) are not fields.
const JSPB_GETTERS = new Set(Object.getOwnPropertyNames(jspb.Message.prototype));
/** The zero-argument field getters of a generated message. */
function fieldGetters(message) {
    const names = [];
    for (let proto = Object.getPrototypeOf(message); proto && proto !== jspb.Message.prototype; proto = Object.getPrototypeOf(proto)) {
        for (const name of Object.getOwnPropertyNames(proto)) {
            const getter = proto[name];
            if (name.startsWith('get') && !JSPB_GETTERS.has(name) && typeof getter === 'function' && getter.length === 0)
                names.push(name);
        }
    }
    return names;
}
/**
 * Visits `root` and every nested message (singular and repeated fields; no
 * message with object_type has a map field of messages today). `callers`
 * holds the protos the caller passed in: they are passed through as is, so
 * they and what they hold are not checked here.
 */
function untypedMessages(root, callers = new Set()) {
    const walk = { untyped: [], typed: 0 };
    (function visit(value, at) {
        if (Array.isArray(value)) {
            value.forEach((item, i) => visit(item, `${at}[${i}]`));
            return;
        }
        if (!(value instanceof jspb.Message) || callers.has(value))
            return;
        const own = objectTypes.ownType(value);
        if (own !== undefined) {
            walk.typed++;
            const message = value;
            if (objectTypes.readType(message) !== own || String(objectTypes.readVersion(message)) !== String(objectTypes.SCHEMA_VERSION)) {
                walk.untyped.push(at);
            }
        }
        for (const getter of fieldGetters(value)) {
            visit(value[getter](), `${at}.${getter}`);
        }
    })(root, '$');
    return walk;
}
test.each(BUILDERS.map((row) => [row.name, row]))('%s stamps every message it builds', (_name, row) => __awaiter(void 0, void 0, void 0, function* () {
    const callers = new Set();
    const messages = messagesOf(yield row.build((proto) => { callers.add(proto); return proto; }));
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
        expect(objectTypes.readType(message)).toBe(row.type);
        const walk = untypedMessages(message, callers);
        expect(walk.untyped).toEqual([]);
        expect(walk.typed).toBeGreaterThan(0);
    }
    // Callers' protos are not re-stamped (LM-322's pass-through ruling).
    for (const proto of callers) {
        expect(objectTypes.readType(proto)).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
        expect(objectTypes.readVersion(proto)).toBeUndefined();
    }
    expect(objectTypes.SCHEMA_VERSION).toEqual([0, 0, 1]);
}));
test("callers' protos pass through as the same unstamped object", () => __awaiter(void 0, void 0, void 0, function* () {
    const securityProto = new security_pb_1.SecurityProto().setUuid(uuid_1.UUID.random().toUUIDProto());
    const price = Price_1.default.create(new decimal_js_1.Decimal(1), new security_1.default(securityProto), datetime_1.ZonedDateTime.now());
    expect(price.proto.getSecurity()).toBe(securityProto);
    const callers = [];
    const txn = transaction((proto) => { callers.push(proto); return proto; });
    const [txnSecurity, txnPortfolio] = callers;
    expect(txn.proto.getSecurity()).toBe(txnSecurity);
    expect(txn.proto.getPortfolio()).toBe(txnPortfolio);
    const input = new security_pb_1.SecurityProto();
    const request = yield lastRequest(SecurityService_1.SecurityService, (s) => s.validateCreateSecurity(input));
    expect(request.getSecurityInput()).toBe(input);
    for (const proto of [securityProto, txnSecurity, txnPortfolio, input]) {
        expect(objectTypes.readType(proto)).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
        expect(objectTypes.readVersion(proto)).toBeUndefined();
    }
}));
test('Price.fromSimple builds its security link, so the link is stamped, not passed through', () => {
    const callers = new Set();
    const row = BUILDERS.find((b) => b.name === 'Price.fromSimple');
    const price = messagesOf(row.build((proto) => { callers.add(proto); return proto; }))[0];
    expect(callers.size).toBe(0);
    const link = price.getSecurity();
    expect(objectTypes.readType(link)).toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY);
    expect(objectTypes.readVersion(link)).toEqual(objectTypes.SCHEMA_VERSION);
});
// ---- The walker finds what it must (it cannot pass by not looking) ----
const stampedPrice = () => objectTypes.stampOwn(new price_pb_1.PriceProto());
const stampedSecurity = () => objectTypes.stampOwn(new security_pb_1.SecurityProto());
test('the walker reports an unstamped nested message', () => {
    const walk = untypedMessages(stampedPrice().setSecurity(new security_pb_1.SecurityProto()));
    expect(walk.untyped).toEqual(['$.getSecurity']);
    expect(walk.typed).toBe(2);
});
test('the walker reports an unstamped message in a repeated field', () => {
    const security = stampedSecurity().setIdentifiersList([objectTypes.stampOwn(new identifier_pb_1.IdentifierProto()), new identifier_pb_1.IdentifierProto()]);
    expect(untypedMessages(security).untyped).toEqual(['$.getIdentifiersList[1]']);
});
test('the walker reports a message stamped with another type', () => {
    const security = objectTypes.stamp(new security_pb_1.SecurityProto(), object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE);
    expect(untypedMessages(stampedPrice().setSecurity(security)).untyped).toEqual(['$.getSecurity']);
});
test('the walker reports a message with its type but no version', () => {
    const security = new security_pb_1.SecurityProto().setObjectType(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_SECURITY);
    expect(untypedMessages(stampedPrice().setSecurity(security)).untyped).toEqual(['$.getSecurity']);
});
test("the walker skips callers' protos", () => {
    const input = new security_pb_1.SecurityProto();
    expect(untypedMessages(stampedPrice().setSecurity(input), new Set([input]))).toEqual({ untyped: [], typed: 1 });
});
// ---- Every public builder is tested or excluded (metric line 2) ----
const WRAPPERS_DIR = path.resolve(__dirname, '..');
/** Every non-test, non-declaration .ts under node/wrappers/. The generated fintekkers/**_pb are not scanned. */
function wrapperSources(dir = WRAPPERS_DIR) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory())
            return wrapperSources(file);
        return /\.ts$/.test(entry.name) && !/\.(test|d)\.ts$/.test(entry.name) ? [file] : [];
    });
}
/**
 * Public callables under node/wrappers/ that build a message, keyed
 * `Class.method`, `Class.constructor` or `module.fn`, each with the rule that
 * flagged it. Builders are found by type, not by name:
 *   (a) the return type holds an ObjectTyped message (after Promise, array, union);
 *   (b) the return type holds a wrapper whose `proto` is one;
 *   (c) the body has `new X()` where X is (a) or (b);
 *   (d) the body calls a flagged callable, public or not, repeated to a fixpoint.
 * The service sources are scanned; only their integration tests are excluded
 * from `npm test` (jest.config.js).
 */
function publicBuilders() {
    var _a;
    const configFile = path.resolve(WRAPPERS_DIR, '../../tsconfig.json');
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configFile));
    const sources = wrapperSources();
    const program = ts.createProgram(sources, Object.assign(Object.assign({}, options), { noEmit: true }));
    const checker = program.getTypeChecker();
    const isMessage = (t) => !!t.getProperty('getObjectType') && !!t.getProperty('setVersion');
    const isWrapper = (t) => {
        const proto = t.getProperty('proto');
        return !!(proto === null || proto === void 0 ? void 0 : proto.valueDeclaration) && isMessage(checker.getTypeOfSymbolAtLocation(proto, proto.valueDeclaration));
    };
    // The (a) or (b) rule a type meets, or undefined.
    const builtBy = (t) => {
        var _a;
        const parts = t.isUnion() ? t.types : [t];
        for (const part of parts) {
            const unwrap = checker.isArrayType(part) || ((_a = part.getSymbol()) === null || _a === void 0 ? void 0 : _a.getName()) === 'Promise';
            const inner = unwrap ? checker.getTypeArguments(part)[0] : part;
            if (inner !== part) {
                const rule = builtBy(inner);
                if (rule)
                    return rule;
            }
            else if (isMessage(part)) {
                return `(a) returns ${checker.typeToString(part)}`;
            }
            else if (isWrapper(part)) {
                return `(b) returns ${checker.typeToString(part)}, which wraps a message`;
            }
        }
        return undefined;
    };
    const callables = new Map();
    const isPrivate = (m) => (!!m.name && ts.isPrivateIdentifier(m.name))
        || (ts.getCombinedModifierFlags(m) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) !== 0;
    for (const sourceFile of program.getSourceFiles().filter((f) => sources.includes(path.resolve(f.fileName)))) {
        const moduleName = path.basename(sourceFile.fileName, '.ts');
        const exported = new Set();
        const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
        for (let symbol of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
            if (symbol.flags & ts.SymbolFlags.Alias)
                symbol = checker.getAliasedSymbol(symbol);
            (_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a.forEach((d) => exported.add(d));
        }
        const signatureOf = (decl) => checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(decl));
        sourceFile.forEachChild(function visit(node) {
            if (ts.isFunctionDeclaration(node) && node.name && node.body) {
                callables.set(node, { key: `${moduleName}.${node.name.text}`, isPublic: exported.has(node), returns: signatureOf(node), bodies: [node.body] });
            }
            else if (ts.isVariableStatement(node)) {
                for (const d of node.declarationList.declarations) {
                    if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
                        callables.set(d.initializer, { key: `${moduleName}.${d.name.text}`, isPublic: exported.has(d), returns: signatureOf(d.initializer), bodies: [d.initializer.body] });
                    }
                }
            }
            else if (ts.isClassDeclaration(node) && node.name) {
                const className = node.name.text;
                const isPublic = exported.has(node);
                const ctor = node.members.find(ts.isConstructorDeclaration);
                const fieldInits = node.members.flatMap((m) => ts.isPropertyDeclaration(m) && m.initializer && !(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static) ? [m.initializer] : []);
                callables.set(ctor !== null && ctor !== void 0 ? ctor : node, {
                    key: `${className}.constructor`, isPublic,
                    returns: checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(node.name)),
                    bodies: [...((ctor === null || ctor === void 0 ? void 0 : ctor.body) ? [ctor.body] : []), ...fieldInits],
                });
                for (const m of node.members) {
                    if ((ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m)) && m.body && ts.isIdentifier(m.name)) {
                        callables.set(m, { key: `${className}.${m.name.text}`, isPublic: isPublic && !isPrivate(m), returns: signatureOf(m), bodies: [m.body] });
                    }
                }
            }
        });
    }
    const flagged = new Map();
    for (const [decl, c] of callables) {
        const rule = builtBy(c.returns);
        if (rule)
            flagged.set(decl, rule);
    }
    for (const [decl, c] of callables) {
        if (flagged.has(decl))
            continue;
        c.bodies.forEach(function visit(node) {
            if (flagged.has(decl))
                return;
            if (ts.isNewExpression(node)) {
                const rule = builtBy(checker.getTypeAtLocation(node));
                if (rule)
                    flagged.set(decl, `(c) ${node.getText().split('(')[0]}(): ${rule}`);
            }
            node.forEachChild(visit);
        });
    }
    // (d): calls to a flagged callable. `new X()` of a flagged class is already (c).
    for (let changed = true; changed;) {
        changed = false;
        for (const [decl, c] of callables) {
            if (flagged.has(decl))
                continue;
            c.bodies.forEach(function visit(node) {
                var _a;
                if (flagged.has(decl))
                    return;
                if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
                    const target = (_a = checker.getResolvedSignature(node)) === null || _a === void 0 ? void 0 : _a.declaration;
                    if (target && flagged.has(target)) {
                        flagged.set(decl, `(d) calls ${callables.get(target).key}`);
                        changed = true;
                    }
                }
                node.forEachChild(visit);
            });
        }
    }
    const builders = new Map();
    for (const [decl, rule] of flagged) {
        const c = callables.get(decl);
        if (c.isPublic)
            builders.set(c.key, rule);
    }
    return builders;
}
const RETURNS_STORED = 'an accessor: returns or wraps a proto it holds; builds nothing';
const WRAPS_CALLER = "wraps the caller's proto (pass-through ruling)";
const SERIALIZES = "converts values to untyped messages (dates, UUIDs, decimals) or returns the caller's Identifier proto as is";
const DESERIALIZES = 'decodes protos the caller or server sent into wrappers; builds no message';
/** Public callables the scan flags that build no message to stamp, each with its reason. */
const EXCLUSIONS = Object.assign(Object.assign({ 'object-types.stamp': 'the stamping helper itself (tested above)', 'object-types.stampOwn': 'the stamping helper itself (tested above)', 'price_rules.validate': 'local stand-in for null input; never returned or sent', 'price_rules.requireValid': 'local stand-in for null input; never returned or sent', 'Security.create': "picks the wrapper class for the caller's proto (pass-through ruling)", 'Position.fromJSON': DESERIALIZES, 'ProtoSerializationUtil.deserialize': DESERIALIZES, 'serialization.util.unpack': DESERIALIZES, 'LocalDate.toDate': DESERIALIZES, 'ProtoSerializationUtil.serialize': SERIALIZES, 'serialization.util.pack': SERIALIZES, 'PositionFilter.addFilter': SERIALIZES, 'PositionFilter.addEqualsFilter': SERIALIZES, 'PositionFilter.addEqualsStringFilter': SERIALIZES, 'PositionFilter.addObjectFilter': SERIALIZES, 'Security.hydrate': 'swaps in the proto LinkResolver.getSecurity fetched (that request is tested)', 'Portfolio.hydrate': 'swaps in the proto LinkResolver.getPortfolio fetched (that request is tested)', 'Transaction.hydrate': 'swaps in the proto LinkResolver.getTransaction fetched (that request is tested)' }, Object.fromEntries([
    'BondSecurity.constructor', 'FloatingRateNote.constructor', 'Identifier.constructor', 'IndexSecurity.constructor',
    'Issuance.constructor', 'MortgageBackedSecurity.constructor', 'Portfolio.constructor', 'Position.constructor',
    'Price.constructor', 'Security.constructor', 'TIPSBond.constructor',
].map((key) => [key, WRAPS_CALLER]))), Object.fromEntries([
    'BondSecurity.getIssuances', 'Price.getSecurity',
    'Position.getField', 'Position.getFieldDisplay', 'Position.getFieldValue', 'Position.getMeasureValue', 'Position.toString',
    'Security.getField', 'Security.getIdentifierByType', 'Security.getIdentifiers', 'Security.toString',
    'Transaction.getCashTransaction', 'Transaction.getChildrenTransactions', 'Transaction.getField', 'Transaction.getIssuerName',
    'Transaction.getPortfolio', 'Transaction.getPrice', 'Transaction.getSecurity', 'Transaction.getStrategyAllocation',
    'Transaction.isCashSecurity', 'Transaction.toString',
].map((key) => [key, RETURNS_STORED])));
describe('every public builder is tested or excluded (metric line 2)', () => {
    let scanned;
    beforeAll(() => { scanned = publicBuilders(); }, 60000);
    test('every public builder is tested or excluded', () => {
        const covered = new Set([...BUILDERS.map((b) => b.name), ...Object.keys(EXCLUSIONS)]);
        const missing = [...scanned].filter(([key]) => !covered.has(key)).map(([key, rule]) => `${key}: rule ${rule}`);
        expect(missing).toEqual([]);
    });
    test('no stale rows', () => {
        const stale = [...BUILDERS.map((b) => b.name), ...Object.keys(EXCLUSIONS)].filter((key) => !scanned.has(key));
        expect(stale).toEqual([]);
    });
    test('every exclusion has a reason', () => {
        const blank = Object.entries(EXCLUSIONS).filter(([, reason]) => reason.trim().length === 0).map(([key]) => key);
        expect(blank).toEqual([]);
    });
    test('no builder is both tested and excluded, and none is listed twice', () => {
        const names = BUILDERS.map((b) => b.name);
        expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
        expect(names.filter((name) => Object.prototype.hasOwnProperty.call(EXCLUSIONS, name))).toEqual([]);
    });
});
//# sourceMappingURL=object-types.test.js.map