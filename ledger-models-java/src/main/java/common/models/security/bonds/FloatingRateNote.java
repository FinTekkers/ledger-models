package common.models.security.bonds;

import common.models.security.*;
import fintekkers.models.security.ProductTypeProto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * A Floating rate bond issued by the US treasury. The coupon is based on the 13 week bill.
 */
public class FloatingRateNote extends BondSecurity implements IndexLinkedSecurity{
    private BigDecimal spread;
    private Security index;
    private BigDecimal couponRate;

    public FloatingRateNote(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    public BigDecimal getSpread() {
        return spread;
    }

    public void setSpread(BigDecimal spread) {
        this.spread = spread;
    }


    public Security getIndex() {
        throw new UnsupportedOperationException("Not supported yet. Need to think this through:" +
                "" +
                "1a/ Index could just be a security. E.g. Index = Treasury FRN Index. " +
                "Perhaps it would be an index security that has an identifier. It has the logic embedded " +
                "in it that knows how to look up other securities to resolve. In this case the index would have " +
                "to know to find securities with 13 week maturities, find the auction dates, resolve the data " +
                "and stitch it together. Perhaps makes sense to think through the response structure to the client " +
                "before modelling. " +
                "" +
                "Why do we need this:" +
                "* As the rate changes over time, we need the ability to query rates as of a point in time. This " +
                "is needed in turn to calculate interest" +
                "TODO: Given the Fed holdings of this are smaller than TIPS, perhaps we start with TIPS. "
                );
    }

    public void setIndex(Security index) {
        this.index = index;
    }

    @Override
    public void setCouponRate(BigDecimal couponRate) {
        this.couponRate = couponRate;
    }

    /**
     *
     * @return Returns the spread of the FRN
     */
    @Override
    public BigDecimal getCouponRate() {
        return getSpread();
    }

    public BigDecimal getCouponRate(LocalDate asOf) {
        throw new UnsupportedOperationException("Unsupported for FRNs currently. Need to implement");
    }

    @Override
    public CouponType getCouponType() {
        return CouponType.FLOAT;
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.TREASURY_FRN;
    }
}
