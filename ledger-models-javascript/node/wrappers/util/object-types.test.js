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
// Compact object type and version (LM-297): writers set both forms, readers
// translate the strings-only form. Rows come from the shared fixture
// test-fixtures/object-type-legacy.json, which Java, Python and Rust also load.
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
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const CASES = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'test-fixtures', 'object-type-legacy.json'), 'utf8')).cases;
const COMPACT_NUMBERS = {
    object_type: 1001, version_major: 1002, version_minor: 1003, version_patch: 1004,
};
/** Generated message classes by proto full name: the package is the directory under node/. */
function messageClasses() {
    const root = path.resolve(__dirname, '../../fintekkers');
    const classes = new Map();
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            }
            else if (entry.name.endsWith('_pb.js')) {
                const pkg = path.relative(path.dirname(root), dir).split(path.sep).join('.');
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                for (const [name, cls] of Object.entries(require(full))) {
                    classes.set(`${pkg}.${name}`, cls);
                }
            }
        }
    };
    walk(root);
    return classes;
}
const CLASSES = messageClasses();
function decode(c) {
    const cls = CLASSES.get(c.message);
    if (!cls)
        throw new Error(`no generated class for ${c.message}`);
    return cls.deserializeBinary(Buffer.from(c.bytes, 'base64'));
}
/** Field numbers present at the top level of an encoded message. */
function topLevelFieldNumbers(data) {
    const numbers = [];
    let i = 0;
    const varint = () => {
        let result = 0;
        let scale = 1;
        for (;;) {
            const b = data[i++];
            result += (b & 0x7f) * scale;
            scale *= 128;
            if (!(b & 0x80))
                return result;
        }
    };
    while (i < data.length) {
        const key = varint();
        numbers.push(Math.floor(key / 8));
        const wireType = key % 8;
        if (wireType === 0)
            varint();
        else if (wireType === 1)
            i += 8;
        else if (wireType === 2) {
            const length = varint();
            i += length;
        }
        else if (wireType === 5)
            i += 4;
        else
            throw new Error(`unexpected wire type ${wireType}`);
    }
    return numbers;
}
let warn;
beforeEach(() => {
    objectTypes.resetWarningsForTests();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
    warn.mockRestore();
    objectTypes.resetWarningsForTests();
});
const fallbackWarnings = () => warn.mock.calls.filter((args) => String(args[0]).includes('(LM-297)')).length;
// ---- Loading the old form translates it (metric 3) ----
describe.each(CASES.map((c) => [c.name, c]))('fixture row %s', (_name, c) => {
    test('decodes to the expected type and version', () => {
        const message = decode(c);
        expect(objectTypes.readType(message)).toBe(object_type_pb_1.ObjectTypeProto[c.expect.object_type]);
        expect(objectTypes.readVersion(message)).toEqual(c.expect.version);
        expect(fallbackWarnings()).toBe(c.expect.warns ? 1 : 0);
    });
    test('re-serialises with the compact fields once upgraded', () => {
        const data = objectTypes.upgrade(decode(c)).serializeBinary();
        const expected = {
            object_type: object_type_pb_1.ObjectTypeProto[c.expect.object_type],
            version_major: c.expect.version[0],
            version_minor: c.expect.version[1],
            version_patch: c.expect.version[2],
        };
        const present = topLevelFieldNumbers(data);
        for (const [name, number] of Object.entries(COMPACT_NUMBERS)) {
            expect([name, present.includes(number)]).toEqual([name, expected[name] !== 0]);
        }
        const reread = CLASSES.get(c.message).deserializeBinary(data);
        expect([reread.getObjectType(), reread.getVersionMajor(), reread.getVersionMinor(), reread.getVersionPatch()])
            .toEqual([expected.object_type, expected.version_major, expected.version_minor, expected.version_patch]);
        expect([reread.getObjectClass(), reread.getVersion()]).toEqual([c.object_class, c.version]);
    });
});
// ---- Reading the strings is deprecated (metric 4) ----
test('three strings-only decodes of one type warn once', () => {
    const c = CASES.find((row) => row.name === 'js-PositionFilterProto');
    for (let i = 0; i < 3; i++) {
        objectTypes.upgrade(decode(c));
    }
    expect(fallbackWarnings()).toBe(1);
});
test('the new form does not warn', () => {
    const message = objectTypes.stamp(new price_pb_1.PriceProto(), object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1');
    objectTypes.readType(message);
    objectTypes.readVersion(message);
    expect(fallbackWarnings()).toBe(0);
});
// ---- Writers set both forms (metric 2) ----
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
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1'],
    ['Price.create', () => __awaiter(void 0, void 0, void 0, function* () { return Price_1.default.create(new decimal_js_1.Decimal(1), security(), datetime_1.ZonedDateTime.now()).proto; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1'],
    ['PositionFilter.toProto', () => __awaiter(void 0, void 0, void 0, function* () { return filter().toProto(); }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER, 'PositionFilter', '0.0.1'],
    ['QueryPositionRequest.toProto', () => __awaiter(void 0, void 0, void 0, function* () {
            return new QueryPositionRequest_1.QueryPositionRequest(filter(), position_pb_1.PositionTypeProto.TRANSACTION, position_pb_1.PositionViewProto.DEFAULT_VIEW, [], [], datetime_1.ZonedDateTime.now()).toProto();
        }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST, '', '1.0.0'],
    ['Transaction', () => __awaiter(void 0, void 0, void 0, function* () { return transaction().proto; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_TRANSACTION, 'Transaction', '0.0.1'],
    ['Transaction strategy allocation', () => __awaiter(void 0, void 0, void 0, function* () { return transaction().proto.getStrategyAllocation(); }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION, 'StrategyAllocation', '0.0.1'],
    ['PriceService.validateCreateOrUpdate', () => lastRequest(PriceService_1.PriceService, (s) => s.validateCreateOrUpdate(new price_pb_1.PriceProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST, 'PriceRequest', '0.0.1'],
    ['PriceService.search', () => lastRequest(PriceService_1.PriceService, (s) => s.search(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST, 'PriceRequest', '0.0.1'],
    ['SecurityService.validateCreateSecurity', () => lastRequest(SecurityService_1.SecurityService, (s) => s.validateCreateSecurity(new security_pb_1.SecurityProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
    ['SecurityService.searchSecurity', () => lastRequest(SecurityService_1.SecurityService, (s) => s.searchSecurity(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
    ['TransactionService.validateCreateTransaction', () => lastRequest(TransactionService_1.TransactionService, (s) => s.validateCreateTransaction({ proto: new transaction_pb_1.TransactionProto() })),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST, 'TransactionRequest', '0.0.1'],
    ['TransactionService.searchTransaction', () => lastRequest(TransactionService_1.TransactionService, (s) => s.searchTransaction(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, 'SecurityRequest', '0.0.1'],
    ['PortfolioService.validateCreatePortfolio', () => lastRequest(PortfolioService_1.PortfolioService, (s) => s.validateCreatePortfolio(new portfolio_pb_1.PortfolioProto())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
    ['PortfolioService.searchPortfolio', () => lastRequest(PortfolioService_1.PortfolioService, (s) => s.searchPortfolio(asOf, filter())),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
    ['LinkResolver securities', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[0]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
    ['LinkResolver portfolios', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[1]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
    ['LinkResolver transactions', () => __awaiter(void 0, void 0, void 0, function* () { return (yield linkResolverRequests())[2]; }),
        object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, 'TransactionRequest', '0.0.1'],
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
test.each(LIBRARY_WRITERS)('%s sets strings and compact fields that agree', (_name, build, type, objectClass, version) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield build();
    expect([message.getObjectClass(), message.getVersion()]).toEqual([objectClass, version]);
    // The message's own type. Some JS writers put a query request's string on the
    // create request too; the string still sits on one enum value.
    expect(message.getObjectType()).toBe(type);
    if (objectClass) {
        expect(objectTypes.fromLegacy(objectClass)).not.toBe(object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
    }
    expect([message.getVersionMajor(), message.getVersionMinor(), message.getVersionPatch()])
        .toEqual(objectTypes.parseVersion(version));
    expect(objectTypes.readVersion(message)).toEqual(objectTypes.parseVersion(version));
    expect(fallbackWarnings()).toBe(0);
}));
test('stamp rejects a malformed version', () => {
    expect(() => objectTypes.stamp(new price_pb_1.PriceProto(), object_type_pb_1.ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '1.2')).toThrow();
});
//# sourceMappingURL=object-types.test.js.map