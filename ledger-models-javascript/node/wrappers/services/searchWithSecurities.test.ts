import { PriceService } from './price-service/PriceService';
import LinkResolver from '../util/link-resolver';
import Price from '../models/price/Price';
import { UUID } from '../models/utils/uuid';
import { PositionFilter } from '../models/position/positionfilter';
import * as dt from '../models/utils/datetime';

import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { DecimalValueProto } from '../../fintekkers/models/util/decimal_value_pb';
import { IdentifierProto } from '../../fintekkers/models/security/identifier/identifier_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';

/**
 * End-to-end test: priceService.searchWithSecurities resolves all link
 * securities embedded in the returned Prices via a single batched
 * GetByIds RPC.
 */

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

function linkPriceProto(securityUuid: UUID, priceValue: string): PriceProto {
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
  return priceProto;
}

test('PriceService.searchWithSecurities returns hydrated Prices end-to-end', async () => {
  const uuidA = UUID.random();
  const uuidB = UUID.random();
  const store = new Map<string, SecurityProto>([
    [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
    [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
  ]);
  const callLog = { count: 0 };

  // Stub LinkResolver with a mock SecurityClient.
  const mockSecurityClient = {
    getByIds: (
      request: QuerySecurityRequestProto,
      callback: (err: Error | null, response: QuerySecurityResponseProto) => void,
    ) => {
      callLog.count += 1;
      const requested = request.getUuidsList().map((u) => UUID.fromU8Array(u.getRawUuid_asU8()).toString());
      const response = new QuerySecurityResponseProto();
      response.setSecurityResponseList(requested.map((u) => store.get(u)!).filter(Boolean));
      setImmediate(() => callback(null, response));
    },
  } as any;

  const linkResolver = new LinkResolver({
    securityClient: mockSecurityClient,
    portfolioClient: {} as any,
  });

  // Stub PriceService.search to skip the gRPC stream and return canned Prices.
  const priceService = new PriceService();
  jest
    .spyOn(priceService, 'search')
    .mockResolvedValue([
      new Price(linkPriceProto(uuidA, '100')),
      new Price(linkPriceProto(uuidA, '101')),
      new Price(linkPriceProto(uuidB, '200')),
    ]);

  const asOf = dt.ZonedDateTime.now().toProto();
  const filter = new PositionFilter();

  const prices = await priceService.searchWithSecurities(asOf, filter, linkResolver);

  expect(prices).toHaveLength(3);
  // 1 batched RPC for 2 unique security UUIDs.
  expect(callLog.count).toBe(1);
  // Every Price now has a hydrated full Security embedded.
  for (const p of prices) {
    const sec = p.proto.getSecurity()!;
    expect(sec.getIsLink()).toBe(false);
    expect(['AAPL', 'MSFT']).toContain(sec.getIssuerName());
    expect(sec.getIdentifier()!.getIdentifierValue()).toMatch(/^TICKER-/);
  }
});
