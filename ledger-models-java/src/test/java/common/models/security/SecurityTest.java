package common.models.security;

import common.models.postion.Field;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.security.SecuritySerializer;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.time.ZonedDateTime;

class SecurityTest {
    @Test
    public void testDescription() {
        CashSecurity settlementCurrency = DummyEquityObjects.getDummySecurity().getSettlementCurrency();
        Assertions.assertTrue(settlementCurrency.getDisplayDescription().contains("USD"));
        Assertions.assertTrue(settlementCurrency.getIssuer().contains("USD"));

        Security equitySecurity = DummyEquityObjects.getDummySecurity();
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains(equitySecurity.getIdentifiers().get(0).getIdentifier()));
        Assertions.assertTrue(equitySecurity.getIssuer().contains("dummy"));
        Assertions.assertTrue(equitySecurity.getField(Field.SECURITY_ISSUER_NAME).toString().contains("dummy"));

        equitySecurity.getIdentifiers().clear();
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("EquitySecurity[dummy issuer]"));

        equitySecurity.addIdentifier(new Identifier(IdentifierType.EXCH_TICKER, "MSFT"));
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("MSFT"));

        Security bondSecurity = DummyBondObjects.getDummySecurity();
        Assertions.assertTrue(bondSecurity.getDisplayDescription().contains(bondSecurity.getIdentifiers().get(0).getIdentifier()));

        bondSecurity.getIdentifiers().clear();
        Assertions.assertTrue(bondSecurity.getDisplayDescription().startsWith("Bond: No Security Id"));
    }

    // --- Phase A (second-brain#316): canonical soft-delete check via validTo ---
    // SecurityProto.deleted_at is removed (tag 15 reserved); the time-based
    // isDeleted(asOf) check on validTo is the single source of truth.

    @Test
    public void isDeleted_nullValidTo_returnsFalse() {
        Security s = DummyEquityObjects.getDummySecurity();
        // Default DummyEquityObjects.getDummySecurity() leaves validTo null.
        Assertions.assertNull(s.getValidTo(), "precondition: dummy must have null validTo");
        Assertions.assertFalse(s.isDeleted(), "null validTo is always active");
        Assertions.assertFalse(s.isDeleted(ZonedDateTime.now().plusYears(100)),
                "null validTo is active even arbitrarily far in the future");
    }

    @Test
    public void isDeleted_pastValidTo_returnsTrue() {
        Security s = DummyEquityObjects.getDummySecurity();
        ZonedDateTime past = ZonedDateTime.now().minusDays(1);
        s.setValidTo(past);
        Assertions.assertTrue(s.isDeleted(), "past validTo means deleted now");
    }

    @Test
    public void isDeleted_futureValidTo_returnsFalseNow_trueLater() {
        Security s = DummyEquityObjects.getDummySecurity();
        ZonedDateTime tomorrow = ZonedDateTime.now().plusDays(1);
        s.setValidTo(tomorrow);
        Assertions.assertFalse(s.isDeleted(), "future validTo is not yet deleted today");
        Assertions.assertTrue(s.isDeleted(tomorrow.plusSeconds(1)),
                "future validTo is deleted once asOf catches up");
    }

    @Test
    public void isDeleted_asOfParameterSwitchesAnswer() {
        Security s = DummyEquityObjects.getDummySecurity();
        ZonedDateTime cutoff = ZonedDateTime.parse("2026-01-01T00:00:00Z[UTC]");
        s.setValidTo(cutoff);
        Assertions.assertFalse(s.isDeleted(ZonedDateTime.parse("2025-06-01T00:00:00Z[UTC]")),
                "asOf BEFORE validTo: not deleted");
        Assertions.assertTrue(s.isDeleted(ZonedDateTime.parse("2026-06-01T00:00:00Z[UTC]")),
                "asOf AFTER validTo: deleted");
    }

    @Test
    public void protoRoundTrip_legacyDeletedAtBytes_areSilentlyDropped() throws Exception {
        // Simulates an old persisted blob that carries the now-removed tag 15
        // (deleted_at, LocalTimestampProto). proto3 must ignore unknown fields
        // — see /specs/soft-delete-validto-collapse.md §4.2.
        //
        // Wire encoding for tag 15 LocalTimestampProto (message), with a
        // single nested google.protobuf.Timestamp (seconds=1700000000):
        //   field 15, wire type 2 (length-delimited) → key = (15<<3)|2 = 0x7A
        //   inner LocalTimestampProto: field 1 (timestamp), wire type 2
        //     inner Timestamp: field 1 (seconds), wire type 0 (varint), value=1700000000
        //   We pack:
        //     [0x7A][len_outer][0x0A][len_inner][0x08][varint(1700000000)]
        //
        // We piggy-back on a real serialized SecurityProto and append the
        // legacy tag-15 bytes — proto3 parsers concatenate fields and the
        // tag is reserved so the value is dropped without error.
        Security original = DummyBondObjects.getDummySecurity();
        SecurityProto base = SecuritySerializer.getInstance().serialize(original);

        // Build the legacy tag-15 bytes manually using protobuf-java's
        // ByteString and a CodedOutputStream.
        java.io.ByteArrayOutputStream timestampBuf = new java.io.ByteArrayOutputStream();
        com.google.protobuf.CodedOutputStream tsOut = com.google.protobuf.CodedOutputStream.newInstance(timestampBuf);
        tsOut.writeInt64(1, 1700000000L);
        tsOut.flush();
        byte[] innerTimestampBytes = timestampBuf.toByteArray();

        java.io.ByteArrayOutputStream localTimestampBuf = new java.io.ByteArrayOutputStream();
        com.google.protobuf.CodedOutputStream ltOut = com.google.protobuf.CodedOutputStream.newInstance(localTimestampBuf);
        ltOut.writeBytes(1, com.google.protobuf.ByteString.copyFrom(innerTimestampBytes));
        ltOut.flush();
        byte[] localTimestampBytes = localTimestampBuf.toByteArray();

        java.io.ByteArrayOutputStream securityExt = new java.io.ByteArrayOutputStream();
        com.google.protobuf.CodedOutputStream secOut = com.google.protobuf.CodedOutputStream.newInstance(securityExt);
        secOut.writeBytes(15, com.google.protobuf.ByteString.copyFrom(localTimestampBytes));
        secOut.flush();

        byte[] combined = new byte[base.toByteArray().length + securityExt.size()];
        System.arraycopy(base.toByteArray(), 0, combined, 0, base.toByteArray().length);
        System.arraycopy(securityExt.toByteArray(), 0, combined, base.toByteArray().length, securityExt.size());

        SecurityProto reparsed = Assertions.assertDoesNotThrow(
                () -> SecurityProto.parseFrom(combined),
                "proto3 must accept and ignore the reserved tag 15");

        // The legacy field is silently dropped; canonical fields survive.
        Assertions.assertEquals(base.getUuid(), reparsed.getUuid(),
                "uuid must survive the round-trip with legacy bytes appended");
    }

    @Test
    public void testSecurityType() {
        Security equitySecurity = DummyEquityObjects.getDummySecurity();
        Assertions.assertEquals(ProductTypeProto.COMMON_STOCK, equitySecurity.getProductType());

        BondSecurity bondSecurity = DummyBondObjects.getDummySecurity();
        Assertions.assertEquals(ProductTypeProto.TREASURY_NOTE, bondSecurity.getProductType());

        Assertions.assertEquals(ProductTypeProto.CURRENCY, CashSecurity.USD.getProductType());

        Security security = new Security(null, null, null, null);
        Assertions.assertEquals(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, security.getProductType());
    }
}
