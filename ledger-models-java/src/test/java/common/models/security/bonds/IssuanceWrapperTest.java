package common.models.security.bonds;

import fintekkers.models.security.bond.AuctionTypeProto;
import fintekkers.models.security.bond.IssuanceProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.InvalidProtocolBufferException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import testutil.Decimals;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class IssuanceWrapperTest {

    private static LocalDateProto dateProto(LocalDate d) {
        return LocalDateProto.newBuilder()
                .setYear(d.getYear()).setMonth(d.getMonthValue()).setDay(d.getDayOfMonth())
                .build();
    }

    private static DecimalValueProto decimal(String v) {
        return Decimals.decimal(v);
    }

    @Test
    public void issuanceWrapper_exposesAllTypedAccessors() {
        LocalDate announcement = LocalDate.of(2024, 1, 9);
        LocalDate issue = LocalDate.of(2024, 1, 15);
        IssuanceProto proto = IssuanceProto.newBuilder()
                .setAuctionAnnouncementDate(dateProto(announcement))
                .setAuctionIssueDate(dateProto(issue))
                .setPostAuctionOutstandingQuantity(decimal("44000000000"))
                .setAuctionOfferingAmount(decimal("45000000000"))
                .setAuctionType(AuctionTypeProto.SINGLE_PRICE)
                .setPriceForSinglePriceAuction(decimal("99.875"))
                .setTotalAccepted(decimal("45000347500"))
                .setMatureSecurityAmount(decimal("45000000000"))
                .build();

        Issuance wrapper = new Issuance(proto);

        assertEquals(announcement, wrapper.getAnnouncementDate());
        assertEquals(issue, wrapper.getIssueDate());
        assertEquals(new BigDecimal("45000000000"), wrapper.getOriginalFaceValue());
        assertEquals(new BigDecimal("45000347500"), wrapper.getTotalAccepted());
        assertEquals(new BigDecimal("44000000000"), wrapper.getPostAuctionOutstandingQuantity());
        assertEquals(new BigDecimal("45000000000"), wrapper.getMatureSecurityAmount());
        assertEquals(new BigDecimal("99.875"), wrapper.getPriceForSinglePriceAuction());
        assertEquals(AuctionTypeProto.SINGLE_PRICE, wrapper.getAuctionType());
    }

    @Test
    public void issuanceWrapper_returnsNullForUnsetFields() {
        Issuance wrapper = new Issuance(IssuanceProto.newBuilder().build());

        assertEquals(null, wrapper.getAnnouncementDate());
        assertEquals(null, wrapper.getIssueDate());
        assertEquals(null, wrapper.getOriginalFaceValue());
        assertEquals(null, wrapper.getTotalAccepted());
        assertEquals(null, wrapper.getPostAuctionOutstandingQuantity());
        assertEquals(null, wrapper.getMatureSecurityAmount());
        assertEquals(null, wrapper.getPriceForSinglePriceAuction());
        // AuctionType has a proto3 default (UNKNOWN_AUCTION_TYPE), not null.
        assertNotNull(wrapper.getAuctionType());
        assertEquals(AuctionTypeProto.UNKNOWN_AUCTION_TYPE, wrapper.getAuctionType());
    }

    /** LM-365: high_discount_rate is field 28, a DecimalValueProto with presence. */
    @Test
    public void highDiscountRate_isField28Decimal() {
        FieldDescriptor f = IssuanceProto.getDescriptor().findFieldByNumber(28);
        assertNotNull(f);
        assertEquals("high_discount_rate", f.getName());
        assertEquals(DecimalValueProto.getDescriptor(), f.getMessageType());
    }

    @Test
    public void highDiscountRate_survivesRoundtripAndIsUnsetByDefault() throws InvalidProtocolBufferException {
        assertFalse(IssuanceProto.newBuilder().build().hasHighDiscountRate());

        IssuanceProto original = IssuanceProto.newBuilder().setHighDiscountRate(decimal("4.215")).build();
        IssuanceProto parsed = IssuanceProto.parseFrom(original.toByteArray());

        assertTrue(parsed.hasHighDiscountRate());
        assertEquals("4.215", Decimals.text(parsed.getHighDiscountRate()));
    }
}
