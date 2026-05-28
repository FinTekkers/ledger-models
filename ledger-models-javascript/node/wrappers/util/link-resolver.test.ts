import LinkResolver from './link-resolver';
import Price from '../models/price/Price';
import { UUID } from '../models/utils/uuid';
import * as LinkCacheModuleTop from './link-cache';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { DecimalValueProto } from '../../fintekkers/models/util/decimal_value_pb';
import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';

interface CallLog {
  count: number;
  uuids: string[][];
  asOfSeconds: (number | null)[];   // null = unset (latest)
}

function newCallLog(): CallLog {
  return { count: 0, uuids: [], asOfSeconds: [] };
}

// Minimal mock for the security gRPC client. The LinkResolver only calls
// `getByIds`; we node-style invoke the callback with a fake response built
// from a pre-canned UUID → SecurityProto map. The mock also records each
// call's as_of (in seconds since epoch, or null if unset) so tests can
// assert per-bucket RPC behavior.
function mockSecurityClient(store: Map<string, SecurityProto>, callLog: CallLog) {
  return {
    getByIds: (
      request: QuerySecurityRequestProto,
      callback: (err: Error | null, response: QuerySecurityResponseProto) => void,
    ) => {
      const uuidProtos = request.getUuidsList();
      const requestedUuids = uuidProtos.map((u) => UUID.fromU8Array(u.getRawUuid_asU8()).toString());
      callLog.count += 1;
      callLog.uuids.push(requestedUuids);
      const asOf = request.getAsOf();
      callLog.asOfSeconds.push(asOf?.getTimestamp()?.getSeconds() ?? null);

      const response = new QuerySecurityResponseProto();
      const found: SecurityProto[] = [];
      for (const u of requestedUuids) {
        const proto = store.get(u);
        if (proto) found.push(proto);
      }
      response.setSecurityResponseList(found);
      // Schedule async like a real gRPC client would.
      setImmediate(() => callback(null, response));
    },
  } as any;
}

function mockPortfolioClient(store: Map<string, PortfolioProto>, callLog: CallLog) {
  return {
    getByIds: (
      request: QueryPortfolioRequestProto,
      callback: (err: Error | null, response: QueryPortfolioResponseProto) => void,
    ) => {
      const uuidProtos = request.getUuidsList();
      const requestedUuids = uuidProtos.map((u) => UUID.fromU8Array(u.getRawUuid_asU8()).toString());
      callLog.count += 1;
      callLog.uuids.push(requestedUuids);
      const asOf = request.getAsOf();
      callLog.asOfSeconds.push(asOf?.getTimestamp()?.getSeconds() ?? null);

      const response = new QueryPortfolioResponseProto();
      const found: PortfolioProto[] = [];
      for (const u of requestedUuids) {
        const proto = store.get(u);
        if (proto) found.push(proto);
      }
      response.setPortfolioResponseList(found);
      setImmediate(() => callback(null, response));
    },
  } as any;
}

function makeAsOf(epochSeconds: number): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(epochSeconds);
  ts.setNanos(0);
  const lt = new LocalTimestampProto();
  lt.setTimestamp(ts);
  lt.setTimeZone('UTC');
  return lt;
}

function fullSecurity(uuid: UUID, issuerName: string): SecurityProto {
  const proto = new SecurityProto();
  proto.setObjectClass('Security');
  proto.setVersion('0.0.1');
  proto.setUuid(uuid.toUUIDProto());
  proto.setIsLink(false);
  proto.setIssuerName(issuerName);
  const ident = new IdentifierProto();
  ident.setIdentifierValue(`TICKER-${issuerName}`);
  proto.setIdentifiersList([ident]);
  return proto;
}

function linkPrice(securityUuid: UUID, priceValue: string, asOf?: LocalTimestampProto): Price {
  const linkSec = new SecurityProto();
  linkSec.setUuid(securityUuid.toUUIDProto());
  linkSec.setIsLink(true);
  if (asOf) linkSec.setAsOf(asOf);

  const priceProto = new PriceProto();
  priceProto.setObjectClass('Price');
  priceProto.setVersion('0.0.1');
  priceProto.setUuid(UUID.random().toUUIDProto());
  priceProto.setSecurity(linkSec);
  const dv = new DecimalValueProto();
  dv.setArbitraryPrecisionValue(priceValue);
  priceProto.setPrice(dv);
  return new Price(priceProto);
}

describe('LinkResolver', () => {
  // Process-wide LinkCache singletons survive across tests, so clear them
  // between cases to keep tests independent (post-W4 the resolver no longer
  // owns its own cache).
  beforeEach(() => {
    LinkCacheModuleTop.SECURITY.clear();
    LinkCacheModuleTop.PORTFOLIO.clear();
  });

  test('bulk resolveSecurities dedupes UUIDs (5 prices, 3 unique → 1 RPC, 3 UUIDs)', async () => {
    const uuidA = UUID.random();
    const uuidB = UUID.random();
    const uuidC = UUID.random();

    const store = new Map<string, SecurityProto>([
      [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
      [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
      [uuidC.toString(), fullSecurity(uuidC, 'GOOG')],
    ]);
    const callLog = newCallLog();

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const prices = [
      linkPrice(uuidA, '100'),
      linkPrice(uuidA, '101'),
      linkPrice(uuidB, '200'),
      linkPrice(uuidA, '102'),
      linkPrice(uuidC, '300'),
    ];

    await resolver.resolveSecurities(prices);

    expect(callLog.count).toBe(1);
    expect(callLog.uuids[0].length).toBe(3);
    expect(new Set(callLog.uuids[0])).toEqual(new Set([uuidA.toString(), uuidB.toString(), uuidC.toString()]));

    // Each price's embedded security is now hydrated.
    for (const p of prices) {
      expect(p.proto.getSecurity()!.getIsLink()).toBe(false);
      expect(p.proto.getSecurity()!.getIssuerName().length).toBeGreaterThan(0);
    }
  });

  test('cache hit: second getSecurity call for the same UUID does not re-RPC', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const sec1 = await resolver.getSecurity(uuid);
    const sec2 = await resolver.getSecurity(uuid);

    expect(callLog.count).toBe(1);
    expect(sec1.getIssuerName()).toBe('AAPL');
    expect(sec2.getIssuerName()).toBe('AAPL');
  });

  test('concurrent same-UUID requests collapse to one RPC', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    // Fire N parallel calls for the same UUID before any resolves.
    const results = await Promise.all([
      resolver.getSecurity(uuid),
      resolver.getSecurity(uuid),
      resolver.getSecurity(uuid),
      resolver.getSecurity(uuid),
    ]);

    expect(callLog.count).toBe(1);
    for (const r of results) expect(r.getIssuerName()).toBe('AAPL');
  });

  test('LinkCache evict between calls forces refetch', async () => {
    // Post-W4 the resolver no longer owns its cache. Evict the entry from
    // LinkCache.SECURITY between calls to force a refetch — the equivalent
    // of the old `cacheSize=0` semantic.
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    await resolver.getSecurity(uuid);
    LinkCacheModuleTop.SECURITY.evict(uuid.toString());
    await resolver.getSecurity(uuid);

    expect(callLog.count).toBe(2);
  });

  test('non-link items pass through unchanged (resolveSecurities is a no-op for them)', async () => {
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(new Map(), callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    // Build a Price whose embedded Security is NOT a link (full entity).
    const fullSec = fullSecurity(UUID.random(), 'AAPL');
    const priceProto = new PriceProto();
    priceProto.setObjectClass('Price');
    priceProto.setUuid(UUID.random().toUUIDProto());
    priceProto.setSecurity(fullSec);
    const dv = new DecimalValueProto();
    dv.setArbitraryPrecisionValue('100');
    priceProto.setPrice(dv);
    const price = new Price(priceProto);

    await resolver.resolveSecurities([price]);

    expect(callLog.count).toBe(0);
    expect(price.proto.getSecurity()!.getIssuerName()).toBe('AAPL');
  });

  test('resolveSecurities skips items missing security', async () => {
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(new Map(), callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const priceProto = new PriceProto();
    priceProto.setObjectClass('Price');
    priceProto.setUuid(UUID.random().toUUIDProto());
    // No security set on this price.
    const dv = new DecimalValueProto();
    dv.setArbitraryPrecisionValue('100');
    priceProto.setPrice(dv);
    const price = new Price(priceProto);

    await resolver.resolveSecurities([price]);

    expect(callLog.count).toBe(0);
  });

  test('cache cross-call: a second resolveSecurities call reuses the cache from the first', async () => {
    const uuidA = UUID.random();
    const uuidB = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
      [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
    ]);
    const callLog = newCallLog();

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    // First call: 2 unique UUIDs → 1 RPC fetching both.
    await resolver.resolveSecurities([linkPrice(uuidA, '1'), linkPrice(uuidB, '2')]);
    expect(callLog.count).toBe(1);
    expect(callLog.uuids[0].length).toBe(2);

    // Second call: both UUIDs already cached → 0 additional RPCs.
    await resolver.resolveSecurities([linkPrice(uuidA, '3'), linkPrice(uuidB, '4')]);
    expect(callLog.count).toBe(1);
  });

  // ---------- as_of-aware behavior (per is_link_pattern.md addendum) ----------

  test('link without as_of → request omits as_of (server returns latest)', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    await resolver.resolveSecurities([linkPrice(uuid, '1')]);
    expect(callLog.count).toBe(1);
    expect(callLog.asOfSeconds[0]).toBeNull();
  });

  test('link with as_of → request carries that as_of', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const t1 = makeAsOf(1_700_000_000);
    await resolver.resolveSecurities([linkPrice(uuid, '1', t1)]);
    expect(callLog.count).toBe(1);
    expect(callLog.asOfSeconds[0]).toBe(1_700_000_000);
  });

  test('two as_of buckets for the same UUID → 2 separate RPCs (one per bucket)', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const t1 = makeAsOf(1_700_000_000);
    const t2 = makeAsOf(1_800_000_000);

    await resolver.resolveSecurities([
      linkPrice(uuid, '1', t1),
      linkPrice(uuid, '2', t2),
    ]);

    expect(callLog.count).toBe(2);
    expect(new Set(callLog.asOfSeconds)).toEqual(new Set([1_700_000_000, 1_800_000_000]));
  });

  test('same as_of for the same UUID → still 1 RPC (proper bucket dedupe)', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const t1a = makeAsOf(1_700_000_000);
    const t1b = makeAsOf(1_700_000_000); // same moment, different proto instance

    await resolver.resolveSecurities([
      linkPrice(uuid, '1', t1a),
      linkPrice(uuid, '2', t1b),
    ]);

    expect(callLog.count).toBe(1);
    expect(callLog.uuids[0]).toEqual([uuid.toString()]);
  });

  test('cache key includes as_of: latest cached does NOT serve a t1 lookup, and vice versa', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = newCallLog();
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const t1 = makeAsOf(1_700_000_000);

    // First: latest. RPC fired.
    await resolver.getSecurity(uuid);
    expect(callLog.count).toBe(1);
    expect(callLog.asOfSeconds[0]).toBeNull();

    // Second: as_of=t1. Should NOT be served by the "latest" cache → another RPC.
    await resolver.getSecurity(uuid, t1);
    expect(callLog.count).toBe(2);
    expect(callLog.asOfSeconds[1]).toBe(1_700_000_000);

    // Third: same (uuid, t1) → cache hit, no new RPC.
    await resolver.getSecurity(uuid, makeAsOf(1_700_000_000));
    expect(callLog.count).toBe(2);
  });
});

import * as LinkCacheModule from './link-cache';
import { ZonedDateTime } from '../models/utils/datetime';

describe('LinkResolver write-through to LinkCache', () => {
  beforeEach(() => {
    LinkCacheModule.SECURITY.clear();
    LinkCacheModule.PORTFOLIO.clear();
  });

  function fullSecurityWithAsOf(uuid: UUID, issuer: string, asOf: LocalTimestampProto): SecurityProto {
    const proto = fullSecurity(uuid, issuer);
    proto.setAsOf(asOf);
    return proto;
  }

  test('getSecurity populates LinkCache.SECURITY', async () => {
    const uuid = UUID.random();
    const asOf = makeAsOf(1_700_000_010);
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurityWithAsOf(uuid, 'ACME', asOf)],
    ]);
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, newCallLog()),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const out = await resolver.getSecurity(uuid, asOf);
    expect(out.getIssuerName()).toBe('ACME');

    const cached = LinkCacheModule.SECURITY.get(uuid.toString(), new ZonedDateTime(asOf));
    expect(cached).toBeDefined();
    expect(cached!.getIssuerName()).toBe('ACME');
  });

  test('resolveSecurities populates LinkCache.SECURITY', async () => {
    const uuid = UUID.random();
    const asOf = makeAsOf(1_700_000_011);
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurityWithAsOf(uuid, 'BULK', asOf)],
    ]);
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, newCallLog()),
      portfolioClient: mockPortfolioClient(new Map(), newCallLog()),
    });

    const linkSec = new SecurityProto();
    linkSec.setUuid(uuid.toUUIDProto());
    linkSec.setIsLink(true);
    linkSec.setAsOf(asOf);
    const priceProto = new PriceProto();
    priceProto.setUuid(UUID.random().toUUIDProto());
    priceProto.setSecurity(linkSec);
    const price = new Price(priceProto);

    await resolver.resolveSecurities([price]);

    const cached = LinkCacheModule.SECURITY.get(uuid.toString(), new ZonedDateTime(asOf));
    expect(cached).toBeDefined();
    expect(cached!.getIssuerName()).toBe('BULK');
  });
});
