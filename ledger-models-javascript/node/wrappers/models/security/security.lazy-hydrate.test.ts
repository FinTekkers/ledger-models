import Security from './security';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';

import * as LinkCache from '../../util/link-cache';

import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

function makeAsOf(epochSecondsOffset: number = 0): ZonedDateTime {
  const ts = new Timestamp();
  ts.setSeconds(1700000000 + epochSecondsOffset);
  ts.setNanos(0);
  const proto = new LocalTimestampProto();
  proto.setTimestamp(ts);
  proto.setTimeZone('UTC');
  return new ZonedDateTime(proto);
}

function makeFullProto(uuid: UUID, asOf: ZonedDateTime, issuer = 'ACME'): SecurityProto {
  const p = new SecurityProto();
  p.setUuid(uuid.toUUIDProto());
  p.setAsOf(asOf.toProto());
  p.setIssuerName(issuer);
  p.setAssetClass('Equity');
  return p;
}

describe('Security lazy hydrate', () => {
  beforeEach(() => {
    LinkCache.SECURITY.clear();
  });

  // ---- A. Hydration on accessors ----

  test('A — getAssetClass on link-mode wrapper hydrates from cache', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x42));
    const asOf = makeAsOf();
    const resolved = makeFullProto(uuid, asOf, 'ACME-resolved');
    LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);

    const wrapper = new Security(Security.linkOf(uuid, asOf));
    expect(wrapper.isLink()).toBe(true);

    expect(wrapper.getAssetClass()).toBe('Equity');
    // After first accessor, wrapper has swapped in the resolved proto.
    expect(wrapper.proto.getIsLink()).toBe(false);
  });

  test('A — link-safe accessors do not require hydration', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x07));
    const asOf = makeAsOf();
    // Cache is empty — link-safe accessors must still work.
    const wrapper = new Security(Security.linkOf(uuid, asOf));

    expect(wrapper.isLink()).toBe(true);
    expect(wrapper.getID().toString()).toBe(uuid.toString());
    expect(wrapper.getAsOf().getSeconds()).toBe(asOf.getSeconds());
  });

  // ---- B. Cache behavior ----

  test('B.i — first accessor call hydrates from a pre-populated cache', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x01));
    const asOf = makeAsOf();
    const resolved = makeFullProto(uuid, asOf, 'hydrated');
    LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);

    const wrapper = new Security(Security.linkOf(uuid, asOf));
    expect(wrapper.getIssuerName()).toBe('hydrated');
  });

  test('B.ii — second accessor call hits the swapped proto, not the cache', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x02));
    const asOf = makeAsOf();
    const resolved = makeFullProto(uuid, asOf, 'firstRead');
    LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);

    const wrapper = new Security(Security.linkOf(uuid, asOf));
    expect(wrapper.getAssetClass()).toBe('Equity');

    // Evict the cache; wrapper has already swapped in the proto so the
    // second read must succeed without touching the cache.
    LinkCache.SECURITY.evict(uuid.toString());
    expect(wrapper.getIssuerName()).toBe('firstRead');
  });

  test('B.iii — fresh wrapper for same (uuid, asOf) reads cache populated by prior wrapper', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x03));
    const asOf = makeAsOf();
    const resolved = makeFullProto(uuid, asOf, 'shared');
    LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);

    // Two independent wrappers share the cache entry.
    const wrapperA = new Security(Security.linkOf(uuid, asOf));
    const wrapperB = new Security(Security.linkOf(uuid, asOf));
    expect(wrapperA.getIssuerName()).toBe('shared');
    expect(wrapperB.getIssuerName()).toBe('shared');
  });

  // ---- C. asOf semantics ----

  test('C — link asOf differing from cached asOf is a miss', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x04));
    const asOfT1 = makeAsOf(0);
    const asOfT2 = makeAsOf(86400);
    LinkCache.SECURITY.put(uuid.toString(), makeFullProto(uuid, asOfT2, 'T2'), asOfT2);

    const wrapper = new Security(Security.linkOf(uuid, asOfT1));
    expect(() => wrapper.getIssuerName()).toThrow(/LinkCache miss/);
  });

  // ---- D. Resolve failure ----

  test('D — cache miss throws with uuid in message', () => {
    const uuid = UUID.fromU8Array(new Uint8Array(16).fill(0x05));
    const asOf = makeAsOf();
    const wrapper = new Security(Security.linkOf(uuid, asOf));

    expect(() => wrapper.getAssetClass()).toThrow(new RegExp(uuid.toString()));
  });
});
