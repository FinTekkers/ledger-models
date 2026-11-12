package common.models.security;

import common.models.postion.Field;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-465: a bond carries callable and its first call_date. The call date is
 * never the maturity date: maturity_date and getField(MATURITY_DATE) stay the
 * legal final maturity.
 */
class CallableBondTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2026, 11, 12, 17, 0, 0, 0, ZoneId.of("America/New_York"));
    // 912810CK2, 10 3/8% Bonds of 2004-2009: called 2004-11-15, legal maturity 2009-11-15.
    private static final LocalDate CALL_DATE = LocalDate.of(2004, 11, 15);
    private static final LocalDate MATURITY = LocalDate.of(2009, 11, 15);
    private static final LocalDate EPOCH = LocalDate.of(1970, 1, 1);

    private static SecurityProto bond(BondDetailsProto.Builder details) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.TREASURY_BOND)
                .setIssuerName("US Treasury")
                .addIdentifiers(IdentifierProto.newBuilder()
                        .setIdentifierType(IdentifierTypeProto.CUSIP)
                        .setIdentifierValue("912810CK2"))
                .setBondDetails(details.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(MATURITY)))
                .build();
    }

    private static SecurityProto callableBond() {
        return bond(BondDetailsProto.newBuilder()
                .setCallable(true)
                .setCallDate(ProtoSerializationUtil.serializeLocalDate(CALL_DATE)));
    }

    /** Serializes through the wrapper, parses the bytes and wraps them again. */
    private static Security rewrap(Security security) throws Exception {
        return Security.fromProto(SecurityProto.parseFrom(security.getProto().toByteArray()));
    }

    @Test
    void callableBond_wireRoundTrip_keepsAllThreeValues() throws Exception {
        SecurityProto decoded = SecurityProto.parseFrom(callableBond().toByteArray());

        assertTrue(decoded.getBondDetails().getCallable());
        assertTrue(decoded.getBondDetails().hasCallDate());

        BondSecurity bond = assertInstanceOf(BondSecurity.class, Security.fromProto(decoded));
        assertTrue(bond.isCallable());
        assertEquals(CALL_DATE, bond.getCallDate());
        assertEquals(MATURITY, bond.getMaturityDate());
    }

    @Test
    void callableBond_resavedThroughWrapper_keepsAllThreeValues() throws Exception {
        BondSecurity bond = assertInstanceOf(BondSecurity.class, rewrap(Security.fromProto(callableBond())));

        assertTrue(bond.isCallable());
        assertEquals(CALL_DATE, bond.getCallDate());
        assertEquals(MATURITY, bond.getMaturityDate());
    }

    @Test
    void getFieldMaturityDate_isTheLegalMaturity_notTheCallDate() throws Exception {
        Security security = rewrap(Security.fromProto(callableBond()));

        assertEquals(MATURITY, security.getField(Field.MATURITY_DATE));
        assertNotEquals(CALL_DATE, security.getField(Field.MATURITY_DATE));
    }

    @Test
    void setters_roundTripThroughBytes() throws Exception {
        BondSecurity bond = (BondSecurity) Security.fromProto(bond(BondDetailsProto.newBuilder()));
        bond.setCallable(true);
        bond.setCallDate(CALL_DATE);

        BondSecurity decoded = assertInstanceOf(BondSecurity.class, rewrap(bond));
        assertTrue(decoded.isCallable());
        assertEquals(CALL_DATE, decoded.getCallDate());
        assertEquals(MATURITY, decoded.getMaturityDate());
    }

    @Test
    void setCallDateNull_clearsTheField() throws Exception {
        BondSecurity bond = (BondSecurity) Security.fromProto(callableBond());
        bond.setCallDate(null);

        assertFalse(bond.getProto().getBondDetails().hasCallDate());
        assertNull(bond.getCallDate());
        BondSecurity decoded = (BondSecurity) rewrap(bond);
        assertFalse(decoded.getProto().getBondDetails().hasCallDate());
        assertNull(decoded.getCallDate());
    }

    @Test
    void setCallableFalse_keepsCallDate() {
        BondSecurity bond = (BondSecurity) Security.fromProto(callableBond());
        bond.setCallable(false);

        assertFalse(bond.isCallable());
        assertEquals(CALL_DATE, bond.getCallDate());
    }

    @Test
    void nonCallableBond_roundTrip_callDateUnset() throws Exception {
        SecurityProto decoded = SecurityProto.parseFrom(bond(BondDetailsProto.newBuilder()).toByteArray());

        assertFalse(decoded.getBondDetails().getCallable());
        assertFalse(decoded.getBondDetails().hasCallDate());

        BondSecurity bond = assertInstanceOf(BondSecurity.class, rewrap(Security.fromProto(decoded)));
        assertFalse(bond.isCallable());
        assertNull(bond.getCallDate());
        assertNotEquals(EPOCH, bond.getCallDate());
        assertEquals(MATURITY, bond.getMaturityDate());
    }
}
