package common.models.security;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.security.EquityDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-479: EquityDetailsProto.shares_outstanding round-trips, stays absent when
 * unset, and EquitySecurity.getSharesOutstanding never reports absent as 0.
 */
class EquitySharesOutstandingTest {

    private static final BigDecimal ONE_BILLION = new BigDecimal("1000000000");

    private static SecurityProto etf(EquityDetailsProto details) {
        SecurityProto.Builder builder = SecurityProto.newBuilder().setProductType(ProductTypeProto.ETF);
        if (details != null) {
            builder.setEquityDetails(details);
        }
        return builder.build();
    }

    private static EquityDetailsProto withShares(DecimalValueProto shares) {
        return EquityDetailsProto.newBuilder().setSharesOutstanding(shares).build();
    }

    private static SecurityProto roundTrip(SecurityProto proto) throws InvalidProtocolBufferException {
        return SecurityProto.parseFrom(proto.toByteArray());
    }

    private static EquitySecurity wrap(SecurityProto proto) {
        Security security = Security.fromProto(proto);
        assertInstanceOf(EquitySecurity.class, security);
        return (EquitySecurity) security;
    }

    @Test
    void sharesOutstandingRoundTripsThroughBytes() throws Exception {
        SecurityProto parsed = roundTrip(etf(withShares(ProtoSerializationUtil.serializeBigDecimal(ONE_BILLION))));

        assertTrue(parsed.hasEquityDetails());
        assertTrue(parsed.getEquityDetails().hasSharesOutstanding());
        assertEquals(0, ONE_BILLION.compareTo(
                ProtoSerializationUtil.deserializeBigDecimal(parsed.getEquityDetails().getSharesOutstanding())));
    }

    @Test
    void unsetSharesOutstandingStaysAbsentAfterRoundTrip() throws Exception {
        SecurityProto parsed = roundTrip(etf(EquityDetailsProto.getDefaultInstance()));

        assertTrue(parsed.hasEquityDetails());
        assertFalse(parsed.getEquityDetails().hasSharesOutstanding());
    }

    @Test
    void etfGetterReturnsValueAfterSerializeParseFromProto() throws Exception {
        SecurityProto parsed = roundTrip(etf(withShares(ProtoSerializationUtil.serializeBigDecimal(ONE_BILLION))));

        BigDecimal shares = wrap(parsed).getSharesOutstanding();
        assertNotNull(shares);
        assertEquals(0, ONE_BILLION.compareTo(shares));
    }

    @Test
    void getterReturnsNullWhenFieldAbsentAfterRoundTrip() throws Exception {
        SecurityProto parsed = roundTrip(etf(EquityDetailsProto.getDefaultInstance()));

        assertNull(wrap(parsed).getSharesOutstanding());
    }

    @Test
    void getterReturnsNullWhenEquityDetailsAbsent() throws Exception {
        SecurityProto parsed = roundTrip(etf(null));

        assertNull(wrap(parsed).getSharesOutstanding());
    }

    @Test
    void getterReturnsNullForPresentButEmptyDecimalWithoutThrowing() throws Exception {
        SecurityProto parsed = roundTrip(etf(withShares(DecimalValueProto.getDefaultInstance())));
        assertTrue(parsed.getEquityDetails().hasSharesOutstanding());

        EquitySecurity security = wrap(parsed);
        assertDoesNotThrow(security::getSharesOutstanding);
        assertNull(security.getSharesOutstanding());
    }
}
