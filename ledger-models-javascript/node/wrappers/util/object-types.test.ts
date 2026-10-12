// Compact object type and version (LM-297): writers set both forms, readers
// translate the strings-only form. Rows come from the shared fixture
// test-fixtures/object-type-legacy.json, which Java, Python and Rust also load.
import * as fs from 'fs';
import * as path from 'path';
import { Decimal } from 'decimal.js';

import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
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

interface FixtureCase {
  name: string;
  source: string;
  message: string;
  object_class: string;
  version: string;
  bytes: string;
  expect: { object_type: keyof typeof ObjectTypeProto; version: number[]; warns: boolean };
}

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const CASES: FixtureCase[] = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'test-fixtures', 'object-type-legacy.json'), 'utf8')).cases;
const COMPACT_NUMBERS: Record<string, number> = {
  object_type: 1001, version_major: 1002, version_minor: 1003, version_patch: 1004,
};

type MessageClass = { deserializeBinary(bytes: Uint8Array): ObjectTyped & { serializeBinary(): Uint8Array } };

/** Generated message classes by proto full name: the package is the directory under node/. */
function messageClasses(): Map<string, MessageClass> {
  const root = path.resolve(__dirname, '../../fintekkers');
  const classes = new Map<string, MessageClass>();
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('_pb.js')) {
        const pkg = path.relative(path.dirname(root), dir).split(path.sep).join('.');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        for (const [name, cls] of Object.entries(require(full))) {
          classes.set(`${pkg}.${name}`, cls as MessageClass);
        }
      }
    }
  };
  walk(root);
  return classes;
}

const CLASSES = messageClasses();

function decode(c: FixtureCase) {
  const cls = CLASSES.get(c.message);
  if (!cls) throw new Error(`no generated class for ${c.message}`);
  return cls.deserializeBinary(Buffer.from(c.bytes, 'base64'));
}

/** Field numbers present at the top level of an encoded message. */
function topLevelFieldNumbers(data: Uint8Array): number[] {
  const numbers: number[] = [];
  let i = 0;
  const varint = (): number => {
    let result = 0;
    let scale = 1;
    for (;;) {
      const b = data[i++];
      result += (b & 0x7f) * scale;
      scale *= 128;
      if (!(b & 0x80)) return result;
    }
  };
  while (i < data.length) {
    const key = varint();
    numbers.push(Math.floor(key / 8));
    const wireType = key % 8;
    if (wireType === 0) varint();
    else if (wireType === 1) i += 8;
    else if (wireType === 2) {
      const length = varint();
      i += length;
    }
    else if (wireType === 5) i += 4;
    else throw new Error(`unexpected wire type ${wireType}`);
  }
  return numbers;
}

let warn: jest.SpyInstance;

beforeEach(() => {
  objectTypes.resetWarningsForTests();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
  objectTypes.resetWarningsForTests();
});

const fallbackWarnings = (): number => warn.mock.calls.filter((args) => String(args[0]).includes('(LM-297)')).length;

// ---- Loading the old form translates it (metric 3) ----

describe.each(CASES.map((c) => [c.name, c] as const))('fixture row %s', (_name, c) => {
  test('decodes to the expected type and version', () => {
    const message = decode(c);
    expect(objectTypes.readType(message)).toBe(ObjectTypeProto[c.expect.object_type]);
    expect(objectTypes.readVersion(message)).toEqual(c.expect.version);
    expect(fallbackWarnings()).toBe(c.expect.warns ? 1 : 0);
  });

  test('re-serialises with the compact fields once upgraded', () => {
    const data = objectTypes.upgrade(decode(c)).serializeBinary();
    const expected: Record<string, number> = {
      object_type: ObjectTypeProto[c.expect.object_type],
      version_major: c.expect.version[0],
      version_minor: c.expect.version[1],
      version_patch: c.expect.version[2],
    };
    const present = topLevelFieldNumbers(data);
    for (const [name, number] of Object.entries(COMPACT_NUMBERS)) {
      expect([name, present.includes(number)]).toEqual([name, expected[name] !== 0]);
    }
    const reread = CLASSES.get(c.message)!.deserializeBinary(data);
    expect([reread.getObjectType(), reread.getVersionMajor(), reread.getVersionMinor(), reread.getVersionPatch()])
      .toEqual([expected.object_type, expected.version_major, expected.version_minor, expected.version_patch]);
    expect([reread.getObjectClass(), reread.getVersion()]).toEqual([c.object_class, c.version]);
  });
});

// ---- Reading the strings is deprecated (metric 4) ----

test('three strings-only decodes of one type warn once', () => {
  const c = CASES.find((row) => row.name === 'js-PositionFilterProto')!;
  for (let i = 0; i < 3; i++) {
    objectTypes.upgrade(decode(c));
  }
  expect(fallbackWarnings()).toBe(1);
});

test('the new form does not warn', () => {
  const message = objectTypes.stamp(new PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1');
  objectTypes.readType(message);
  objectTypes.readVersion(message);
  expect(fallbackWarnings()).toBe(0);
});

// ---- Writers set both forms (metric 2) ----

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

type Writer = [string, () => Promise<ObjectTyped>, ObjectTypeProto, string, string];

async function lastRequest<S extends object>(cls: { prototype: S }, call: (service: S) => Promise<unknown>): Promise<ObjectTyped> {
  const { service, requests } = capturingService(cls, () => new SummaryProto());
  await call(service);
  return requests[requests.length - 1];
}

const LIBRARY_WRITERS: Writer[] = [
  ['Price.fromSimple', async () => Price.fromSimple(UUID.random().toString(), 1, new Date()).proto,
    ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1'],
  ['Price.create', async () => Price.create(new Decimal(1), security(), ZonedDateTime.now()).proto,
    ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '0.0.1'],
  ['PositionFilter.toProto', async () => filter().toProto(),
    ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER, 'PositionFilter', '0.0.1'],
  ['QueryPositionRequest.toProto', async () => new QueryPositionRequest(
    filter(), PositionTypeProto.TRANSACTION, PositionViewProto.DEFAULT_VIEW, [], [], ZonedDateTime.now()).toProto(),
  ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST, '', '1.0.0'],
  ['Transaction', async () => transaction().proto,
    ObjectTypeProto.OBJECT_TYPE_TRANSACTION, 'Transaction', '0.0.1'],
  ['Transaction strategy allocation', async () => transaction().proto.getStrategyAllocation()!,
    ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION, 'StrategyAllocation', '0.0.1'],
  ['PriceService.validateCreateOrUpdate', () => lastRequest(PriceService, (s) => s.validateCreateOrUpdate(new PriceProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST, 'PriceRequest', '0.0.1'],
  ['PriceService.search', () => lastRequest(PriceService, (s) => s.search(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST, 'PriceRequest', '0.0.1'],
  ['SecurityService.validateCreateSecurity', () => lastRequest(SecurityService, (s) => s.validateCreateSecurity(new SecurityProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
  ['SecurityService.searchSecurity', () => lastRequest(SecurityService, (s) => s.searchSecurity(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
  ['TransactionService.validateCreateTransaction', () => lastRequest(TransactionService,
    (s) => s.validateCreateTransaction({ proto: new TransactionProto() } as Transaction)),
  ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST, 'TransactionRequest', '0.0.1'],
  ['TransactionService.searchTransaction', () => lastRequest(TransactionService, (s) => s.searchTransaction(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, 'SecurityRequest', '0.0.1'],
  ['PortfolioService.validateCreatePortfolio', () => lastRequest(PortfolioService, (s) => s.validateCreatePortfolio(new PortfolioProto())),
    ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
  ['PortfolioService.searchPortfolio', () => lastRequest(PortfolioService, (s) => s.searchPortfolio(asOf, filter())),
    ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
  ['LinkResolver securities', async () => (await linkResolverRequests())[0],
    ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST, 'SecurityRequest', '0.0.1'],
  ['LinkResolver portfolios', async () => (await linkResolverRequests())[1],
    ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST, 'PortfolioRequest', '0.0.1'],
  ['LinkResolver transactions', async () => (await linkResolverRequests())[2],
    ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST, 'TransactionRequest', '0.0.1'],
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

test.each(LIBRARY_WRITERS)('%s sets strings and compact fields that agree', async (_name, build, type, objectClass, version) => {
  const message = await build();

  expect([message.getObjectClass(), message.getVersion()]).toEqual([objectClass, version]);
  // The message's own type. Some JS writers put a query request's string on the
  // create request too; the string still sits on one enum value.
  expect(message.getObjectType()).toBe(type);
  if (objectClass) {
    expect(objectTypes.fromLegacy(objectClass)).not.toBe(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
  }
  expect([message.getVersionMajor(), message.getVersionMinor(), message.getVersionPatch()])
    .toEqual(objectTypes.parseVersion(version));
  expect(objectTypes.readVersion(message)).toEqual(objectTypes.parseVersion(version));
  expect(fallbackWarnings()).toBe(0);
});

test('stamp rejects a malformed version', () => {
  expect(() => objectTypes.stamp(new PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE, 'Price', '1.2')).toThrow();
});
