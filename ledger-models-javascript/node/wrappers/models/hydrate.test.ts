// Tests for the W1 async `hydrate()` method on Security/Portfolio wrappers
// and the LinkResolver default singleton.

import * as grpc from '@grpc/grpc-js';

import { UUID } from './utils/uuid';
import { ZonedDateTime } from './utils/datetime';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../fintekkers/models/portfolio/portfolio_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { SecurityClient } from '../../fintekkers/services/security-service/security_service_grpc_pb';
import { PortfolioClient } from '../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb';

import Security from './security/security';
import Portfolio from './portfolio/portfolio';
import LinkResolver from '../util/link-resolver';
import * as LinkCacheModule from '../util/link-cache';

/**
 * Minimal stub shape — captures the one method `LinkResolver` calls.
 * Cast to `SecurityClient` / `PortfolioClient` at the injection site so
 * the test reads `securityClient: stub(...)` without an `as any` escape.
 */
type GetByIdsCallback<TRes> = (
  err: grpc.ServiceError | null,
  res: TRes,
) => void;

interface SecurityGetByIdsOnly {
  getByIds(req: QuerySecurityRequestProto, cb: GetByIdsCallback<QuerySecurityResponseProto>): void;
}

interface PortfolioGetByIdsOnly {
  getByIds(req: QueryPortfolioRequestProto, cb: GetByIdsCallback<QueryPortfolioResponseProto>): void;
}

function makeAsOf(seconds = 1_700_000_000): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(seconds);
  ts.setNanos(0);
  const proto = new LocalTimestampProto();
  proto.setTimestamp(ts);
  proto.setTimeZone('UTC');
  return proto;
}

function fullSecurityProto(uuid: UUID, asOf: LocalTimestampProto, issuer: string): SecurityProto {
  const p = new SecurityProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf);
  p.setIssuerName(issuer);
  return p;
}

function fullPortfolioProto(uuid: UUID, asOf: LocalTimestampProto, name: string): PortfolioProto {
  const p = new PortfolioProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf);
  p.setPortfolioName(name);
  return p;
}

// Stub clients that return canned protos for GetByIds. The
// `LinkResolverOptions.{security,portfolio}Client` slots expect the full
// generated client class; we only implement the one method LinkResolver
// uses and assert the shape to the public client type at the injection
// site — keeps the test typed end-to-end without re-stubbing dozens of
// grpc.Client methods.
function stubSecurityClient(canned: SecurityProto): SecurityClient {
  const stub: SecurityGetByIdsOnly = {
    getByIds(_req, cb) {
      const resp = new QuerySecurityResponseProto();
      resp.setSecurityResponseList([canned]);
      cb(null, resp);
    },
  };
  return stub as unknown as SecurityClient;
}

function stubPortfolioClient(canned: PortfolioProto): PortfolioClient {
  const stub: PortfolioGetByIdsOnly = {
    getByIds(_req, cb) {
      const resp = new QueryPortfolioResponseProto();
      resp.setPortfolioResponseList([canned]);
      cb(null, resp);
    },
  };
  return stub as unknown as PortfolioClient;
}

/** Stand-in for the "other" client slot in `LinkResolverOptions` when a
 * test only exercises one entity type — never invoked, but the option is
 * required by the constructor. */
function unusedSecurityClient(): SecurityClient {
  return {
    getByIds(): never {
      throw new Error('unused stub: security client should not be called');
    },
  } as unknown as SecurityClient;
}

function unusedPortfolioClient(): PortfolioClient {
  return {
    getByIds(): never {
      throw new Error('unused stub: portfolio client should not be called');
    },
  } as unknown as PortfolioClient;
}

beforeEach(() => {
  LinkCacheModule.SECURITY.clear();
  LinkCacheModule.PORTFOLIO.clear();
  LinkResolver.setDefault(undefined);
});

afterEach(() => {
  LinkResolver.setDefault(undefined);
});

// ---- LinkResolver default singleton ----

test('LinkResolver.getDefault returns a stable singleton until cleared', () => {
  const a = LinkResolver.getDefault();
  const b = LinkResolver.getDefault();
  expect(a).toBe(b);
  LinkResolver.setDefault(undefined);
  const c = LinkResolver.getDefault();
  expect(c).not.toBe(a);
});

test('LinkResolver.setDefault overrides the singleton', () => {
  const custom = new LinkResolver();
  LinkResolver.setDefault(custom);
  expect(LinkResolver.getDefault()).toBe(custom);
});

// ---- Security.hydrate ----

test('Security.hydrate() on a non-link wrapper is a no-op', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(1);
  const sec = new Security(fullSecurityProto(uuid, asOf, 'NOT-LINKED'));
  // No resolver registered — would throw if hydrate tried to fetch.
  await sec.hydrate();
  expect(sec.getIssuerName()).toBe('NOT-LINKED');
});

test('Security.hydrate() fetches via the default resolver and swaps the proto', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(2);
  const resolved = fullSecurityProto(uuid, asOf, 'FROM-RESOLVER');
  const customResolver = new LinkResolver({
    securityClient: stubSecurityClient(resolved),
    portfolioClient: unusedPortfolioClient(),
  });
  LinkResolver.setDefault(customResolver);

  const sec = new Security(Security.linkOf(uuid, new ZonedDateTime(asOf)));
  expect(sec.isLink()).toBe(true);
  await sec.hydrate();
  expect(sec.getIssuerName()).toBe('FROM-RESOLVER');
  // After hydrate, accessor reads are sync — the proto has been swapped.
  expect(sec.proto.getIsLink()).toBe(false);
});

test('Security.hydrate() accepts an explicit resolver instead of the default', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(3);
  const resolved = fullSecurityProto(uuid, asOf, 'EXPLICIT');
  const explicit = new LinkResolver({
    securityClient: stubSecurityClient(resolved),
    portfolioClient: unusedPortfolioClient(),
  });

  const sec = new Security(Security.linkOf(uuid, new ZonedDateTime(asOf)));
  await sec.hydrate(explicit);
  expect(sec.getIssuerName()).toBe('EXPLICIT');
});

// ---- Portfolio.hydrate ----

test('Portfolio.hydrate() fetches via the default resolver and swaps the proto', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(4);
  const resolved = fullPortfolioProto(uuid, asOf, 'Strategy Z');
  const customResolver = new LinkResolver({
    securityClient: unusedSecurityClient(),
    portfolioClient: stubPortfolioClient(resolved),
  });
  LinkResolver.setDefault(customResolver);

  // Build a link Portfolio (no static helper on Portfolio; construct manually).
  const linkProto = new PortfolioProto();
  linkProto.setUuid(uuid.toUUIDProto());
  linkProto.setAsOf(asOf);
  linkProto.setIsLink(true);
  const p = new Portfolio(linkProto);
  expect(p.isLink()).toBe(true);
  await p.hydrate();
  expect(p.getPortfolioName()).toBe('Strategy Z');
});

test('Portfolio.hydrate() on a non-link wrapper is a no-op', async () => {
  const uuid = UUID.random();
  const asOf = makeAsOf(5);
  const p = new Portfolio(fullPortfolioProto(uuid, asOf, 'Already Full'));
  await p.hydrate();
  expect(p.getPortfolioName()).toBe('Already Full');
});
