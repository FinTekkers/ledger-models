// Verifies SecurityService / PortfolioService / PriceService / TransactionService
// each populate LinkCache on a successful createOrUpdate. Pure unit tests —
// the gRPC client is replaced via Object.assign on the service instance so we
// never hit the wire.

import { UUID } from '../models/utils/uuid';
import { ZonedDateTime } from '../models/utils/datetime';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';

import { CreateSecurityResponseProto } from '../../fintekkers/requests/security/create_security_response_pb';
import { CreatePortfolioResponseProto } from '../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import { CreatePriceResponseProto } from '../../fintekkers/requests/price/create_price_response_pb';
import { CreateTransactionResponseProto } from '../../fintekkers/requests/transaction/create_transaction_response_pb';

import { SecurityService } from './security-service/SecurityService';
import { PortfolioService } from './portfolio-service/PortfolioService';
import { PriceService } from './price-service/PriceService';
import { TransactionService } from './transaction-service/TransactionService';
import Transaction from '../models/transaction/transaction';

import * as LinkCacheModule from '../util/link-cache';

function makeAsOf(epochSecondsOffset = 0): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(1_700_000_000 + epochSecondsOffset);
  ts.setNanos(0);
  const proto = new LocalTimestampProto();
  proto.setTimestamp(ts);
  proto.setTimeZone('UTC');
  return proto;
}

/**
 * Build a fake gRPC client that returns a pre-canned response on
 * createOrUpdate. Mimics the callback shape the real grpc-js client uses,
 * since the service wraps it with `promisify`.
 */
function fakeClient<TRes>(response: TRes): any {
  return {
    createOrUpdate(_req: unknown, cb: (err: unknown, res: TRes) => void) {
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

test('SecurityService.createSecurity populates LinkCache.SECURITY', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(0);

  const persisted = new SecurityProto();
  persisted.setUuid(uuid.toUUIDProto());
  persisted.setAsOf(asOf);
  persisted.setIssuerName('ACME');

  const response = new CreateSecurityResponseProto();
  response.setSecurityResponse(persisted);

  const svc = new SecurityService();
  (svc as any).client = fakeClient(response);

  await svc.createSecurity(new SecurityProto());

  const cached = LinkCacheModule.SECURITY.get(uuid.toString(), new ZonedDateTime(asOf));
  expect(cached).toBeDefined();
  expect(cached!.getIssuerName()).toBe('ACME');
});

test('PortfolioService.createPortfolio populates LinkCache.PORTFOLIO', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(1);

  const persisted = new PortfolioProto();
  persisted.setUuid(uuid.toUUIDProto());
  persisted.setAsOf(asOf);
  persisted.setPortfolioName('Strategy Z');

  const response = new CreatePortfolioResponseProto();
  response.addPortfolioResponse(persisted);

  const svc = new PortfolioService();
  (svc as any).client = fakeClient(response);

  await svc.createPortfolio(new PortfolioProto());

  const cached = LinkCacheModule.PORTFOLIO.get(uuid.toString(), new ZonedDateTime(asOf));
  expect(cached).toBeDefined();
  expect(cached!.getPortfolioName()).toBe('Strategy Z');
});

test('PriceService.createOrUpdate populates LinkCache.PRICE', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(2);

  const persisted = new PriceProto();
  persisted.setUuid(uuid.toUUIDProto());
  persisted.setAsOf(asOf);

  const response = new CreatePriceResponseProto();
  response.addPriceResponse(persisted);

  const svc = new PriceService();
  (svc as any).client = fakeClient(response);

  await svc.createOrUpdate(new PriceProto());

  const cached = LinkCacheModule.PRICE.get(uuid.toString(), new ZonedDateTime(asOf));
  expect(cached).toBeDefined();
});

test('TransactionService.createTransaction populates LinkCache.TRANSACTION', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(3);

  const persisted = new TransactionProto();
  persisted.setUuid(uuid.toUUIDProto());
  persisted.setAsOf(asOf);

  const response = new CreateTransactionResponseProto();
  response.setTransactionResponse(persisted);

  const svc = new TransactionService();
  (svc as any).client = fakeClient(response);

  await svc.createTransaction(new Transaction(new TransactionProto()));

  const cached = LinkCacheModule.TRANSACTION.get(uuid.toString(), new ZonedDateTime(asOf));
  expect(cached).toBeDefined();
});
