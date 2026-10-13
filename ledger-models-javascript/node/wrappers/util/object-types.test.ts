// Object type and version (LM-297, LM-318): `stamp` writes object_type = 1
// and version = 2 (0.0.1), and bytes from earlier releases are not readable.
import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';

import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
import { VersionProto } from '../../fintekkers/models/util/version_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { TransactionTypeProto } from '../../fintekkers/models/transaction/transaction_type_pb';
import { PositionTypeProto, PositionViewProto } from '../../fintekkers/models/position/position_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { QueryTransactionResponseProto } from '../../fintekkers/requests/transaction/query_transaction_response_pb';
import { SummaryProto } from '../../fintekkers/requests/util/errors/summary_pb';

import * as objectTypes from './object-types';
import { ObjectTyped } from './object-types';
import LinkResolver from './link-resolver';
import Price from '../models/price/Price';
import Security from '../models/security/security';
import Portfolio from '../models/portfolio/portfolio';
import Transaction from '../models/transaction/transaction';
import { TransactionType } from '../models/transaction/transaction_type';
import { PositionFilter } from '../models/position/positionfilter';
import { QueryPositionRequest } from '../requests/position/QueryPositionRequest';
import { UUID } from '../models/utils/uuid';
import { ZonedDateTime } from '../models/utils/datetime';
import { PriceService } from '../services/price-service/PriceService';
import { SecurityService } from '../services/security-service/SecurityService';
import { TransactionService } from '../services/transaction-service/TransactionService';
import { PortfolioService } from '../services/portfolio-service/PortfolioService';

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

// ---- Every library writer stamps the new form (metric 2) ----

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
    validateCreateOrUpdate: unary, search: stream,
  };
  return { service, requests };
}

const asOf = ZonedDateTime.now().toProto();
const filter = (): PositionFilter => new PositionFilter();

function security(): Security {
  return Security.create(new SecurityProto().setUuid(UUID.random().toUUIDProto()).setAssetClass('Equity'));
}

function portfolio(): Portfolio {
  return new Portfolio(new PortfolioProto().setUuid(UUID.random().toUUIDProto()).setPortfolioName('P').setAsOf(asOf));
}

async function linkResolverRequests(): Promise<ObjectTyped[]> {
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
  // Nothing comes back, so each lookup rejects as not found.
  await expect(resolver.getSecurity(UUID.random())).rejects.toThrow();
  await expect(resolver.getPortfolio(UUID.random())).rejects.toThrow();
  await expect(resolver.getTransaction(UUID.random())).rejects.toThrow();
  return requests;
}

type Writer = [string, () => Promise<ObjectTyped>, ObjectTypeProto];

async function lastRequest<S extends object>(cls: { prototype: S }, call: (service: S) => Promise<unknown>): Promise<ObjectTyped> {
  const { service, requests } = capturingService(cls, () => new SummaryProto());
  await call(service);
  return requests[requests.length - 1];
}

const LIBRARY_WRITERS: Writer[] = [
  ['Price.fromSimple', async () => Price.fromSimple(UUID.random().toString(), 1, new Date()).proto,
    ObjectTypeProto.OBJECT_TYPE_PRICE],
  ['Price.create', async () => Price.create(new Decimal(1), security(), ZonedDateTime.now()).proto,
    ObjectTypeProto.OBJECT_TYPE_PRICE],
  ['PositionFilter.toProto', async () => filter().toProto(),
    ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER],
  ['QueryPositionRequest.toProto', async () => new QueryPositionRequest(
    filter(), PositionTypeProto.TRANSACTION, PositionViewProto.DEFAULT_VIEW, [], [], ZonedDateTime.now()).toProto(),
  ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST],
  ['Transaction', async () => transaction().proto,
    ObjectTypeProto.OBJECT_TYPE_TRANSACTION],
  ['Transaction strategy allocation', async () => transaction().proto.getStrategyAllocation()!,
    ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION],
  ['PriceService.validateCreateOrUpdate', () => lastRequest(PriceService, (s) => s.validateCreateOrUpdate(new PriceProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST],
  ['PriceService.search', () => lastRequest(PriceService, (s) => s.search(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST],
  ['SecurityService.validateCreateSecurity', () => lastRequest(SecurityService, (s) => s.validateCreateSecurity(new SecurityProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST],
  ['SecurityService.searchSecurity', () => lastRequest(SecurityService, (s) => s.searchSecurity(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
  ['TransactionService.validateCreateTransaction', () => lastRequest(TransactionService,
    (s) => s.validateCreateTransaction({ proto: new TransactionProto() } as Transaction)),
  ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST],
  ['TransactionService.searchTransaction', () => lastRequest(TransactionService, (s) => s.searchTransaction(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
  ['PortfolioService.validateCreatePortfolio', () => lastRequest(PortfolioService, (s) => s.validateCreatePortfolio(new PortfolioProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST],
  ['PortfolioService.searchPortfolio', () => lastRequest(PortfolioService, (s) => s.searchPortfolio(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
  ['LinkResolver securities', async () => (await linkResolverRequests())[0],
    ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
  ['LinkResolver portfolios', async () => (await linkResolverRequests())[1],
    ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
  ['LinkResolver transactions', async () => (await linkResolverRequests())[2],
    ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
];

function transaction(): Transaction {
  return new Transaction({
    tradeDate: new Date(2024, 0, 15),
    settlementDate: new Date(2024, 0, 17),
    asOfDate: new Date(2024, 0, 15, 10, 30, 0),
    price: new Decimal('100.50'),
    security: security(),
    transactionType: new TransactionType(TransactionTypeProto.BUY),
    portfolio: portfolio(),
    quantity: new Decimal('10'),
  });
}

test.each(LIBRARY_WRITERS)('%s stamps the type and schema version', async (_name, build, type) => {
  const message = await build();

  expect(objectTypes.readType(message)).toBe(type);
  expect(objectTypes.readVersion(message)).toEqual(objectTypes.SCHEMA_VERSION);
  expect(objectTypes.SCHEMA_VERSION).toEqual([0, 0, 1]);
});
