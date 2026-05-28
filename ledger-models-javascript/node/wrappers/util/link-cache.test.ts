import { LinkCache, SECURITY, PORTFOLIO, PRICE, TRANSACTION } from './link-cache';
import { ZonedDateTime } from '../models/utils/datetime';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { SecurityProto } from '../../fintekkers/models/security/security_pb';

function makeAsOf(epochSecondsOffset: number = 0): ZonedDateTime {
  const ts = new Timestamp();
  ts.setSeconds(1700000000 + epochSecondsOffset);
  ts.setNanos(0);
  const proto = new LocalTimestampProto();
  proto.setTimestamp(ts);
  proto.setTimeZone('UTC');
  return new ZonedDateTime(proto);
}

function makeSecurityProto(name: string): SecurityProto {
  const p = new SecurityProto();
  p.setIssuerName(name);
  return p;
}

describe('LinkCache', () => {
  beforeEach(() => {
    SECURITY.clear();
    PORTFOLIO.clear();
    PRICE.clear();
    TRANSACTION.clear();
  });

  // ---- A. Basic get/put ----

  test('get on empty cache returns undefined', () => {
    expect(SECURITY.get('uuid-1', makeAsOf())).toBeUndefined();
  });

  test('put then get with matching asOf returns value', () => {
    const asOf = makeAsOf();
    const val = makeSecurityProto('ACME');
    SECURITY.put('uuid-1', val, asOf);
    expect(SECURITY.get('uuid-1', asOf)).toBe(val);
  });

  test('get with different asOf returns undefined', () => {
    SECURITY.put('uuid-1', makeSecurityProto('v1'), makeAsOf(0));
    expect(SECURITY.get('uuid-1', makeAsOf(10))).toBeUndefined();
  });

  // ---- B. Null asOf semantics ----

  test('null asOf within TTL returns value', () => {
    const cache = new LinkCache<SecurityProto>(60_000);
    cache.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
    expect(cache.get('uuid-1', null)).toBeDefined();
  });

  test('null asOf past TTL returns undefined', async () => {
    const cache = new LinkCache<SecurityProto>(50);
    cache.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(cache.get('uuid-1', null)).toBeUndefined();
  });

  test('non-null asOf is not subject to TTL', async () => {
    const cache = new LinkCache<SecurityProto>(50);
    const asOf = makeAsOf();
    const val = makeSecurityProto('v1');
    cache.put('uuid-1', val, asOf);
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Bitemporal: history doesn't change, exact-asOf reads never expire.
    expect(cache.get('uuid-1', asOf)).toBe(val);
  });

  // ---- C. Newest-wins merge ----

  test('put with older asOf does not overwrite newer', () => {
    SECURITY.put('uuid-1', makeSecurityProto('newer'), makeAsOf(100));
    SECURITY.put('uuid-1', makeSecurityProto('older'), makeAsOf(50));
    expect(SECURITY.get('uuid-1', makeAsOf(100))?.getIssuerName()).toBe('newer');
    expect(SECURITY.get('uuid-1', makeAsOf(50))).toBeUndefined();
  });

  test('put with newer asOf replaces older', () => {
    SECURITY.put('uuid-1', makeSecurityProto('older'), makeAsOf(50));
    SECURITY.put('uuid-1', makeSecurityProto('newer'), makeAsOf(100));
    expect(SECURITY.get('uuid-1', makeAsOf(100))?.getIssuerName()).toBe('newer');
  });

  // ---- D. Evict & clear ----

  test('evict removes entry', () => {
    SECURITY.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
    SECURITY.evict('uuid-1');
    expect(SECURITY.get('uuid-1', makeAsOf())).toBeUndefined();
  });

  test('clear empties cache', () => {
    SECURITY.put('a', makeSecurityProto('a'), makeAsOf());
    SECURITY.put('b', makeSecurityProto('b'), makeAsOf());
    SECURITY.clear();
    expect(SECURITY.size()).toBe(0);
  });

  // ---- E. Singleton isolation ----

  test('singletons have independent state', () => {
    SECURITY.put('uuid-1', makeSecurityProto('sec'), makeAsOf());
    expect(PORTFOLIO.get('uuid-1', makeAsOf())).toBeUndefined();
    expect(PRICE.get('uuid-1', makeAsOf())).toBeUndefined();
    expect(TRANSACTION.get('uuid-1', makeAsOf())).toBeUndefined();
  });
});
