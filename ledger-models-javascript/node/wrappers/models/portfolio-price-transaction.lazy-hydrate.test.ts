// Lazy-hydrate tests for Portfolio / Price / Transaction wrappers.
// Mirror of security.lazy-hydrate.test.ts — cache-only design, throws on miss.

import Portfolio from './portfolio/portfolio';
import Price from './price/Price';
import Transaction from './transaction/transaction';
import { UUID } from './utils/uuid';
import { ZonedDateTime } from './utils/datetime';

import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { TransactionProto } from '../../fintekkers/models/transaction/transaction_pb';
import { DecimalValueProto } from '../../fintekkers/models/util/decimal_value_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import * as LinkCache from '../util/link-cache';

function makeAsOf(epochSeconds = 1_700_000_000): ZonedDateTime {
  const ts = new Timestamp();
  ts.setSeconds(epochSeconds);
  ts.setNanos(0);
  const proto = new LocalTimestampProto();
  proto.setTimestamp(ts);
  proto.setTimeZone('UTC');
  return new ZonedDateTime(proto);
}

function linkPortfolio(uuid: UUID, asOf: ZonedDateTime): PortfolioProto {
  const p = new PortfolioProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(true);
  return p;
}

function fullPortfolio(uuid: UUID, asOf: ZonedDateTime, name: string): PortfolioProto {
  const p = new PortfolioProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(false);
  p.setPortfolioName(name);
  return p;
}

function linkPriceProto(uuid: UUID, asOf: ZonedDateTime): PriceProto {
  const p = new PriceProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(true);
  return p;
}

function fullPriceProto(uuid: UUID, asOf: ZonedDateTime, value: string): PriceProto {
  const p = new PriceProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(false);
  const dv = new DecimalValueProto();
  dv.setArbitraryPrecisionValue(value);
  p.setPrice(dv);
  return p;
}

function linkTxnProto(uuid: UUID, asOf: ZonedDateTime): TransactionProto {
  const p = new TransactionProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(true);
  return p;
}

function fullTxnProto(uuid: UUID, asOf: ZonedDateTime): TransactionProto {
  const p = new TransactionProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIsLink(false);
  p.setTradeName('TXN');
  return p;
}

beforeEach(() => {
  LinkCache.PORTFOLIO.clear();
  LinkCache.PRICE.clear();
  LinkCache.TRANSACTION.clear();
});

// ---- Portfolio ----

test('Portfolio getPortfolioName on link wrapper hydrates from cache', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(1);
  LinkCache.PORTFOLIO.put(uuid.toString(), fullPortfolio(uuid, asOf, 'Strategy Z'), asOf);

  const p = new Portfolio(linkPortfolio(uuid, asOf));
  expect(p.isLink()).toBe(true);
  expect(p.getPortfolioName()).toBe('Strategy Z');
  expect(p.proto.getIsLink()).toBe(false);
});

test('Portfolio cache miss throws with uuid in message', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(2);
  const p = new Portfolio(linkPortfolio(uuid, asOf));
  expect(() => p.getPortfolioName()).toThrow(new RegExp(uuid.toString()));
});

// ---- Price ----

test('Price getPrice on link wrapper hydrates from cache', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(3);
  LinkCache.PRICE.put(uuid.toString(), fullPriceProto(uuid, asOf, '123.45'), asOf);

  const pr = new Price(linkPriceProto(uuid, asOf));
  expect(pr.isLink()).toBe(true);
  expect(pr.getPrice().toString()).toBe('123.45');
});

test('Price cache miss throws with uuid in message', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(4);
  const pr = new Price(linkPriceProto(uuid, asOf));
  expect(() => pr.getPrice()).toThrow(new RegExp(uuid.toString()));
});

// ---- Transaction ----

test('Transaction getTradeName on link wrapper hydrates from cache', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(5);
  LinkCache.TRANSACTION.put(uuid.toString(), fullTxnProto(uuid, asOf), asOf);

  const t = new Transaction(linkTxnProto(uuid, asOf));
  expect(t.isLink()).toBe(true);
  expect(t.getTradeName()).toBe('TXN');
});

test('Transaction cache miss throws with uuid in message', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(6);
  const t = new Transaction(linkTxnProto(uuid, asOf));
  expect(() => t.getTradeName()).toThrow(new RegExp(uuid.toString()));
});

test('Transaction link-safe accessors do not hydrate', () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(7);
  // No cache entry, no fetcher — link-safe accessors must still work.
  const t = new Transaction(linkTxnProto(uuid, asOf));
  expect(t.isLink()).toBe(true);
  expect(t.getID().toString()).toBe(uuid.toString());
});
