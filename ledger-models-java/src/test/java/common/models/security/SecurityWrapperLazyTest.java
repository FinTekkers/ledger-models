package common.models.security;

import com.google.protobuf.CodedOutputStream;
import com.google.protobuf.Timestamp;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.io.ByteArrayOutputStream;
import java.time.ZonedDateTime;

/**
 * Wrapper invariants for the proto-backed Security wrapper.
 *
 * Phase 1 of FinTekkers/second-brain#335, sub-issue FinTekkers/second-brain#338.
 * Validates:
 *   - validTo / validFrom read from the proto on each call. Repeated reads
 *     return VALUE-equal results (proto-backed accessors return fresh
 *     ZonedDateTime instances; the previous identity-cache invariant is
 *     no longer the design, per the user-directed test triage on PR #225).
 *   - Explicit setValidTo() — including setValidTo(null) for resurrection
 *     per second-brain#316 §2.2 — wins over the proto value via the overlay.
 *   - Proto evolution: a synthetic unknown-tag field survives wrapper
 *     round-trip via proto3 unknown-field tolerance.
 *   - is_link=true link-mode proto continues to fire throwIfLink guards.
 *   - Bitemporal round-trip: valid_from / valid_to survive via getProto().
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
        // Canonical entry point post-#338 — wraps the proto directly.
        return Security.fromProto(proto);
    }

    // ------------------------------------------------------------------
    // Proto-backed validTo — value read from proto on each call
    // ------------------------------------------------------------------

    @Test
    public void validTo_decodedFromProto_onRead() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);

        ZonedDateTime decoded = security.getValidTo();
        Assertions.assertNotNull(decoded,
                "validTo must be decoded from proto.valid_to (correctness fix #338)");
        Assertions.assertEquals(1_700_000_000L, decoded.toEpochSecond());
    }

    @Test
    public void validTo_repeatedReadsReturnEqualValues() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);

        ZonedDateTime first = security.getValidTo();
        ZonedDateTime second = security.getValidTo();
        Assertions.assertEquals(first, second,
                "validTo repeated reads must be value-equal — proto-backed accessors return fresh instances but with the same value");
    }

    @Test
    public void validTo_nullProto_returnsNull_andDoesNotThrow() {
        // POJO-constructed Security (no valid_to in the baseline proto).
        Security s = DummyEquityObjects.getDummySecurity();
        Assertions.assertNull(s.getValidTo(),
                "Security with no valid_to in proto returns null");
    }

    @Test
    public void validTo_protoHasNoValidTo_returnsNull() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        Assertions.assertFalse(base.hasValidTo(),
                "precondition: dummy proto does not carry valid_to");

        Security security = freshFromProto(base);
        Assertions.assertNull(security.getValidTo(),
                "missing valid_to in proto → getter returns null");
        Assertions.assertNull(security.getValidTo(),
                "repeated read returns null");
    }

    // ------------------------------------------------------------------
    // setValidTo wins over proto (including null for resurrection)
    // ------------------------------------------------------------------

    @Test
    public void setValidTo_overridesProtoValue() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);
        ZonedDateTime override = ZonedDateTime.parse("2027-01-01T00:00:00Z[UTC]");
        security.setValidTo(override);

        Assertions.assertEquals(override, security.getValidTo(),
                "explicit setValidTo must win over the proto's valid_to");
    }

    @Test
    public void setValidTo_null_resurrection_winsOverProto() {
        // Per second-brain#316 §2.2, setValidTo(null) is "resurrection".
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        SecurityProto withValidTo = base.toBuilder().setValidTo(ts(1_700_000_000L)).build();

        Security security = freshFromProto(withValidTo);
        Assertions.assertNotNull(security.getValidTo(),
                "precondition: proto has valid_to set");

        security.setValidTo(null);
        Assertions.assertNull(security.getValidTo(),
                "setValidTo(null) must win over proto.valid_to — resurrection per #316 §2.2");
    }

    // ------------------------------------------------------------------
    // Proto-backed validFrom — value from proto wins over local-clock default
    // ------------------------------------------------------------------

    @Test
    public void validFrom_decodedFromProto_winsOverLocalClockDefault() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        long protoEpoch = 1_500_000_000L; // 2017-07-14
        SecurityProto withValidFrom = base.toBuilder().setValidFrom(ts(protoEpoch)).build();

        Security security = freshFromProto(withValidFrom);

        ZonedDateTime validFrom = security.getValidFrom();
        Assertions.assertEquals(protoEpoch, validFrom.toEpochSecond(),
                "validFrom must come from proto.valid_from, not the parent's local-clock default");
    }

    @Test
    public void validFrom_repeatedReadsReturnEqualValues() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        SecurityProto withValidFrom = base.toBuilder().setValidFrom(ts(1_500_000_000L)).build();

        Security security = freshFromProto(withValidFrom);
        Assertions.assertEquals(security.getValidFrom(), security.getValidFrom(),
                "validFrom repeated reads must be value-equal");
    }

    // ------------------------------------------------------------------
    // Proto evolution — unknown field round-trips through the wrapper
    // ------------------------------------------------------------------

    @Test
    public void unknownProtoField_appendedToBytes_roundTripsThroughWrapper() throws Exception {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        byte[] canonical = base.toByteArray();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CodedOutputStream cos = CodedOutputStream.newInstance(out);
        cos.writeString(999, "FUTURE_FIELD_VALUE");
        cos.flush();
        byte[] extra = out.toByteArray();

        byte[] combined = new byte[canonical.length + extra.length];
        System.arraycopy(canonical, 0, combined, 0, canonical.length);
        System.arraycopy(extra, 0, combined, canonical.length, extra.length);

        SecurityProto reparsed = Assertions.assertDoesNotThrow(
                () -> SecurityProto.parseFrom(combined),
                "proto3 must parse unknown tag 999 without error");

        Security security = Security.fromProto(reparsed);
        SecurityProto reserialized = security.getProto();

        byte[] outBytes = reserialized.toByteArray();
        Assertions.assertTrue(
                containsByteSequence(outBytes, extra),
                "unknown tag-999 field must survive round-trip via the proto's unknownFields");
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
    // is_link guards still fire after the wrapper refactor
    // ------------------------------------------------------------------

    @Test
    public void isLink_guards_continueToFireOnAccessors() {
        java.util.UUID uuid = java.util.UUID.randomUUID();
        SecurityProto linkProto = Security.linkOf(uuid, ZonedDateTime.now());
        Security linkSecurity = freshFromProto(linkProto);

        Assertions.assertTrue(linkSecurity.isLink(),
                "wrapper built from link-mode proto must report isLink=true");
        Assertions.assertThrows(
                IllegalStateException.class,
                linkSecurity::getIssuer,
                "throwIfLink must fire on getIssuer for a link-mode Security");
        Assertions.assertThrows(
                IllegalStateException.class,
                linkSecurity::getAssetClass,
                "throwIfLink must fire on getAssetClass");
    }

    // ------------------------------------------------------------------
    // Bitemporal round-trip — proto valid_from / valid_to via getProto()
    // ------------------------------------------------------------------

    @Test
    public void bitemporal_validFrom_validTo_surviveRoundTrip() {
        SecurityProto base = DummyBondObjects.getDummySecurity().getProto();
        SecurityProto withBitemporal = base.toBuilder()
                .setValidFrom(ts(1_500_000_000L))
                .setValidTo(ts(1_700_000_000L))
                .build();

        Security security = Security.fromProto(withBitemporal);

        Assertions.assertEquals(1_500_000_000L, security.getValidFrom().toEpochSecond());
        Assertions.assertEquals(1_700_000_000L, security.getValidTo().toEpochSecond());

        SecurityProto out = security.getProto();
        Assertions.assertTrue(out.hasValidFrom(),
                "valid_from must survive getProto() round-trip");
        Assertions.assertTrue(out.hasValidTo(),
                "valid_to must survive getProto() round-trip");
        Assertions.assertEquals(1_500_000_000L, out.getValidFrom().getTimestamp().getSeconds());
        Assertions.assertEquals(1_700_000_000L, out.getValidTo().getTimestamp().getSeconds());
    }

    // ------------------------------------------------------------------
    // UUID-handling regressions caught by backend-dev-ledger PR #65 rebase
    // ------------------------------------------------------------------

    @Test
    public void fromProto_withoutUuid_synthesizesUuid_andReflectsIntoGetProto() {
        // Regression A from FinTekkers/ledger-service PR #65: when the input
        // proto carries no UUID, the wrapper must (a) synthesize a UUID
        // (today: UUID.randomUUID()) AND (b) reflect it back into the proto
        // returned by getProto(). Pre-fix, the synthesized UUID lived only
        // on the wrapper's parent id field; the response proto was missing
        // the server-assigned UUID.
        SecurityProto withoutUuid = SecurityProto.newBuilder()
                .setProductType(fintekkers.models.security.ProductTypeProto.COMMON_STOCK)
                .setIssuerName("anonymous")
                .build();
        Assertions.assertFalse(withoutUuid.hasUuid(),
                "precondition: input proto has no UUID");

        Security security = Security.fromProto(withoutUuid);

        Assertions.assertNotNull(security.getID(),
                "wrapper must synthesize a UUID when input proto has none");

        SecurityProto out = security.getProto();
        Assertions.assertTrue(out.hasUuid(),
                "synthesized UUID must be reflected into the proto returned by getProto()");
        java.util.UUID protoUuid = protos.serializers.util.proto.ProtoSerializationUtil
                .deserializeUUID(out.getUuid());
        Assertions.assertEquals(security.getID(), protoUuid,
                "the UUID in the proto must match the wrapper's id");
    }

    @Test
    public void fromProto_withShortUuid_rejectsWithIllegalArgumentException() {
        // Regression B from FinTekkers/ledger-service PR #65: a 4-byte
        // (short/malformed) raw_uuid must be rejected at wrapper
        // construction time. Pre-#338, SecuritySerializer.deserialize
        // threw IllegalArgumentException (mapped to gRPC INVALID_ARGUMENT
        // at the service layer); the new wrapper path must preserve the
        // same validation.
        fintekkers.models.util.Uuid.UUIDProto shortUuid =
                fintekkers.models.util.Uuid.UUIDProto.newBuilder()
                        .setRawUuid(com.google.protobuf.ByteString.copyFrom(new byte[]{1, 2, 3, 4}))
                        .build();
        SecurityProto withShortUuid = SecurityProto.newBuilder()
                .setUuid(shortUuid)
                .setProductType(fintekkers.models.security.ProductTypeProto.COMMON_STOCK)
                .build();

        IllegalArgumentException ex = Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> Security.fromProto(withShortUuid),
                "Security.fromProto must reject a 4-byte raw_uuid");
        Assertions.assertTrue(ex.getMessage().contains("Invalid UUID"),
                "Exception message should reference invalid UUID; got: " + ex.getMessage());
    }

    @Test
    public void fromProto_withEmptyUuid_fallsThroughToSynthesizedUuid() {
        // The 0-byte edge case is distinct from short/malformed: an empty
        // raw_uuid indicates "no UUID supplied" (create-without-id flow)
        // rather than malformed input. Wrapper treats it the same as
        // !hasUuid() — synthesize, reflect into proto.
        fintekkers.models.util.Uuid.UUIDProto emptyUuid =
                fintekkers.models.util.Uuid.UUIDProto.newBuilder().build();
        SecurityProto withEmptyUuid = SecurityProto.newBuilder()
                .setUuid(emptyUuid)
                .setProductType(fintekkers.models.security.ProductTypeProto.COMMON_STOCK)
                .setIssuerName("anonymous")
                .build();

        Security security = Security.fromProto(withEmptyUuid);
        Assertions.assertNotNull(security.getID(),
                "empty raw_uuid should fall through to synthesized UUID");
        Assertions.assertTrue(security.getProto().hasUuid(),
                "synthesized UUID must be reflected into the proto");
    }

    @Test
    public void mutationOverlay_setValidTo_thenGetProto_reflectsMutation() {
        SecurityProto base = DummyEquityObjects.getDummySecurity().getProto();
        Security security = Security.fromProto(base);

        ZonedDateTime mutation = ZonedDateTime.parse("2027-01-01T00:00:00Z[UTC]");
        security.setValidTo(mutation);

        SecurityProto out = security.getProto();
        Assertions.assertTrue(out.hasValidTo(),
                "overlay must merge setValidTo into the proto returned by getProto()");
        Assertions.assertEquals(mutation.toEpochSecond(),
                out.getValidTo().getTimestamp().getSeconds(),
                "overlay merge must preserve the mutation value");
    }
}
