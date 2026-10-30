// Object type and version (LM-297, LM-318): `stamp` writes object_type = 1
// and version = 2 (0.0.1), and bytes from earlier releases are not readable.
import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';
import * as ts from 'typescript';
import * as jspb from 'google-protobuf';

import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
import { VersionProto } from '../../fintekkers/models/util/version_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { TransactionTypeProto } from '../../fintekkers/models/transaction/transaction_type_pb';
import { PositionProto, PositionTypeProto, PositionViewProto } from '../../fintekkers/models/position/position_pb';
import { MeasureProto } from '../../fintekkers/models/position/measure_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { QueryTransactionResponseProto } from '../../fintekkers/requests/transaction/query_transaction_response_pb';
import { SummaryProto } from '../../fintekkers/requests/util/errors/summary_pb';
import { ProductTypeProto } from '../../fintekkers/models/security/product_type_pb';
import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { CouponTypeProto } from '../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../fintekkers/models/security/coupon_frequency_pb';
import { IndexTypeProto } from '../../fintekkers/models/security/index/index_type_pb';
import { AgencyProto } from '../../fintekkers/models/security/bond/agency_pb';
import { CreatePriceResponseProto } from '../../fintekkers/requests/price/create_price_response_pb';
import { CreateSecurityRequestProto } from '../../fintekkers/requests/security/create_security_request_pb';
import { CreateSecurityResponseProto } from '../../fintekkers/requests/security/create_security_response_pb';
import { CreateTransactionResponseProto } from '../../fintekkers/requests/transaction/create_transaction_response_pb';
import { CreatePortfolioResponseProto } from '../../fintekkers/requests/portfolio/create_portfolio_response_pb';

import * as objectTypes from './object-types';
import { ObjectTyped } from './object-types';
import LinkResolver from './link-resolver';
import Price from '../models/price/Price';
import Security from '../models/security/security';
import BondSecurity, { buildBondDetails } from '../models/security/BondSecurity';
import TIPSBond from '../models/security/TIPSBond';
import FloatingRateNote from '../models/security/FloatingRateNote';
import MortgageBackedSecurity from '../models/security/MortgageBackedSecurity';
import { Identifier } from '../models/security/identifier';
import Portfolio from '../models/portfolio/portfolio';
import Transaction from '../models/transaction/transaction';
import { TransactionType } from '../models/transaction/transaction_type';
import { PositionFilter } from '../models/position/positionfilter';
import { QueryPositionRequest } from '../requests/position/QueryPositionRequest';
import { ValuationRequests } from '../requests/valuation/ValuationRequests';
import { forSecurity } from '../models/security/product_inputs';
import { UUID } from '../models/utils/uuid';
import { ZonedDateTime } from '../models/utils/datetime';
import { PriceService } from '../services/price-service/PriceService';
import { SecurityService } from '../services/security-service/SecurityService';
import { TransactionService } from '../services/transaction-service/TransactionService';
import { PortfolioService } from '../services/portfolio-service/PortfolioService';
import { PositionService } from '../services/position-service/PositionService';

// A PriceProto written by ledger-models v0.4.33: object_class / version
// strings in fields 1 and 2.
const OLD_PRICE = path.resolve(__dirname, '../../../../ledger-models-protos/fixtures/legacy_v0433/price.bin');

// ---- stamp round-trips (metric 2) ----

test('a stamped price round-trips type and version', () => {
  const price = objectTypes.stamp(new PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE);
  const bytes = price.serializeBinary();
  // Exactly field 1 (varint 11) and field 2 ({patch: 1}): nothing at the
  // removed 1001-1004.
  expect(Array.from(bytes)).toEqual([0x08, 11, 0x12, 0x02, 0x18, 0x01]);

  const reread = PriceProto.deserializeBinary(bytes);
  expect(objectTypes.readType(reread)).toBe(ObjectTypeProto.OBJECT_TYPE_PRICE);
  expect(objectTypes.readVersion(reread)).toEqual([0, 0, 1]);
  const version = reread.getVersion() as VersionProto;
  expect([version.getMajor(), version.getMinor(), version.getPatch()]).toEqual([0, 0, 1]);
  // Nothing unknown kept on re-serialising.
  expect(Array.from(reread.serializeBinary())).toEqual(Array.from(bytes));
});

test('an unstamped message reads as unknown and absent', () => {
  const price = PriceProto.deserializeBinary(new PriceProto().serializeBinary());
  expect(objectTypes.readType(price)).toBe(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
  expect(objectTypes.readVersion(price)).toBeUndefined();
});

// ---- Old bytes are not readable (metric 3) ----

test('bytes from v0.4.33 are not readable', () => {
  // Field 2 held the string "0.0.1", which does not parse as a VersionProto.
  const old = new Uint8Array(fs.readFileSync(OLD_PRICE));
  expect(() => PriceProto.deserializeBinary(old)).toThrow();
});

// ---- Every library builder stamps what it builds (metric 2; LM-324) ----

/** A service with its gRPC client swapped for one that records each request. */
function capturingService<S extends object>(cls: { prototype: S }, response: () => unknown): { service: S; requests: ObjectTyped[] } {
  const requests: ObjectTyped[] = [];
  const unary = (request: ObjectTyped, callback: (err: unknown, res: unknown) => void) => {
    requests.push(request);
    callback(null, response());
  };
  const stream = (request: ObjectTyped) => {
    requests.push(request);
    const handlers: Record<string, () => void> = {};
    setImmediate(() => handlers.end?.());
    return { on(event: string, handler: () => void) { handlers[event] = handler; return this; } };
  };
  const service = Object.create(cls.prototype) as S;
  (service as unknown as { client: unknown }).client = {
    validateCreateOrUpdate: unary, createOrUpdate: unary, validateQueryRequest: unary, search: stream,
  };
  return { service, requests };
}

const asOf = ZonedDateTime.now().toProto();
const filter = (): PositionFilter => new PositionFilter();

/** Marks a proto the caller passes in: it is passed through as is, never stamped. */
type Caller = <M extends jspb.Message>(proto: M) => M;

function security(caller: Caller): Security {
  return Security.create(caller(new SecurityProto().setUuid(UUID.random().toUUIDProto()).setAssetClass('Equity')));
}

function portfolio(caller: Caller): Portfolio {
  return new Portfolio(caller(new PortfolioProto().setUuid(UUID.random().toUUIDProto()).setPortfolioName('P').setAsOf(asOf)));
}

const BOND_INPUTS = {
  faceValue: new Decimal('1000'),
  couponRate: new Decimal('0.05'),
  couponType: CouponTypeProto.FIXED,
  couponFrequency: CouponFrequencyProto.SEMIANNUALLY,
  issueDate: new Date(2024, 0, 1),
  maturityDate: new Date(2034, 0, 1),
};

function bond(caller: Caller): Security {
  return Security.create(caller(new SecurityProto().setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.TREASURY_NOTE).setBondDetails(buildBondDetails(BOND_INPUTS))));
}

function transaction(caller: Caller, onSecurity: Security = security(caller)): Transaction {
  return new Transaction({
    tradeDate: new Date(2024, 0, 15),
    settlementDate: new Date(2024, 0, 17),
    asOfDate: new Date(2024, 0, 15, 10, 30, 0),
    price: new Decimal('100.50'),
    security: onSecurity,
    transactionType: new TransactionType(TransactionTypeProto.BUY),
    portfolio: portfolio(caller),
    quantity: new Decimal('10'),
  });
}

/** A LinkResolver whose clients record each request and find nothing. */
function capturingResolver(): { resolver: LinkResolver; requests: ObjectTyped[] } {
  const requests: ObjectTyped[] = [];
  const client = (response: () => unknown) => ({
    getByIds: (request: ObjectTyped, callback: (err: unknown, res: unknown) => void) => {
      requests.push(request);
      callback(null, response());
    },
  });
  const resolver = new LinkResolver({
    securityClient: client(() => new QuerySecurityResponseProto()) as never,
    portfolioClient: client(() => new QueryPortfolioResponseProto()) as never,
    transactionClient: client(() => new QueryTransactionResponseProto()) as never,
  });
  return { resolver, requests };
}

/** The request a LinkResolver call sends. Nothing comes back, so a lookup may reject as not found. */
async function resolverRequest(call: (resolver: LinkResolver) => Promise<unknown>): Promise<ObjectTyped> {
  const { resolver, requests } = capturingResolver();
  await call(resolver).catch(() => undefined);
  expect(requests).toHaveLength(1);
  return requests[0];
}

async function lastRequest<S extends object>(cls: { prototype: S }, call: (service: S) => Promise<unknown>,
  response: () => unknown = () => new SummaryProto()): Promise<ObjectTyped> {
  const { service, requests } = capturingService(cls, response);
  await call(service);
  return requests[requests.length - 1];
}

interface Builder {
  /** The publicBuilders() key. */
  name: string;
  /** The top-level message's own type. */
  type: ObjectTypeProto;
  /** Calls the builder; returns a message, a wrapper with `proto`, or an array of either. */
  build: (caller: Caller) => unknown;
}

const B = (name: string, type: ObjectTypeProto, build: (caller: Caller) => unknown): Builder => ({ name, type, build });
const T = ObjectTypeProto;
const linkUuid = () => UUID.random();
const linkedPrice = (caller: Caller) => new Price(caller(new PriceProto().setSecurity(Security.linkOfLatest(linkUuid()))));
const linkedTransaction = (caller: Caller) => new Transaction(caller(new TransactionProto().setIsLink(true)
  .setPortfolio(new PortfolioProto().setIsLink(true).setUuid(linkUuid().toUUIDProto()))));

/** Every public builder, by publicBuilders() key. */
const BUILDERS: Builder[] = [
  B('Security.linkOf', T.OBJECT_TYPE_SECURITY, () => Security.linkOf(linkUuid(), ZonedDateTime.now())),
  B('Security.linkOfLatest', T.OBJECT_TYPE_SECURITY, () => Security.linkOfLatest(linkUuid())),
  B('BondSecurity.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => BondSecurity.fromPricerInputs(BOND_INPUTS)),
  B('TIPSBond.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => TIPSBond.fromPricerInputs({
    ...BOND_INPUTS, baseCpi: new Decimal('300'), indexDate: new Date(2024, 0, 1), inflationIndexType: IndexTypeProto.CPI_U })),
  B('FloatingRateNote.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => FloatingRateNote.fromPricerInputs({
    ...BOND_INPUTS, spread: new Decimal('0.001'), referenceRateIndex: IndexTypeProto.SOFR, resetFrequency: CouponFrequencyProto.MONTHLY })),
  B('MortgageBackedSecurity.fromPricerInputs', T.OBJECT_TYPE_SECURITY, () => MortgageBackedSecurity.fromPricerInputs({
    ...BOND_INPUTS, poolNumber: 'FN AS1234', agency: AgencyProto.FNMA, wac: new Decimal('0.045'), wam: 358,
    passThroughRate: new Decimal('0.04'), currentFactor: new Decimal('0.95'), originalFaceValue: new Decimal('1000'),
    currentUpb: new Decimal('950'), psaSpeed: new Decimal('150') })),
  B('Identifier.fromName', T.OBJECT_TYPE_IDENTIFIER, () => Identifier.fromName('ISIN', 'US0378331005')),
  B('Price.fromSimple', T.OBJECT_TYPE_PRICE, () => Price.fromSimple(UUID.random().toString(), 1, new Date())),
  B('Price.create', T.OBJECT_TYPE_PRICE, (c) => Price.create(new Decimal(1), security(c), ZonedDateTime.now())),
  B('Price.getCashPrice', T.OBJECT_TYPE_PRICE, (c) => Price.getCashPrice(security(c), ZonedDateTime.now())),
  B('PositionFilter.toProto', T.OBJECT_TYPE_POSITION_FILTER, () => filter().toProto()),
  B('QueryPositionRequest.toProto', T.OBJECT_TYPE_QUERY_POSITION_REQUEST, () => new QueryPositionRequest(
    filter(), PositionTypeProto.TRANSACTION, PositionViewProto.DEFAULT_VIEW, [], [], ZonedDateTime.now()).toProto()),
  B('Transaction.constructor', T.OBJECT_TYPE_TRANSACTION, (c) => transaction(c)),
  B('Transaction.createCashTransaction', T.OBJECT_TYPE_TRANSACTION, (c) => Transaction.createCashTransaction(security(c), transaction(c))),
  B('Transaction.addCashImpact', T.OBJECT_TYPE_TRANSACTION, (c) => {
    const parent = transaction(c);
    Transaction.addCashImpact(parent, security(c));
    return parent.getChildrenTransactions();
  }),
  B('Transaction.addMaturationTransaction', T.OBJECT_TYPE_TRANSACTION, (c) => {
    const parent = transaction(c, bond(c));
    Transaction.addMaturationTransaction(parent, new TransactionType(TransactionTypeProto.MATURATION), security(c));
    return parent.getChildrenTransactions();
  }),
  B('Transaction.addDerivedTransactions', T.OBJECT_TYPE_TRANSACTION, (c) => {
    const parent = transaction(c, bond(c));
    Transaction.addDerivedTransactions(parent, security(c));
    return parent.getChildrenTransactions();
  }),
  B('PriceService.validateCreateOrUpdate', T.OBJECT_TYPE_CREATE_PRICE_REQUEST,
    (c) => lastRequest(PriceService, (s) => s.validateCreateOrUpdate(c(new PriceProto())))),
  B('PriceService.createOrUpdate', T.OBJECT_TYPE_CREATE_PRICE_REQUEST,
    (c) => lastRequest(PriceService, (s) => s.createOrUpdate(c(new PriceProto())), () => new CreatePriceResponseProto())),
  B('PriceService.search', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService, (s) => s.search(asOf, filter()))),
  B('PriceService.searchPrice', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService, (s) => s.searchPrice(asOf, filter()))),
  B('PriceService.searchPriceAsOfNow', T.OBJECT_TYPE_QUERY_PRICE_REQUEST, () => lastRequest(PriceService, (s) => s.searchPriceAsOfNow(filter()))),
  B('PriceService.searchBySecurityId', T.OBJECT_TYPE_QUERY_PRICE_REQUEST,
    () => lastRequest(PriceService, (s) => s.searchBySecurityId(UUID.random().toString(), asOf))),
  B('PriceService.searchWithSecurities', T.OBJECT_TYPE_QUERY_PRICE_REQUEST,
    () => lastRequest(PriceService, (s) => s.searchWithSecurities(asOf, filter(), capturingResolver().resolver))),
  B('SecurityService.validateCreateSecurity', T.OBJECT_TYPE_CREATE_SECURITY_REQUEST,
    (c) => lastRequest(SecurityService, (s) => s.validateCreateSecurity(c(new SecurityProto())))),
  B('SecurityService.createSecurity', T.OBJECT_TYPE_CREATE_SECURITY_REQUEST,
    (c) => lastRequest(SecurityService, (s) => s.createSecurity(c(new SecurityProto())), () => new CreateSecurityResponseProto())),
  B('SecurityService.searchSecurity', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, () => lastRequest(SecurityService, (s) => s.searchSecurity(asOf, filter()))),
  B('SecurityService.searchSecurityAsOfNow', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST,
    () => lastRequest(SecurityService, (s) => s.searchSecurityAsOfNow(filter()))),
  B('TransactionService.validateCreateTransaction', T.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST,
    (c) => lastRequest(TransactionService, (s) => s.validateCreateTransaction({ proto: c(new TransactionProto()) } as Transaction))),
  B('TransactionService.createTransaction', T.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST,
    (c) => lastRequest(TransactionService, (s) => s.createTransaction({ proto: c(new TransactionProto()) } as Transaction),
      () => new CreateTransactionResponseProto())),
  B('TransactionService.searchTransaction', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST,
    () => lastRequest(TransactionService, (s) => s.searchTransaction(asOf, filter()))),
  B('TransactionService.searchWithSecurityAndPortfolio', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST,
    () => lastRequest(TransactionService, (s) => s.searchWithSecurityAndPortfolio(asOf, filter(), 100, capturingResolver().resolver))),
  B('PortfolioService.validateCreatePortfolio', T.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST,
    (c) => lastRequest(PortfolioService, (s) => s.validateCreatePortfolio(c(new PortfolioProto())))),
  B('PortfolioService.createPortfolio', T.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST,
    (c) => lastRequest(PortfolioService, (s) => s.createPortfolio(c(new PortfolioProto())), () => new CreatePortfolioResponseProto())),
  B('PortfolioService.searchPortfolio', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST,
    () => lastRequest(PortfolioService, (s) => s.searchPortfolio(asOf, filter()))),
  B('PositionService.validateRequest', T.OBJECT_TYPE_QUERY_POSITION_REQUEST,
    () => lastRequest(PositionService, (s) => s.validateRequest(QueryPositionRequest.from([], [])))),
  B('PositionService.search', T.OBJECT_TYPE_QUERY_POSITION_REQUEST,
    () => lastRequest(PositionService, (s) => s.search(QueryPositionRequest.from([], [])))),
  B('LinkResolver.getSecurity', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST, () => resolverRequest((r) => r.getSecurity(linkUuid()))),
  B('LinkResolver.getPortfolio', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, () => resolverRequest((r) => r.getPortfolio(linkUuid()))),
  B('LinkResolver.getTransaction', T.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, () => resolverRequest((r) => r.getTransaction(linkUuid()))),
  B('LinkResolver.resolveSecurities', T.OBJECT_TYPE_QUERY_SECURITY_REQUEST,
    (c) => resolverRequest((r) => r.resolveSecurities([linkedPrice(c)]))),
  B('LinkResolver.resolvePortfolios', T.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST,
    (c) => resolverRequest((r) => r.resolvePortfolios([linkedTransaction(c)]))),
  // LM-410: the request is the builder's; the product input's security and the position are the caller's.
  B('ValuationRequests.typed', T.OBJECT_TYPE_VALUATION_REQUEST, (c) => ValuationRequests.typed(
    asOf, forSecurity(bond(c).proto, new PriceProto()), c(new PositionProto()), [MeasureProto.MARKET_VALUE])),
];

/** The messages a builder returned: wrappers are read through `proto`, arrays item by item. */
function messagesOf(built: unknown): jspb.Message[] {
  return (Array.isArray(built) ? built : [built]).map((item) => {
    const message = item instanceof jspb.Message ? item : (item as { proto?: unknown } | undefined)?.proto;
    if (!(message instanceof jspb.Message)) throw new Error(`not a message or a wrapper of one: ${String(item)}`);
    return message;
  });
}

// jspb.Message's own getters (getExtension, getJsPbMessageId, ...) are not fields.
const JSPB_GETTERS = new Set(Object.getOwnPropertyNames(jspb.Message.prototype));

/** The zero-argument field getters of a generated message. */
function fieldGetters(message: jspb.Message): string[] {
  const names: string[] = [];
  for (let proto = Object.getPrototypeOf(message); proto && proto !== jspb.Message.prototype; proto = Object.getPrototypeOf(proto)) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      const getter = proto[name];
      if (name.startsWith('get') && !JSPB_GETTERS.has(name) && typeof getter === 'function' && getter.length === 0) names.push(name);
    }
  }
  return names;
}

interface Walk {
  /** Paths of messages with object_type that lack their own type or SCHEMA_VERSION. */
  untyped: string[];
  /** How many messages with object_type were checked. */
  typed: number;
}

/**
 * Visits `root` and every nested message (singular and repeated fields; no
 * message with object_type has a map field of messages today). `callers`
 * holds the protos the caller passed in: they are passed through as is, so
 * they and what they hold are not checked here.
 */
function untypedMessages(root: jspb.Message, callers: ReadonlySet<object> = new Set()): Walk {
  const walk: Walk = { untyped: [], typed: 0 };
  (function visit(value: unknown, at: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, `${at}[${i}]`));
      return;
    }
    if (!(value instanceof jspb.Message) || callers.has(value)) return;
    const own = objectTypes.ownType(value);
    if (own !== undefined) {
      walk.typed++;
      const message = value as unknown as ObjectTyped;
      if (objectTypes.readType(message) !== own || String(objectTypes.readVersion(message)) !== String(objectTypes.SCHEMA_VERSION)) {
        walk.untyped.push(at);
      }
    }
    for (const getter of fieldGetters(value)) {
      visit((value as unknown as Record<string, () => unknown>)[getter](), `${at}.${getter}`);
    }
  })(root, '$');
  return walk;
}

test.each(BUILDERS.map((row) => [row.name, row] as const))('%s stamps every message it builds', async (_name, row) => {
  const callers = new Set<object>();
  const messages = messagesOf(await row.build((proto) => { callers.add(proto); return proto; }));

  expect(messages.length).toBeGreaterThan(0);
  for (const message of messages) {
    expect(objectTypes.readType(message as unknown as ObjectTyped)).toBe(row.type);
    const walk = untypedMessages(message, callers);
    expect(walk.untyped).toEqual([]);
    expect(walk.typed).toBeGreaterThan(0);
  }
  // Callers' protos are not re-stamped (LM-322's pass-through ruling).
  for (const proto of callers) {
    expect(objectTypes.readType(proto as ObjectTyped)).toBe(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
    expect(objectTypes.readVersion(proto as ObjectTyped)).toBeUndefined();
  }
  expect(objectTypes.SCHEMA_VERSION).toEqual([0, 0, 1]);
});

test("callers' protos pass through as the same unstamped object", async () => {
  const securityProto = new SecurityProto().setUuid(UUID.random().toUUIDProto());
  const price = Price.create(new Decimal(1), new Security(securityProto), ZonedDateTime.now());
  expect(price.proto.getSecurity()).toBe(securityProto);

  const callers: jspb.Message[] = [];
  const txn = transaction((proto) => { callers.push(proto); return proto; });
  const [txnSecurity, txnPortfolio] = callers;
  expect(txn.proto.getSecurity()).toBe(txnSecurity);
  expect(txn.proto.getPortfolio()).toBe(txnPortfolio);

  const input = new SecurityProto();
  const request = await lastRequest(SecurityService, (s) => s.validateCreateSecurity(input)) as unknown as CreateSecurityRequestProto;
  expect(request.getSecurityInput()).toBe(input);

  for (const proto of [securityProto, txnSecurity, txnPortfolio, input] as unknown as ObjectTyped[]) {
    expect(objectTypes.readType(proto)).toBe(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
    expect(objectTypes.readVersion(proto)).toBeUndefined();
  }
});

test('Price.fromSimple builds its security link, so the link is stamped, not passed through', () => {
  const callers = new Set<object>();
  const row = BUILDERS.find((b) => b.name === 'Price.fromSimple')!;
  const price = messagesOf(row.build((proto) => { callers.add(proto); return proto; }))[0] as PriceProto;
  expect(callers.size).toBe(0);
  const link = price.getSecurity()!;
  expect(objectTypes.readType(link)).toBe(ObjectTypeProto.OBJECT_TYPE_SECURITY);
  expect(objectTypes.readVersion(link)).toEqual(objectTypes.SCHEMA_VERSION);
});

// ---- The walker finds what it must (it cannot pass by not looking) ----

const stampedPrice = () => objectTypes.stampOwn(new PriceProto());
const stampedSecurity = () => objectTypes.stampOwn(new SecurityProto());

test('the walker reports an unstamped nested message', () => {
  const walk = untypedMessages(stampedPrice().setSecurity(new SecurityProto()));
  expect(walk.untyped).toEqual(['$.getSecurity']);
  expect(walk.typed).toBe(2);
});

test('the walker reports an unstamped message in a repeated field', () => {
  const security = stampedSecurity().setIdentifiersList([objectTypes.stampOwn(new IdentifierProto()), new IdentifierProto()]);
  expect(untypedMessages(security).untyped).toEqual(['$.getIdentifiersList[1]']);
});

test('the walker reports a message stamped with another type', () => {
  const security = objectTypes.stamp(new SecurityProto(), ObjectTypeProto.OBJECT_TYPE_PRICE);
  expect(untypedMessages(stampedPrice().setSecurity(security)).untyped).toEqual(['$.getSecurity']);
});

test('the walker reports a message with its type but no version', () => {
  const security = new SecurityProto().setObjectType(ObjectTypeProto.OBJECT_TYPE_SECURITY);
  expect(untypedMessages(stampedPrice().setSecurity(security)).untyped).toEqual(['$.getSecurity']);
});

test("the walker skips callers' protos", () => {
  const input = new SecurityProto();
  expect(untypedMessages(stampedPrice().setSecurity(input), new Set([input]))).toEqual({ untyped: [], typed: 1 });
});

// ---- Every public builder is tested or excluded (metric line 2) ----

const WRAPPERS_DIR = path.resolve(__dirname, '..');

/** Every non-test, non-declaration .ts under node/wrappers/. The generated fintekkers/**_pb are not scanned. */
function wrapperSources(dir = WRAPPERS_DIR): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return wrapperSources(file);
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
function publicBuilders(): Map<string, string> {
  const configFile = path.resolve(WRAPPERS_DIR, '../../tsconfig.json');
  const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configFile));
  const sources = wrapperSources();
  const program = ts.createProgram(sources, { ...options, noEmit: true });
  const checker = program.getTypeChecker();

  const isMessage = (t: ts.Type) => !!t.getProperty('getObjectType') && !!t.getProperty('setVersion');
  const isWrapper = (t: ts.Type) => {
    const proto = t.getProperty('proto');
    return !!proto?.valueDeclaration && isMessage(checker.getTypeOfSymbolAtLocation(proto, proto.valueDeclaration));
  };
  // The (a) or (b) rule a type meets, or undefined.
  const builtBy = (t: ts.Type): string | undefined => {
    const parts = t.isUnion() ? t.types : [t];
    for (const part of parts) {
      const unwrap = checker.isArrayType(part) || part.getSymbol()?.getName() === 'Promise';
      const inner = unwrap ? checker.getTypeArguments(part as ts.TypeReference)[0] : part;
      if (inner !== part) {
        const rule = builtBy(inner);
        if (rule) return rule;
      } else if (isMessage(part)) {
        return `(a) returns ${checker.typeToString(part)}`;
      } else if (isWrapper(part)) {
        return `(b) returns ${checker.typeToString(part)}, which wraps a message`;
      }
    }
    return undefined;
  };

  type Callable = { key: string; isPublic: boolean; returns: ts.Type; bodies: ts.Node[] };
  const callables = new Map<ts.Node, Callable>();
  const isPrivate = (m: ts.ClassElement) => (!!m.name && ts.isPrivateIdentifier(m.name))
    || (ts.getCombinedModifierFlags(m as ts.Declaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) !== 0;

  for (const sourceFile of program.getSourceFiles().filter((f) => sources.includes(path.resolve(f.fileName)))) {
    const moduleName = path.basename(sourceFile.fileName, '.ts');
    const exported = new Set<ts.Node>();
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    for (let symbol of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
      if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      symbol.declarations?.forEach((d) => exported.add(d));
    }
    const signatureOf = (decl: ts.SignatureDeclaration) => checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(decl)!);

    sourceFile.forEachChild(function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name && node.body) {
        callables.set(node, { key: `${moduleName}.${node.name.text}`, isPublic: exported.has(node), returns: signatureOf(node), bodies: [node.body] });
      } else if (ts.isVariableStatement(node)) {
        for (const d of node.declarationList.declarations) {
          if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
            callables.set(d.initializer, { key: `${moduleName}.${d.name.text}`, isPublic: exported.has(d), returns: signatureOf(d.initializer), bodies: [d.initializer.body] });
          }
        }
      } else if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        const isPublic = exported.has(node);
        const ctor = node.members.find(ts.isConstructorDeclaration);
        const fieldInits = node.members.flatMap((m) =>
          ts.isPropertyDeclaration(m) && m.initializer && !(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static) ? [m.initializer] : []);
        callables.set(ctor ?? node, {
          key: `${className}.constructor`, isPublic,
          returns: checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(node.name)!),
          bodies: [...(ctor?.body ? [ctor.body] : []), ...fieldInits],
        });
        for (const m of node.members) {
          if ((ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m)) && m.body && ts.isIdentifier(m.name)) {
            callables.set(m, { key: `${className}.${m.name.text}`, isPublic: isPublic && !isPrivate(m), returns: signatureOf(m), bodies: [m.body] });
          }
        }
      }
    });
  }

  const flagged = new Map<ts.Node, string>();
  for (const [decl, c] of callables) {
    const rule = builtBy(c.returns);
    if (rule) flagged.set(decl, rule);
  }
  for (const [decl, c] of callables) {
    if (flagged.has(decl)) continue;
    c.bodies.forEach(function visit(node: ts.Node): void {
      if (flagged.has(decl)) return;
      if (ts.isNewExpression(node)) {
        const rule = builtBy(checker.getTypeAtLocation(node));
        if (rule) flagged.set(decl, `(c) ${node.getText().split('(')[0]}(): ${rule}`);
      }
      node.forEachChild(visit);
    });
  }
  // (d): calls to a flagged callable. `new X()` of a flagged class is already (c).
  for (let changed = true; changed;) {
    changed = false;
    for (const [decl, c] of callables) {
      if (flagged.has(decl)) continue;
      c.bodies.forEach(function visit(node: ts.Node): void {
        if (flagged.has(decl)) return;
        if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
          const target = checker.getResolvedSignature(node)?.declaration;
          if (target && flagged.has(target)) {
            flagged.set(decl, `(d) calls ${callables.get(target)!.key}`);
            changed = true;
          }
        }
        node.forEachChild(visit);
      });
    }
  }

  const builders = new Map<string, string>();
  for (const [decl, rule] of flagged) {
    const c = callables.get(decl)!;
    if (c.isPublic) builders.set(c.key, rule);
  }
  return builders;
}

const RETURNS_STORED = 'an accessor: returns or wraps a proto it holds; builds nothing';
const WRAPS_CALLER = "wraps the caller's proto (pass-through ruling)";
const SERIALIZES = "converts values to untyped messages (dates, UUIDs, decimals) or returns the caller's Identifier proto as is";
const DESERIALIZES = 'decodes protos the caller or server sent into wrappers; builds no message';

/** Public callables the scan flags that build no message to stamp, each with its reason. */
const EXCLUSIONS: Record<string, string> = {
  'object-types.stamp': 'the stamping helper itself (tested above)',
  'object-types.stampOwn': 'the stamping helper itself (tested above)',
  'price_rules.validate': 'local stand-in for null input; never returned or sent',
  'price_rules.requireValid': 'local stand-in for null input; never returned or sent',
  'product_inputs.checkProductInput': 'local stand-in SecurityProto for an arm with no security; never returned or sent',
  'product_inputs.forSecurity': "builds a ProductInput, which has no object_type, around the caller's security; flagged only for calling checkProductInput",
  'Security.create': "picks the wrapper class for the caller's proto (pass-through ruling)",
  'Position.fromJSON': DESERIALIZES,
  'ProtoSerializationUtil.deserialize': DESERIALIZES,
  'serialization.util.unpack': DESERIALIZES,
  'LocalDate.toDate': DESERIALIZES,
  'ProtoSerializationUtil.serialize': SERIALIZES,
  'serialization.util.pack': SERIALIZES,
  'PositionFilter.addFilter': SERIALIZES,
  'PositionFilter.addEqualsFilter': SERIALIZES,
  'PositionFilter.addEqualsStringFilter': SERIALIZES,
  'PositionFilter.addObjectFilter': SERIALIZES,
  'Security.hydrate': 'swaps in the proto LinkResolver.getSecurity fetched (that request is tested)',
  'Portfolio.hydrate': 'swaps in the proto LinkResolver.getPortfolio fetched (that request is tested)',
  'Transaction.hydrate': 'swaps in the proto LinkResolver.getTransaction fetched (that request is tested)',
  'TreasuryFrnFixings.select': "builds a ReferenceRateFixingProto, which has no object_type; flagged only for reading the caller's issuances",
  ...Object.fromEntries([
    'BondSecurity.constructor', 'FloatingRateNote.constructor', 'Identifier.constructor', 'IndexSecurity.constructor',
    'Issuance.constructor', 'MortgageBackedSecurity.constructor', 'Portfolio.constructor', 'Position.constructor',
    'Price.constructor', 'Security.constructor', 'TIPSBond.constructor',
  ].map((key) => [key, WRAPS_CALLER])),
  ...Object.fromEntries([
    'BondSecurity.getIssuances', 'Price.getSecurity',
    'Position.getField', 'Position.getFieldDisplay', 'Position.getFieldValue', 'Position.getMeasureValue', 'Position.toString',
    'Security.getField', 'Security.getIdentifierByType', 'Security.getIdentifiers', 'Security.toString',
    'Transaction.getCashTransaction', 'Transaction.getChildrenTransactions', 'Transaction.getField', 'Transaction.getIssuerName',
    'Transaction.getPortfolio', 'Transaction.getPrice', 'Transaction.getSecurity', 'Transaction.getStrategyAllocation',
    'Transaction.isCashSecurity', 'Transaction.toString',
  ].map((key) => [key, RETURNS_STORED])),
};

describe('every public builder is tested or excluded (metric line 2)', () => {
  let scanned: Map<string, string>;
  beforeAll(() => { scanned = publicBuilders(); }, 60_000);

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
