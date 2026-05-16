// Time-based soft-delete tests for the Security wrapper.
//
// Phase A of /specs/soft-delete-validto-collapse.md
// (FinTekkers/second-brain#316). The SecurityProto.deleted_at field has been
// removed (tag 15 reserved). The single canonical soft-delete check is
// Security.isDeleted(asOf), which honours valid_to with a time-based
// comparison.

import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

function localTimestamp(seconds: number): LocalTimestampProto {
    const ts = new Timestamp();
    ts.setSeconds(seconds);
    ts.setNanos(0);
    const lt = new LocalTimestampProto();
    lt.setTimestamp(ts);
    lt.setTimeZone('UTC');
    return lt;
}

function securityWithValidTo(seconds: number | null): Security {
    const proto = new SecurityProto();
    if (seconds !== null) {
        proto.setValidTo(localTimestamp(seconds));
    }
    return new Security(proto);
}

describe('Security.isDeleted (Phase A — validTo time-based check)', () => {
    test('null validTo is never deleted', () => {
        const sec = securityWithValidTo(null);
        expect(sec.isDeleted()).toBe(false);
        expect(sec.isDeleted(new Date('2999-01-01T00:00:00Z'))).toBe(false);
    });

    test('past validTo is deleted now', () => {
        const past = Math.floor(Date.now() / 1000) - 86_400; // yesterday
        const sec = securityWithValidTo(past);
        expect(sec.isDeleted()).toBe(true);
    });

    test('future validTo is not yet deleted but becomes deleted when asOf catches up', () => {
        const future = Math.floor(Date.now() / 1000) + 86_400; // tomorrow
        const sec = securityWithValidTo(future);
        expect(sec.isDeleted()).toBe(false);
        const later = new Date((future + 1) * 1000);
        expect(sec.isDeleted(later)).toBe(true);
    });

    test('asOf parameter switches the answer', () => {
        // validTo fixed at 2026-01-01 UTC
        const cutoff = Math.floor(Date.UTC(2026, 0, 1) / 1000);
        const sec = securityWithValidTo(cutoff);
        expect(sec.isDeleted(new Date(Date.UTC(2025, 5, 1)))).toBe(false);
        expect(sec.isDeleted(new Date(Date.UTC(2026, 5, 1)))).toBe(true);
    });

    test('proto round-trip with legacy deleted_at bytes is silently dropped', () => {
        // Build canonical bytes then append a tag-15 LocalTimestampProto.
        // proto3 must ignore unknown fields; tag 15 is reserved on the new
        // schema so the value is dropped. See spec §4.2.
        const base = new SecurityProto();
        base.setIssuerName('legacy-issuer');
        const canonical = base.serializeBinary();

        // Inner Timestamp: field 1 (seconds), varint, value=1700000000
        //   key = (1<<3)|0 = 0x08
        const innerTs: number[] = [0x08];
        let v = 1_700_000_000;
        while (v >= 0x80) {
            innerTs.push((v & 0x7F) | 0x80);
            v >>>= 7;
        }
        innerTs.push(v);

        // LocalTimestampProto: field 1 (timestamp), length-delim
        const outer: number[] = [0x0A, innerTs.length, ...innerTs];

        // SecurityProto.deleted_at: field 15, length-delim
        //   key = (15<<3)|2 = 0x7A
        const legacy: number[] = [0x7A, outer.length, ...outer];

        const combined = new Uint8Array(canonical.length + legacy.length);
        combined.set(canonical, 0);
        combined.set(legacy, canonical.length);

        // Must not throw.
        const reparsed = SecurityProto.deserializeBinary(combined);
        expect(reparsed.getIssuerName()).toBe('legacy-issuer');
        // The legacy tag must NOT be silently mapped onto valid_to.
        expect(reparsed.hasValidTo()).toBe(false);
    });
});
