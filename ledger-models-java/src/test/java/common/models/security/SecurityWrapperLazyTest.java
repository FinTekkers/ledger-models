package common.models.security;

import com.google.protobuf.ByteString;
import com.google.protobuf.CodedOutputStream;
import com.google.protobuf.Timestamp;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.security.SecuritySerializer;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.io.ByteArrayOutputStream;
import java.time.ZonedDateTime;

/**
 * Lazy-decode wrapper invariants for the Security proto-side wrapper.
 *
 * Phase 1 of FinTekkers/second-brain#335, sub-issue
 * FinTekkers/second-brain#338. Validates:
 *   - validTo / validFrom lazy-decoded from the stashed _sourceProto on first
 *     read (correctness fix — pre-#338, validTo was always null and validFrom
 *     was local-clock-at-deserialize, dropping the proto's authoritative data).
 *   - Repeated reads return the cached instance (identity check).
 *   - Explicit setValidTo() — including setValidTo(null) for resurrection
 *     per second-brain#316 §2.2 — wins over the proto value.
 *   - Proto evolution: a synthetic unknown-tag field appended to the wire
 *     bytes round-trips through the wrapper without error and survives
 *     re-serialize via the stashed proto.
 *   - is_link=true link-mode proto continues to fire throwIfLink guards on
 *     accessors that should not be readable on a link reference.
 */
class SecurityWrapperLazyTest {

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static LocalTimestampProto ts(long epochSeconds) {
        return LocalTimestampProto.newBuilder()
                .setTimestamp(Timestamp.newBuilder().setSeconds(epochSeconds).build())
                .setTimeZone("UTC")
                .build();
    }

    private static Security freshFromProto(SecurityProto proto) {
        // Use the canonical serializer path so the test reflects how
        // production code obtains a Security from a proto.
        return SecuritySerializer.getInstance().deserialize(proto);
    }

    // ------------------------------------------------------------------
    // Lazy validTo — proto value decoded on first read, cached thereafter
    // ------------------------------------------------------------------

    @Test
    public void validTo_lazyDecodedFromProto_onFirstRead() {
        // Build a proto with valid_to set; round-trip into a Security wrapper.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto withValidTo = base.toBuilder()
                .setValidTo(ts(1_700_000_000L))
                .build();

        Security security = freshFromProto(withValidTo);

        ZonedDateTime decoded = security.getValidTo();
        Assertions.assertNotNull(decoded,
                "validTo must be lazy-decoded from _sourceProto.valid_to (correctness fix #338)");
        Assertions.assertEquals(1_700_000_000L, decoded.toEpochSecond());
    }

    @Test
    public void validTo_repeatedReadsReturnSameCachedInstance() {
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);

        ZonedDateTime first = security.getValidTo();
        ZonedDateTime second = security.getValidTo();
        Assertions.assertSame(first, second,
                "validTo must be cached after first decode — repeated reads return identity-equal instance");
    }

    @Test
    public void validTo_nullProto_returnsNull_andDoesNotThrow() {
        // Default DummyEquityObjects has no proto stashed at all (POJO-only).
        Security s = DummyEquityObjects.getDummySecurity();
        Assertions.assertNull(s.getValidTo(),
                "POJO-constructed Security with no stashed proto returns null validTo");
    }

    @Test
    public void validTo_protoHasNoValidTo_returnsNull() {
        // Proto with valid_to NOT set; lazy decode must return null cleanly.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        Assertions.assertFalse(base.hasValidTo(),
                "precondition: dummy proto does not carry valid_to");

        Security security = freshFromProto(base);
        Assertions.assertNull(security.getValidTo(),
                "missing valid_to in proto → lazy getter returns null (and caches null)");
        Assertions.assertNull(security.getValidTo(),
                "repeated read after null-cache returns null without re-decoding");
    }

    // ------------------------------------------------------------------
    // setValidTo wins over proto (including null for resurrection)
    // ------------------------------------------------------------------

    @Test
    public void setValidTo_overridesProtoValue() {
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);
        ZonedDateTime override = ZonedDateTime.parse("2027-01-01T00:00:00Z[UTC]");
        security.setValidTo(override);

        Assertions.assertEquals(override, security.getValidTo(),
                "explicit setValidTo must win over the proto's valid_to");
    }

    @Test
    public void setValidTo_null_resurrection_winsOverProto() {
        // Per second-brain#316 §2.2, setValidTo(null) is "resurrection" —
        // explicitly clear the soft-delete marker. This must win over
        // a stashed proto that carries a non-null valid_to.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);
        // First confirm the lazy decode would have returned a non-null:
        Assertions.assertNotNull(security.getValidTo(),
                "precondition: proto has valid_to set");

        // Now resurrect.
        security.setValidTo(null);
        Assertions.assertNull(security.getValidTo(),
                "setValidTo(null) must win over proto.valid_to — resurrection per #316 §2.2");
    }

    // ------------------------------------------------------------------
    // Lazy validFrom — proto wins over local-clock default
    // ------------------------------------------------------------------

    @Test
    public void validFrom_lazyDecodedFromProto_winsOverLocalClockDefault() {
        // The RawDataModelObject parent sets validFrom = ZonedDateTime.now() in
        // the constructor — a legacy default that pre-#338 was never overridden
        // by the proto's authoritative valid_from. After #338, the proto wins.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        long protoEpoch = 1_500_000_000L; // 2017-07-14
        SecurityProto withValidFrom = base.toBuilder().setValidFrom(ts(protoEpoch)).build();

        Security security = freshFromProto(withValidFrom);

        ZonedDateTime validFrom = security.getValidFrom();
        Assertions.assertEquals(protoEpoch, validFrom.toEpochSecond(),
                "validFrom must come from proto.valid_from, not the parent's local-clock default");
    }

    @Test
    public void validFrom_repeatedReadsReturnCached() {
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto withValidFrom = base.toBuilder().setValidFrom(ts(1_500_000_000L)).build();

        Security security = freshFromProto(withValidFrom);
        Assertions.assertSame(security.getValidFrom(), security.getValidFrom(),
                "validFrom must be cached after first decode");
    }

    // ------------------------------------------------------------------
    // Proto evolution — unknown field round-trips through the wrapper
    // ------------------------------------------------------------------

    @Test
    public void unknownProtoField_appendedToBytes_roundTripsThroughWrapper() throws Exception {
        // Simulate the scenario where ledger-models adds a new field at a tag
        // not in the current wrapper's vocabulary. The wrapper must NOT throw
        // when parsing the bytes (proto3 unknown-field tolerance), AND the
        // unknown bytes must survive a re-serialize via the stashed proto.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        byte[] canonical = base.toByteArray();

        // Append a fictional length-delimited field at tag 999 carrying a
        // short string. Wire encoding:
        //   key = (999 << 3) | 2 = 7994 → varint-encoded
        //   then length, then bytes.
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CodedOutputStream cos = CodedOutputStream.newInstance(out);
        cos.writeString(999, "FUTURE_FIELD_VALUE");
        cos.flush();
        byte[] extra = out.toByteArray();

        byte[] combined = new byte[canonical.length + extra.length];
        System.arraycopy(canonical, 0, combined, 0, canonical.length);
        System.arraycopy(extra, 0, combined, canonical.length, extra.length);

        // Parse — must succeed under proto3 unknown-field tolerance.
        SecurityProto reparsed = Assertions.assertDoesNotThrow(
                () -> SecurityProto.parseFrom(combined),
                "proto3 must parse unknown tag 999 without error");

        // Round-trip through the wrapper: deserialize → serialize → bytes
        // should retain the unknown field via the stashed-proto path.
        Security security = SecuritySerializer.getInstance().deserialize(reparsed);
        SecurityProto reserialized = SecuritySerializer.getInstance().serialize(security);

        // The reserialized bytes should still contain the tag-999 unknown
        // field — proto3 retains unknown fields via the message's unknownFields.
        byte[] outBytes = reserialized.toByteArray();
        Assertions.assertTrue(
                containsByteSequence(outBytes, extra),
                "unknown tag-999 field must survive round-trip via the stashed proto");
    }

    private static boolean containsByteSequence(byte[] haystack, byte[] needle) {
        outer:
        for (int i = 0; i <= haystack.length - needle.length; i++) {
            for (int j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) continue outer;
            }
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------
    // is_link guards still fire after the lazy-decode changes
    // ------------------------------------------------------------------

    @Test
    public void isLink_guards_continueToFireOnLazyAccessors() {
        // Build a link-mode proto via the existing Security.linkOf helper.
        // The wrapper's lazy validTo / validFrom getters do NOT guard
        // throwIfLink (validTo is a system-level field, valid even on a link
        // reference); but accessors that DO have the guard (getIssuer,
        // getAssetClass, etc.) must continue to throw — verifying no
        // unintended regression from the lazy refactor.
        java.util.UUID uuid = java.util.UUID.randomUUID();
        SecurityProto linkProto = Security.linkOf(uuid, ZonedDateTime.now());
        Security linkSecurity = freshFromProto(linkProto);

        Assertions.assertTrue(linkSecurity.isLink(),
                "wrapper built from link-mode proto must report isLink=true");
        Assertions.assertThrows(
                IllegalStateException.class,
                linkSecurity::getIssuer,
                "throwIfLink must still fire on getIssuer on a link-mode Security");
        Assertions.assertThrows(
                IllegalStateException.class,
                linkSecurity::getAssetClass,
                "throwIfLink must still fire on getAssetClass");
    }

    // ------------------------------------------------------------------
    // Bitemporal round-trip — proto valid_from / valid_to survive re-serialize
    // ------------------------------------------------------------------

    @Test
    public void bitemporal_validFrom_validTo_surviveRoundTrip() {
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyBondObjects.getDummySecurity());
        SecurityProto withBitemporal = base.toBuilder()
                .setValidFrom(ts(1_500_000_000L))
                .setValidTo(ts(1_700_000_000L))
                .build();

        Security security = SecuritySerializer.getInstance().deserialize(withBitemporal);

        // Reads return proto values (lazy decode).
        Assertions.assertEquals(1_500_000_000L, security.getValidFrom().toEpochSecond());
        Assertions.assertEquals(1_700_000_000L, security.getValidTo().toEpochSecond());

        // Re-serialize → proto bytes preserved via the stashed-proto path.
        SecurityProto out = SecuritySerializer.getInstance().serialize(security);
        Assertions.assertTrue(out.hasValidFrom(),
                "valid_from must survive serialize via the stashed proto");
        Assertions.assertTrue(out.hasValidTo(),
                "valid_to must survive serialize via the stashed proto");
        Assertions.assertEquals(1_500_000_000L, out.getValidFrom().getTimestamp().getSeconds());
        Assertions.assertEquals(1_700_000_000L, out.getValidTo().getTimestamp().getSeconds());
    }

    @Test
    public void setSecurityProto_invalidatesValidToCache() {
        // Build a Security with proto A (valid_to set to ts1), read validTo
        // to populate the cache, then swap in proto B (valid_to set to ts2)
        // via setSecurityProto. The next getValidTo must return ts2, not the
        // cached ts1.
        SecurityProto base = SecuritySerializer.getInstance()
                .serialize(DummyEquityObjects.getDummySecurity());
        SecurityProto protoA = base.toBuilder().setValidTo(ts(1_000_000L)).build();
        Security security = freshFromProto(protoA);

        Assertions.assertEquals(1_000_000L, security.getValidTo().toEpochSecond(),
                "precondition: first read decodes proto A's valid_to");

        SecurityProto protoB = base.toBuilder().setValidTo(ts(2_000_000L)).build();
        security.setSecurityProto(protoB);
        Assertions.assertEquals(2_000_000L, security.getValidTo().toEpochSecond(),
                "setSecurityProto must invalidate the cache so reads see the new proto");
    }
}
