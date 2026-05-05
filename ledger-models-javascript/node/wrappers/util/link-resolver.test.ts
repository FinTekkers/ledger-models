import LinkResolver from './link-resolver';
import Price from '../models/price/Price';
import { UUID } from '../models/utils/uuid';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { DecimalValueProto } from '../../fintekkers/models/util/decimal_value_pb';
import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';

// Minimal mock for the security gRPC client. The LinkResolver only calls
// `getByIds`; we node-style invoke the callback with a fake response built
// from a pre-canned UUID → SecurityProto map.
function mockSecurityClient(store: Map<string, SecurityProto>, callLog: { count: number; uuids: string[][] }) {
  return {
    getByIds: (
      request: QuerySecurityRequestProto,
      callback: (err: Error | null, response: QuerySecurityResponseProto) => void,
    ) => {
      const uuidProtos = request.getUuidsList();
      const requestedUuids = uuidProtos.map((u) => UUID.fromU8Array(u.getRawUuid_asU8()).toString());
      callLog.count += 1;
      callLog.uuids.push(requestedUuids);

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

function mockPortfolioClient(store: Map<string, PortfolioProto>, callLog: { count: number; uuids: string[][] }) {
  return {
    getByIds: (
      request: QueryPortfolioRequestProto,
      callback: (err: Error | null, response: QueryPortfolioResponseProto) => void,
    ) => {
      const uuidProtos = request.getUuidsList();
      const requestedUuids = uuidProtos.map((u) => UUID.fromU8Array(u.getRawUuid_asU8()).toString());
      callLog.count += 1;
      callLog.uuids.push(requestedUuids);

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

function fullSecurity(uuid: UUID, issuerName: string): SecurityProto {
  const proto = new SecurityProto();
  proto.setObjectClass('Security');
  proto.setVersion('0.0.1');
  proto.setUuid(uuid.toUUIDProto());
  proto.setIsLink(false);
  proto.setIssuerName(issuerName);
  const ident = new IdentifierProto();
  ident.setIdentifierValue(`TICKER-${issuerName}`);
  proto.setIdentifier(ident);
  return proto;
}

function linkPrice(securityUuid: UUID, priceValue: string): Price {
  const linkSec = new SecurityProto();
  linkSec.setUuid(securityUuid.toUUIDProto());
  linkSec.setIsLink(true);

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
  test('bulk resolveSecurities dedupes UUIDs (5 prices, 3 unique → 1 RPC, 3 UUIDs)', async () => {
    const uuidA = UUID.random();
    const uuidB = UUID.random();
    const uuidC = UUID.random();

    const store = new Map<string, SecurityProto>([
      [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
      [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
      [uuidC.toString(), fullSecurity(uuidC, 'GOOG')],
    ]);
    const callLog = { count: 0, uuids: [] as string[][] };

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
    const callLog = { count: 0, uuids: [] as string[][] };

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
    const callLog = { count: 0, uuids: [] as string[][] };

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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

  test('caching disabled (cacheSize=0) re-RPCs every call', async () => {
    const uuid = UUID.random();
    const store = new Map<string, SecurityProto>([
      [uuid.toString(), fullSecurity(uuid, 'AAPL')],
    ]);
    const callLog = { count: 0, uuids: [] as string[][] };

    const resolver = new LinkResolver({
      cacheSize: 0,
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
    });

    await resolver.getSecurity(uuid);
    await resolver.getSecurity(uuid);

    expect(callLog.count).toBe(2);
  });

  test('non-link items pass through unchanged (resolveSecurities is a no-op for them)', async () => {
    const callLog = { count: 0, uuids: [] as string[][] };
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(new Map(), callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
    const callLog = { count: 0, uuids: [] as string[][] };
    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(new Map(), callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
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
    const callLog = { count: 0, uuids: [] as string[][] };

    const resolver = new LinkResolver({
      securityClient: mockSecurityClient(store, callLog),
      portfolioClient: mockPortfolioClient(new Map(), { count: 0, uuids: [] }),
    });

    // First call: 2 unique UUIDs → 1 RPC fetching both.
    await resolver.resolveSecurities([linkPrice(uuidA, '1'), linkPrice(uuidB, '2')]);
    expect(callLog.count).toBe(1);
    expect(callLog.uuids[0].length).toBe(2);

    // Second call: both UUIDs already cached → 0 additional RPCs.
    await resolver.resolveSecurities([linkPrice(uuidA, '3'), linkPrice(uuidB, '4')]);
    expect(callLog.count).toBe(1);
  });
});
